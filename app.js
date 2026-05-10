const el = (id) => document.getElementById(id);

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  const digits = i === 0 ? 0 : n >= 10 ? 1 : 2;
  return `${n.toFixed(digits)} ${units[i]}`;
}

function formatDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(d);
}

function nepaliDigitsToLatin(input) {
  const map = {
    "०": "0",
    "१": "1",
    "२": "2",
    "३": "3",
    "४": "4",
    "५": "5",
    "६": "6",
    "७": "7",
    "८": "8",
    "९": "9",
  };
  return input.replace(/[०-९]/g, (d) => map[d] ?? d);
}

function normalize(str) {
  return (str ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function escapeHtml(s) {
  return (s ?? "")
    .toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderCards(files, view) {
  const resultsGrid = el("resultsGrid");
  resultsGrid.innerHTML = "";

  resultsGrid.classList.remove("grid--grid", "grid--list");
  resultsGrid.classList.add(view === "list" ? "grid--list" : "grid--grid");

  for (const f of files) {
    const yearLabel = f.year ? String(f.year) : "Unknown year";
    const sizeLabel = formatBytes(f.sizeBytes);
    const modifiedLabel = formatDate(f.modifiedISO);

    const card = document.createElement("a");
    card.className = `card ${view === "list" ? "card--list" : ""}`;
    card.href = f.href;
    card.target = "_blank";
    card.rel = "noopener";

    card.innerHTML = `
      <div class="card__top">
        <div class="badge">${escapeHtml(yearLabel)}</div>
        <div class="meta">
          <div>${escapeHtml(sizeLabel)}</div>
          <div>${escapeHtml(modifiedLabel)}</div>
        </div>
      </div>

      <div>
        <div class="card__title">${escapeHtml(f.title)}</div>
        <div class="card__sub">${escapeHtml(f.filename)}</div>
      </div>

      <div class="card__actions">
        <div class="download">Open PDF</div>
        <div class="arrow">↗</div>
      </div>
    `;

    resultsGrid.appendChild(card);
  }
}

function setToggleActive(activeId) {
  const btnGrid = el("btnGrid");
  const btnList = el("btnList");
  const view = activeId === "btnGrid" ? "grid" : "list";

  btnGrid.classList.toggle("is-active", view === "grid");
  btnGrid.setAttribute("aria-pressed", view === "grid" ? "true" : "false");
  btnList.classList.toggle("is-active", view === "list");
  btnList.setAttribute("aria-pressed", view === "list" ? "true" : "false");

  return view;
}

async function main() {
  const data = await fetch("./pdfs.json", { cache: "no-store" }).then((r) => r.json());
  const files = Array.isArray(data.files) ? data.files : [];

  el("statCount").textContent = `${files.length}`;
  const years = Array.from(new Set(files.map((f) => f.year).filter(Boolean))).sort((a, b) => b - a);
  el("statYears").textContent = `${years.length}`;

  // Populate filters
  const yearSelect = el("yearSelect");
  for (const y of years) {
    const opt = document.createElement("option");
    opt.value = String(y);
    opt.textContent = String(y);
    yearSelect.appendChild(opt);
  }

  const state = {
    q: "",
    year: "all",
    view: "grid",
  };

  const view = setToggleActive("btnGrid");
  state.view = view;

  el("btnGrid").addEventListener("click", () => {
    state.view = setToggleActive("btnGrid");
    render();
  });
  el("btnList").addEventListener("click", () => {
    state.view = setToggleActive("btnList");
    render();
  });

  function render() {
    const q = normalize(state.q);
    const year = state.year;

    let filtered = files;
    if (year !== "all") {
      filtered = filtered.filter((f) => String(f.year ?? "") === year);
    }

    if (q) {
      const qNormLatin = normalize(nepaliDigitsToLatin(q));
      filtered = filtered.filter((f) => {
        const t = normalize(nepaliDigitsToLatin(f.title));
        const fn = normalize(nepaliDigitsToLatin(f.filename));
        const yr = String(f.year ?? "");
        return t.includes(qNormLatin) || fn.includes(qNormLatin) || yr.includes(q);
      });
    }

    const showing = filtered.length;
    el("resultsCount").textContent = `${showing} result${showing === 1 ? "" : "s"}`;

    if (year !== "all" && q) {
      el("activeFilters").textContent = `Year: ${year} • Search: "${state.q}"`;
    } else if (year !== "all") {
      el("activeFilters").textContent = `Year: ${year}`;
    } else if (q) {
      el("activeFilters").textContent = `Search: "${state.q}"`;
    } else {
      el("activeFilters").textContent = `Showing all PDFs`;
    }

    renderCards(filtered, state.view);
  }

  el("searchInput").addEventListener("input", (e) => {
    state.q = e.target.value;
    render();
  });

  el("yearSelect").addEventListener("change", (e) => {
    state.year = e.target.value;
    render();
  });

  render();
}

main().catch((err) => {
  console.error(err);
  el("resultsGrid").innerHTML =
    '<div class="muted">Failed to load <code>pdfs.json</code>. Re-run <code>node scripts/generate-pdfs-json.mjs</code>.</div>';
});


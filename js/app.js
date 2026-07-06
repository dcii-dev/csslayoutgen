(function () {
  "use strict";

  const THEME_KEY = "csslayoutgen-theme";

  /* ================================
     AREA COLORS
     ================================ */
  const AREA_COLORS = [
    {
      bg: "rgba(59,130,246,0.18)",
      border: "rgba(59,130,246,0.55)",
      text: "#1d4ed8",
      textDark: "#93bbfd",
    },
    {
      bg: "rgba(34,197,94,0.18)",
      border: "rgba(34,197,94,0.55)",
      text: "#15803d",
      textDark: "#6ee7a0",
    },
    {
      bg: "rgba(245,158,11,0.18)",
      border: "rgba(245,158,11,0.55)",
      text: "#b45309",
      textDark: "#fbbf24",
    },
    {
      bg: "rgba(236,72,153,0.18)",
      border: "rgba(236,72,153,0.55)",
      text: "#be185d",
      textDark: "#f472b6",
    },
    {
      bg: "rgba(139,92,246,0.18)",
      border: "rgba(139,92,246,0.55)",
      text: "#6d28d9",
      textDark: "#a78bfa",
    },
    {
      bg: "rgba(20,184,166,0.18)",
      border: "rgba(20,184,166,0.55)",
      text: "#0f766e",
      textDark: "#5eead4",
    },
    {
      bg: "rgba(249,115,22,0.18)",
      border: "rgba(249,115,22,0.55)",
      text: "#c2410c",
      textDark: "#fb923c",
    },
    {
      bg: "rgba(6,182,212,0.18)",
      border: "rgba(6,182,212,0.55)",
      text: "#0e7490",
      textDark: "#67e8f9",
    },
  ];

  /**
   * Returns the text color from a color entry, choosing dark mode variant when active.
   * @param {{text:string, textDark:string}} color
   * @return {string}
   */
  function getTextColor(color) {
    const theme = document.documentElement.getAttribute("data-theme");
    return theme === "dark" ? color.textDark : color.text;
  }

  /* ================================
     DEFAULTS (for reset)
     ================================ */

  /**
   * Returns a fresh copy of default grid state.
   * @return {object}
   */
  function gridDefaults() {
    return {
      columns: "1fr 1fr 1fr",
      rows: "1fr 1fr 1fr",
      colGap: "1rem",
      rowGap: "1rem",
      gapLinked: true,
      alignItems: "stretch",
      justifyItems: "stretch",
      areasEnabled: false,
      areas: [],
      items: [],
    };
  }

  /**
   * Returns a fresh copy of default subgrid state.
   * @return {object}
   */
  function subgridDefaults() {
    return {
      parentColumns: "1fr 1fr 1fr 1fr",
      parentRows: "80px auto 60px",
      parentGap: "1rem",
      children: [
        {
          label: "child",
          colStart: 1,
          colEnd: 3,
          rowStart: 1,
          rowEnd: 3,
          axes: "both",
        },
      ],
    };
  }

  /**
   * Returns a fresh copy of default flex state.
   * @return {object}
   */
  function flexDefaults() {
    return {
      direction: "default",
      wrap: "default",
      justifyContent: "default",
      alignItems: "default",
      alignContent: "default",
      gap: "0.5rem",
      items: [
        {
          label: "",
          grow: 0,
          shrink: 1,
          basis: "auto",
          alignSelf: "auto",
          order: 0,
        },
        {
          label: "",
          grow: 0,
          shrink: 1,
          basis: "auto",
          alignSelf: "auto",
          order: 0,
        },
        {
          label: "",
          grow: 0,
          shrink: 1,
          basis: "auto",
          alignSelf: "auto",
          order: 0,
        },
      ],
    };
  }

  /* ================================
     STATE
     ================================ */
  const state = {
    activeTab: "grid",
    gridOutputMode: "css",
    subOutputMode: "css",
    flexOutputMode: "css",
    grid: gridDefaults(),
    subgrid: subgridDefaults(),
    flex: flexDefaults(),
  };

  /* ================================
     UTILITIES
     ================================ */

  /**
   * Sets the footer year to the current year.
   */
  function setFooterYear() {
    const el = document.getElementById("footer-year");
    if (el) {
      el.textContent = new Date().getFullYear();
    }
  }

  /**
   * Escapes a string for safe insertion into innerHTML templates.
   * @param {string} str
   * @return {string}
   */
  function esc(str) {
    const el = document.createElement("span");
    el.textContent = String(str);
    return el.innerHTML;
  }

  /**
   * Handles copy-to-clipboard with button feedback.
   * @param {HTMLButtonElement} btn
   * @param {string} text
   */
  function handleCopy(btn, text) {
    if (!text.trim()) return;
    navigator.clipboard.writeText(text).then(() => {
      const original = btn.textContent;
      btn.textContent = "Copied!";
      btn.classList.add("copy-btn--copied");
      const status = document.getElementById("tab-status");
      if (status) status.textContent = "CSS copied to clipboard";
      setTimeout(() => {
        btn.textContent = original;
        btn.classList.remove("copy-btn--copied");
      }, 2000);
    });
  }

  /**
   * Parses a track definition string into individual track sizes.
   * Expands repeat() shorthands. Handles minmax() and other functions.
   * @param {string} str
   * @return {string[]}
   */
  function parseTracks(str) {
    const result = [];
    let i = 0;
    const s = (str || "").trim();

    while (i < s.length) {
      while (i < s.length && /\s/.test(s[i])) i++;
      if (i >= s.length) break;

      if (s.startsWith("repeat(", i)) {
        let depth = 0;
        let j = i;
        while (j < s.length) {
          if (s[j] === "(") depth++;
          else if (s[j] === ")") {
            depth--;
            if (depth === 0) break;
          }
          j++;
        }
        const repeatStr = s.slice(i, j + 1);
        const inner = repeatStr.slice("repeat(".length, -1);
        const commaIdx = inner.indexOf(",");
        if (commaIdx !== -1) {
          const countStr = inner.slice(0, commaIdx).trim();
          const trackList = inner.slice(commaIdx + 1).trim();
          const count = parseInt(countStr, 10);
          if (!isNaN(count) && count > 0) {
            const innerTracks = parseTracks(trackList);
            for (let k = 0; k < Math.min(count, 20); k++) {
              result.push(...innerTracks);
            }
          } else {
            result.push(repeatStr);
          }
        } else {
          result.push(repeatStr);
        }
        i = j + 1;
      } else {
        let depth = 0;
        let j = i;
        while (j < s.length && (depth > 0 || !/\s/.test(s[j]))) {
          if (s[j] === "(") depth++;
          else if (s[j] === ")") depth--;
          j++;
        }
        const token = s.slice(i, j);
        if (token) result.push(token);
        i = j;
      }
    }

    return result.filter(Boolean);
  }

  /**
   * Gets a color object for a given area name, deterministically by index.
   * @param {Map<string, number>} colorMap
   * @param {string} name
   * @return {{bg:string, border:string, text:string}}
   */
  function getAreaColor(colorMap, name) {
    const idx = colorMap.get(name) ?? 0;
    const color = AREA_COLORS[idx % AREA_COLORS.length];
    return { bg: color.bg, border: color.border, text: getTextColor(color) };
  }

  /**
   * Builds a colorMap from an ordered list of unique area names.
   * @param {string[]} uniqueNames
   * @return {Map<string, number>}
   */
  function buildColorMap(uniqueNames) {
    const map = new Map();
    uniqueNames.forEach((name, idx) => map.set(name, idx));
    return map;
  }

  /* ================================
     THEME
     ================================ */

  /**
   * Applies a theme and updates toggle button state.
   * @param {string} theme
   */
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;
    const isDark = theme === "dark";
    btn.setAttribute("aria-pressed", String(isDark));
    btn.setAttribute(
      "aria-label",
      isDark ? "Switch to light mode" : "Switch to dark mode",
    );
  }

  /**
   * Reads saved or system preference and applies theme.
   */
  function initTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "dark" || stored === "light") {
      applyTheme(stored);
      return;
    }
    applyTheme(
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light",
    );
  }

  /**
   * Toggles between light and dark themes.
   */
  function toggleTheme() {
    const current =
      document.documentElement.getAttribute("data-theme") || "light";
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
    renderGridPreview();
    renderSubgridPreview();
    renderFlexPreview();
  }

  /* ================================
     TAB SWITCHING
     ================================ */

  /**
   * Activates a tab panel and deactivates all others.
   * @param {string} tabId - "grid" | "subgrid" | "flexbox"
   */
  function switchTab(tabId) {
    const tabs = ["grid", "subgrid", "flexbox"];
    tabs.forEach((id) => {
      const btn = document.getElementById(`tab-${id}`);
      const panel = document.getElementById(`panel-${id}`);
      const isActive = id === tabId;
      if (btn) {
        btn.setAttribute("aria-selected", String(isActive));
        btn.classList.toggle("tab-btn--active", isActive);
        btn.tabIndex = isActive ? 0 : -1;
      }
      if (panel) {
        panel.hidden = !isActive;
      }
    });
    state.activeTab = tabId;
    const status = document.getElementById("tab-status");
    if (status) {
      const labels = { grid: "Grid", subgrid: "Subgrid", flexbox: "Flexbox" };
      status.textContent = `${labels[tabId]} tab selected`;
    }
  }

  /* ================================
     GRID TAB
     ================================ */

  /**
   * Validates that each named area forms a rectangle and all cells are non-empty.
   * @param {string[][]} areas
   * @return {{valid: boolean, error?: string}}
   */
  function validateAreas(areas) {
    if (!areas || areas.length === 0) return { valid: true };
    const rows = areas.length;
    const cols = areas[0].length;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!areas[r][c]) {
          return {
            valid: false,
            error: `Cell at row ${r + 1}, column ${c + 1} is empty. Use . for empty cells.`,
          };
        }
      }
    }

    const areaNames = new Set();
    for (const row of areas) {
      for (const cell of row) {
        if (cell !== ".") areaNames.add(cell);
      }
    }

    for (const name of areaNames) {
      let minRow = Infinity,
        maxRow = -Infinity,
        minCol = Infinity,
        maxCol = -Infinity;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (areas[r][c] === name) {
            minRow = Math.min(minRow, r);
            maxRow = Math.max(maxRow, r);
            minCol = Math.min(minCol, c);
            maxCol = Math.max(maxCol, c);
          }
        }
      }
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          if (areas[r][c] !== name) {
            return {
              valid: false,
              error: `Area "${name}" does not form a rectangle.`,
            };
          }
        }
      }
    }

    return { valid: true };
  }

  /**
   * Rebuilds the visual areas grid based on current column/row tracks.
   * Preserves existing cell values where possible.
   */
  function rebuildAreasGrid() {
    const container = document.getElementById("grid-areas-grid");
    const errorEl = document.getElementById("grid-areas-error");
    if (!container) return;

    const colTracks = parseTracks(state.grid.columns);
    const rowTracks = parseTracks(state.grid.rows);
    const cols = colTracks.length;
    const rows = rowTracks.length;

    if (cols > 12 || rows > 12 || cols === 0 || rows === 0) {
      container.innerHTML = `<p style="font-size:0.8125rem;color:var(--clr-text-muted);">Named areas require between 1 and 12 tracks per axis.</p>`;
      return;
    }

    const prev = state.grid.areas;
    const newAreas = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        row.push(prev[r]?.[c] ?? ".");
      }
      newAreas.push(row);
    }
    state.grid.areas = newAreas;

    container.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    container.innerHTML = "";

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const input = document.createElement("input");
        input.type = "text";
        input.className = "areas-cell";
        input.value = newAreas[r][c];
        input.setAttribute(
          "aria-label",
          `Row ${r + 1}, column ${c + 1} area name`,
        );
        input.dataset.row = String(r);
        input.dataset.col = String(c);
        input.addEventListener("input", (e) => {
          const row = parseInt(e.target.dataset.row, 10);
          const col = parseInt(e.target.dataset.col, 10);
          state.grid.areas[row][col] = e.target.value.trim() || ".";
          renderGridOutput();
          renderGridPreview();
        });
        container.appendChild(input);
      }
    }

    if (errorEl) errorEl.hidden = true;
  }

  /**
   * Reads the CSS selector name from the grid selector input.
   * @return {string}
   */
  function getGridSelector() {
    const val = (document.getElementById("grid-selector")?.value || "").trim();
    return val || "container";
  }

  /**
   * Builds the CSS output string for the grid tab.
   * @return {string}
   */
  function buildGridCSS() {
    const {
      columns,
      rows,
      colGap,
      rowGap,
      alignItems,
      justifyItems,
      areasEnabled,
      areas,
      items,
    } = state.grid;
    const selector = getGridSelector();
    const lines = [`.${selector} {`, "  display: grid;"];

    if (columns.trim())
      lines.push(`  grid-template-columns: ${columns.trim()};`);
    if (rows.trim()) lines.push(`  grid-template-rows: ${rows.trim()};`);

    const cg = colGap.trim();
    const rg = rowGap.trim();
    if (cg && rg) {
      if (cg === rg) {
        lines.push(`  gap: ${cg};`);
      } else {
        lines.push(`  column-gap: ${cg};`);
        lines.push(`  row-gap: ${rg};`);
      }
    } else if (cg) {
      lines.push(`  column-gap: ${cg};`);
    } else if (rg) {
      lines.push(`  row-gap: ${rg};`);
    }

    if (alignItems && alignItems !== "stretch") {
      lines.push(`  align-items: ${alignItems};`);
    }
    if (justifyItems && justifyItems !== "stretch") {
      lines.push(`  justify-items: ${justifyItems};`);
    }

    if (areasEnabled && areas.length > 0) {
      const validation = validateAreas(areas);
      if (validation.valid) {
        lines.push("  grid-template-areas:");
        areas.forEach((row, idx) => {
          const isLast = idx === areas.length - 1;
          lines.push(`    "${row.join(" ")}"${isLast ? ";" : ""}`);
        });
      }
    }

    lines.push("}");

    if (areasEnabled && areas.length > 0 && validateAreas(areas).valid) {
      const uniqueNames = [...new Set(areas.flat())].filter(
        (n) => n && n !== ".",
      );
      uniqueNames.forEach((name) => {
        lines.push("", `.${name} {`, `  grid-area: ${name};`, "}");
      });
    }

    if (!areasEnabled && items.length > 0) {
      const gridSel = selector;
      items.forEach((item, idx) => {
        const name = item.label.trim() || `${gridSel}__item-${idx + 1}`;
        lines.push("", `.${name} {`);
        lines.push(`  grid-column: ${item.colStart} / ${item.colEnd};`);
        lines.push(`  grid-row: ${item.rowStart} / ${item.rowEnd};`);
        lines.push("}");
      });
    }

    return lines.join("\n");
  }

  /**
   * Builds the HTML output string for the grid tab.
   * @return {string}
   */
  function buildGridHTML() {
    const { areasEnabled, areas, items } = state.grid;
    const selector = getGridSelector();
    const lines = [`<div class="${selector}">`];

    if (areasEnabled && areas.length > 0 && validateAreas(areas).valid) {
      const uniqueNames = [...new Set(areas.flat())].filter(
        (n) => n && n !== ".",
      );
      uniqueNames.forEach((name) => {
        lines.push(`  <div class="${name}">${name}</div>`);
      });
    } else if (items.length > 0) {
      items.forEach((item, idx) => {
        const name = item.label.trim() || `${selector}__item-${idx + 1}`;
        lines.push(`  <div class="${name}">${idx + 1}</div>`);
      });
    } else {
      const colTracks = parseTracks(state.grid.columns);
      const rowTracks = parseTracks(state.grid.rows);
      const total = colTracks.length * rowTracks.length;
      for (let i = 0; i < Math.min(total, 48); i++) {
        lines.push(`  <div>${i + 1}</div>`);
      }
    }

    lines.push("</div>");
    return lines.join("\n");
  }

  /**
   * Updates the grid CSS/HTML output element based on active output mode.
   */
  function renderGridOutput() {
    const el = document.getElementById("grid-output");
    const errorEl = document.getElementById("grid-areas-error");
    if (!el) return;

    if (state.grid.areasEnabled && state.grid.areas.length > 0) {
      const validation = validateAreas(state.grid.areas);
      if (errorEl) {
        if (!validation.valid) {
          errorEl.textContent = validation.error || "Invalid area layout.";
          errorEl.hidden = false;
        } else {
          errorEl.hidden = true;
        }
      }
    }

    const mode = state.gridOutputMode || "css";
    el.textContent = mode === "html" ? buildGridHTML() : buildGridCSS();
  }

  /* ================================
     GRID INTERACTIVE ITEMS
     ================================ */

  const gridDrag = {
    active: false,
    itemIdx: -1,
    edge: "",
    itemEl: null,
    colLines: {},
    rowLines: {},
    previewRect: null,
  };

  /**
   * Computes grid line pixel positions from grid preview background cells.
   * @param {HTMLElement} preview
   * @return {{colLines: Object, rowLines: Object}}
   */
  function computeGridLines(preview) {
    const rect = preview.getBoundingClientRect();
    const cells = preview.querySelectorAll(".preview-item--bg");
    const colLines = {};
    const rowLines = {};

    cells.forEach((cell) => {
      const c = parseInt(cell.dataset.col, 10);
      const r = parseInt(cell.dataset.row, 10);
      const cr = cell.getBoundingClientRect();
      if (!(c in colLines)) colLines[c] = cr.left - rect.left;
      colLines[c + 1] = cr.right - rect.left;
      if (!(r in rowLines)) rowLines[r] = cr.top - rect.top;
      rowLines[r + 1] = cr.bottom - rect.top;
    });

    return { colLines, rowLines };
  }

  /**
   * Creates resize handles for a grid item overlay.
   * @param {number} itemIdx
   * @return {DocumentFragment}
   */
  function createGridItemHandles(itemIdx) {
    const frag = document.createDocumentFragment();
    const edges = ["left", "right", "top", "bottom"];
    edges.forEach((edge) => {
      const handle = document.createElement("div");
      handle.className = `subgrid-handle subgrid-handle--${edge}`;
      handle.dataset.itemIdx = String(itemIdx);
      handle.dataset.edge = edge;
      handle.setAttribute(
        "aria-label",
        `Resize ${edge} edge of item ${itemIdx + 1}`,
      );
      handle.addEventListener("pointerdown", startGridItemDrag);
      frag.appendChild(handle);
    });
    return frag;
  }

  /**
   * Starts a grid item resize drag.
   * @param {PointerEvent} e
   */
  function startGridItemDrag(e) {
    e.preventDefault();
    e.stopPropagation();

    const preview = document.getElementById("grid-preview");
    if (!preview) return;

    const itemIdx = parseInt(e.target.dataset.itemIdx, 10);
    const edge = e.target.dataset.edge;
    const itemEl = e.target.parentElement;
    const { colLines, rowLines } = computeGridLines(preview);

    gridDrag.active = true;
    gridDrag.itemIdx = itemIdx;
    gridDrag.edge = edge;
    gridDrag.itemEl = itemEl;
    gridDrag.colLines = colLines;
    gridDrag.rowLines = rowLines;
    gridDrag.previewRect = preview.getBoundingClientRect();

    document.body.style.userSelect = "none";
    document.addEventListener("pointermove", handleGridItemDragMove);
    document.addEventListener("pointerup", stopGridItemDrag);
  }

  /**
   * Handles pointer move during grid item resize.
   * @param {PointerEvent} e
   */
  function handleGridItemDragMove(e) {
    if (!gridDrag.active) return;

    const item = state.grid.items[gridDrag.itemIdx];
    if (!item) return;

    const x = e.clientX - gridDrag.previewRect.left;
    const y = e.clientY - gridDrag.previewRect.top;
    const maxCol = parseTracks(state.grid.columns).length + 1;
    const maxRow = parseTracks(state.grid.rows).length + 1;

    if (gridDrag.edge === "right") {
      const n = Math.min(snapToLine(x, gridDrag.colLines), maxCol);
      if (n > item.colStart) item.colEnd = n;
    } else if (gridDrag.edge === "left") {
      const n = Math.max(snapToLine(x, gridDrag.colLines), 1);
      if (n < item.colEnd) item.colStart = n;
    } else if (gridDrag.edge === "bottom") {
      const n = Math.min(snapToLine(y, gridDrag.rowLines), maxRow);
      if (n > item.rowStart) item.rowEnd = n;
    } else if (gridDrag.edge === "top") {
      const n = Math.max(snapToLine(y, gridDrag.rowLines), 1);
      if (n < item.rowEnd) item.rowStart = n;
    }

    gridDrag.itemEl.style.gridColumn = `${item.colStart} / ${item.colEnd}`;
    gridDrag.itemEl.style.gridRow = `${item.rowStart} / ${item.rowEnd}`;
  }

  /**
   * Ends the grid item resize drag and syncs UI.
   */
  function stopGridItemDrag() {
    gridDrag.active = false;
    document.body.style.userSelect = "";
    document.removeEventListener("pointermove", handleGridItemDragMove);
    document.removeEventListener("pointerup", stopGridItemDrag);

    renderGridPreview();
    renderGridOutput();
  }

  /**
   * Adds a new grid item at the clicked cell position.
   * @param {number} col Column number (1-based).
   * @param {number} row Row number (1-based).
   */
  function addGridItem(col, row) {
    state.grid.items.push({
      label: "",
      colStart: col,
      colEnd: col + 1,
      rowStart: row,
      rowEnd: row + 1,
    });
    renderGridPreview();
    renderGridOutput();
  }

  /**
   * Removes a grid item by index.
   * @param {number} idx
   */
  function removeGridItem(idx) {
    state.grid.items.splice(idx, 1);
    renderGridPreview();
    renderGridOutput();
  }

  /* ================================
     GRID LAYOUT TEMPLATES
     ================================ */

  const GRID_TEMPLATES = {
    "holy-grail": {
      label: "Holy Grail",
      columns: "200px 1fr 200px",
      rows: "auto 1fr auto",
      colGap: "1rem",
      rowGap: "1rem",
      areasEnabled: true,
      areas: [
        ["header", "header", "header"],
        ["sidebar", "main", "aside"],
        ["footer", "footer", "footer"],
      ],
    },
    sidebar: {
      label: "Sidebar",
      columns: "250px 1fr",
      rows: "auto 1fr auto",
      colGap: "1.5rem",
      rowGap: "1.5rem",
      areasEnabled: true,
      areas: [
        ["header", "header"],
        ["sidebar", "main"],
        ["footer", "footer"],
      ],
    },
    "card-grid": {
      label: "Card Grid",
      columns: "repeat(auto-fill, minmax(250px, 1fr))",
      rows: "auto",
      colGap: "1.5rem",
      rowGap: "1.5rem",
      areasEnabled: false,
      areas: [],
    },
    "sticky-footer": {
      label: "Sticky Footer",
      columns: "1fr",
      rows: "auto 1fr auto",
      colGap: "0",
      rowGap: "0",
      areasEnabled: true,
      areas: [["header"], ["main"], ["footer"]],
    },
    dashboard: {
      label: "Dashboard",
      columns: "1fr 1fr 1fr 1fr",
      rows: "auto 1fr 1fr",
      colGap: "1rem",
      rowGap: "1rem",
      areasEnabled: true,
      areas: [
        ["header", "header", "header", "header"],
        ["stats", "stats", "chart", "chart"],
        ["table", "table", "table", "activity"],
      ],
    },
    "equal-3col": {
      label: "3 Equal Columns",
      columns: "1fr 1fr 1fr",
      rows: "auto",
      colGap: "1.5rem",
      rowGap: "1.5rem",
      areasEnabled: false,
      areas: [],
    },
  };

  /**
   * Applies a layout template to the grid state and updates all UI.
   * @param {string} templateKey
   */
  function applyGridTemplate(templateKey) {
    const tpl = GRID_TEMPLATES[templateKey];
    if (!tpl) return;

    state.grid.columns = tpl.columns;
    state.grid.rows = tpl.rows;
    state.grid.colGap = tpl.colGap;
    state.grid.rowGap = tpl.rowGap;
    state.grid.gapLinked = tpl.colGap === tpl.rowGap;
    state.grid.areasEnabled = tpl.areasEnabled;
    state.grid.areas = tpl.areas.map((row) => [...row]);
    state.grid.items = [];
    state.grid.alignItems = "stretch";
    state.grid.justifyItems = "stretch";

    const colInput = document.getElementById("grid-columns");
    const rowInput = document.getElementById("grid-rows");
    const colGapInput = document.getElementById("grid-col-gap");
    const rowGapInput = document.getElementById("grid-row-gap");
    const gapLinkedCheck = document.getElementById("grid-gap-linked");
    const areasToggle = document.getElementById("grid-areas-toggle");
    const areasWrapper = document.getElementById("grid-areas-wrapper");
    const alignEl = document.getElementById("grid-align-items");
    const justifyEl = document.getElementById("grid-justify-items");

    if (colInput) colInput.value = tpl.columns;
    if (rowInput) rowInput.value = tpl.rows;
    if (colGapInput) colGapInput.value = tpl.colGap;
    if (rowGapInput) rowGapInput.value = tpl.rowGap;
    if (gapLinkedCheck) gapLinkedCheck.checked = state.grid.gapLinked;
    if (areasToggle) areasToggle.checked = tpl.areasEnabled;
    if (areasWrapper) areasWrapper.hidden = !tpl.areasEnabled;
    if (alignEl) alignEl.value = "stretch";
    if (justifyEl) justifyEl.value = "stretch";

    if (tpl.areasEnabled) rebuildAreasGrid();
    renderGridOutput();
    renderGridPreview();
  }

  /**
   * Renders the live grid preview with line numbers and interactive items.
   */
  function renderGridPreview() {
    const preview = document.getElementById("grid-preview");
    const trackInfo = document.getElementById("grid-track-info");
    if (!preview) return;

    const colTracks = parseTracks(state.grid.columns);
    const rowTracks = parseTracks(state.grid.rows);
    const cols = Math.min(colTracks.length, 12) || 1;
    const rows = Math.min(rowTracks.length, 12) || 1;

    if (trackInfo) {
      trackInfo.textContent = `${cols} col${cols !== 1 ? "s" : ""} x ${rows} row${rows !== 1 ? "s" : ""}`;
    }

    preview.style.cssText = `
      display: grid;
      grid-template-columns: ${state.grid.columns || "1fr"};
      grid-template-rows: ${state.grid.rows || "auto"};
      column-gap: ${state.grid.colGap || "0"};
      row-gap: ${state.grid.rowGap || "0"};
      position: relative;
    `;

    const areasEnabled = state.grid.areasEnabled;
    const areas = state.grid.areas;
    const areasValid =
      areasEnabled && areas.length > 0 && validateAreas(areas).valid;

    if (areasValid) {
      const areaStr = areas.map((row) => `"${row.join(" ")}"`).join(" ");
      preview.style.gridTemplateAreas = areaStr;
    } else {
      preview.style.gridTemplateAreas = "";
    }

    preview.innerHTML = "";

    if (areasValid) {
      const uniqueNames = [...new Set(areas.flat())].filter(
        (n) => n && n !== ".",
      );
      const colorMap = buildColorMap(uniqueNames);
      uniqueNames.forEach((name) => {
        const color = getAreaColor(colorMap, name);
        const item = document.createElement("div");
        item.className = "preview-item preview-item--area";
        item.style.gridArea = name;
        item.style.backgroundColor = color.bg;
        item.style.borderColor = color.border;
        item.style.color = color.text;
        item.textContent = name;
        item.dataset.areaName = name;
        item.title = "Double-click to rename";
        item.addEventListener("dblclick", () =>
          startInlineAreaEdit(item, name),
        );
        preview.appendChild(item);
      });
    } else {
      // Background cells (interactive: click to add item)
      const total = cols * rows;
      for (let i = 0; i < Math.min(total, 48); i++) {
        const r = Math.floor(i / cols) + 1;
        const c = (i % cols) + 1;
        const item = document.createElement("div");
        item.className = "preview-item preview-item--bg";
        item.dataset.col = String(c);
        item.dataset.row = String(r);
        item.style.gridColumn = String(c);
        item.style.gridRow = String(r);
        item.style.backgroundColor = "var(--clr-bg-alt)";
        item.style.borderColor = "var(--clr-border)";
        item.style.color = "var(--clr-text-muted)";
        item.style.fontSize = "0.6875rem";
        item.title = "Click to add item";
        item.textContent = String(i + 1);
        item.addEventListener("click", () => addGridItem(c, r));
        preview.appendChild(item);
      }

      // Grid items overlays
      state.grid.items.forEach((gridItem, idx) => {
        const color = AREA_COLORS[idx % AREA_COLORS.length];
        const el = document.createElement("div");
        el.className = "preview-item preview-item--subchild";
        el.style.gridColumn = `${gridItem.colStart} / ${gridItem.colEnd}`;
        el.style.gridRow = `${gridItem.rowStart} / ${gridItem.rowEnd}`;
        el.style.backgroundColor = color.bg;
        el.style.border = `2px solid ${color.border}`;
        el.style.borderColor = color.border;
        el.style.color = getTextColor(color);
        el.style.zIndex = String(2 + idx);
        el.style.fontWeight = "700";
        const gridSel = getGridSelector();
        const name = gridItem.label.trim() || `${gridSel}__item-${idx + 1}`;
        el.textContent = name;
        el.title = "Double-click to rename";
        el.addEventListener("dblclick", (ev) => {
          ev.stopPropagation();
          startInlineItemEdit(el, idx);
        });

        // Remove button
        const rmBtn = document.createElement("button");
        rmBtn.className = "grid-item-remove";
        rmBtn.type = "button";
        rmBtn.textContent = "\u00d7";
        rmBtn.title = "Remove item";
        rmBtn.setAttribute("aria-label", `Remove item ${idx + 1}`);
        rmBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          removeGridItem(idx);
        });
        el.appendChild(rmBtn);

        el.appendChild(createGridItemHandles(idx));
        preview.appendChild(el);
      });
    }

    // Grid line numbers (rendered after cells so they overlay)
    renderGridLineNumbers(preview, cols, rows);

    // Track resize handles (only in items mode where bg cells exist)
    if (!areasValid) {
      renderTrackHandles(preview, cols, rows);
    }
  }

  /* ================================
     INLINE EDITING
     ================================ */

  /**
   * Starts inline editing for a named grid area in the preview.
   * @param {HTMLElement} el The area element in the preview.
   * @param {string} oldName The current area name.
   */
  function startInlineAreaEdit(el, oldName) {
    const input = document.createElement("input");
    input.type = "text";
    input.className = "inline-edit-input";
    input.value = oldName;
    input.setAttribute("aria-label", `Rename area ${oldName}`);
    el.textContent = "";
    el.appendChild(input);
    input.focus();
    input.select();

    const commit = () => {
      const newName = input.value.trim().replace(/\s+/g, "-") || oldName;
      if (newName !== oldName) {
        state.grid.areas = state.grid.areas.map((row) =>
          row.map((cell) => (cell === oldName ? newName : cell)),
        );
        rebuildAreasGrid();
      }
      renderGridPreview();
      renderGridOutput();
    };

    input.addEventListener("blur", commit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        input.blur();
      }
      if (e.key === "Escape") {
        input.value = oldName;
        input.blur();
      }
    });
  }

  /**
   * Starts inline editing for a grid item label in the preview.
   * @param {HTMLElement} el The item overlay element.
   * @param {number} idx The item index in state.grid.items.
   */
  function startInlineItemEdit(el, idx) {
    const item = state.grid.items[idx];
    if (!item) return;

    const gridSel = getGridSelector();
    const currentLabel = item.label.trim() || `${gridSel}__item-${idx + 1}`;

    const input = document.createElement("input");
    input.type = "text";
    input.className = "inline-edit-input";
    input.value = currentLabel;
    input.setAttribute("aria-label", `Rename item ${idx + 1}`);

    // Clear text but keep buttons/handles
    const children = [...el.childNodes].filter(
      (n) => n.nodeType === Node.TEXT_NODE,
    );
    children.forEach((n) => n.remove());
    el.insertBefore(input, el.firstChild);
    input.focus();
    input.select();

    const commit = () => {
      const newLabel = input.value.trim();
      const defaultName = `${gridSel}__item-${idx + 1}`;
      item.label = newLabel === defaultName ? "" : newLabel;
      renderGridPreview();
      renderGridOutput();
    };

    input.addEventListener("blur", commit);
    input.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter") {
        e.preventDefault();
        input.blur();
      }
      if (e.key === "Escape") {
        input.value = currentLabel;
        input.blur();
      }
    });
  }

  /**
   * Starts inline editing for a subgrid child label in the preview.
   * @param {HTMLElement} el The child overlay element.
   * @param {number} idx The child index in state.subgrid.children.
   */
  function startInlineSubchildEdit(el, idx) {
    const child = state.subgrid.children[idx];
    if (!child) return;

    const s = state.subgrid;
    const currentLabel =
      child.label.trim() ||
      (s.children.length === 1 ? ".child" : `.child-${idx + 1}`);

    const input = document.createElement("input");
    input.type = "text";
    input.className = "inline-edit-input";
    input.value = currentLabel;
    input.setAttribute("aria-label", `Rename child ${idx + 1}`);

    const children = [...el.childNodes].filter(
      (n) => n.nodeType === Node.TEXT_NODE,
    );
    children.forEach((n) => n.remove());
    el.insertBefore(input, el.firstChild);
    input.focus();
    input.select();

    const commit = () => {
      const newLabel = input.value.trim();
      const defaultName =
        s.children.length === 1 ? ".child" : `.child-${idx + 1}`;
      child.label = newLabel === defaultName ? "" : newLabel;
      renderSubgridChildren();
      renderSubgridPreview();
      renderSubgridOutput();
    };

    input.addEventListener("blur", commit);
    input.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter") {
        e.preventDefault();
        input.blur();
      }
      if (e.key === "Escape") {
        input.value = currentLabel;
        input.blur();
      }
    });
  }

  /* ================================
     TRACK RESIZE HANDLES
     ================================ */

  const trackDrag = {
    active: false,
    axis: "",
    lineIndex: -1,
    startPos: 0,
    previewRect: null,
    tracks: [],
    handleEl: null,
  };

  /**
   * Renders draggable track resize handles between columns and rows.
   * Uses absolute positioning based on computed grid line positions.
   * @param {HTMLElement} preview
   * @param {number} cols
   * @param {number} rows
   */
  function renderTrackHandles(preview, cols, rows) {
    // Need a frame delay so the grid layout is computed before measuring
    requestAnimationFrame(() => {
      if (trackDrag.active) return;

      // Remove old handles
      preview.querySelectorAll(".track-handle").forEach((h) => h.remove());

      const rect = preview.getBoundingClientRect();
      const cells = preview.querySelectorAll(".preview-item--bg");
      if (cells.length === 0) return;

      const colEdges = {};
      const rowEdges = {};

      cells.forEach((cell) => {
        const c = parseInt(cell.dataset.col, 10);
        const r = parseInt(cell.dataset.row, 10);
        const cr = cell.getBoundingClientRect();
        colEdges[c] = {
          left: cr.left - rect.left,
          right: cr.right - rect.left,
        };
        rowEdges[r] = { top: cr.top - rect.top, bottom: cr.bottom - rect.top };
      });

      // Column handles (between columns)
      for (let i = 1; i < cols; i++) {
        const leftEdge = colEdges[i]?.right;
        const rightEdge = colEdges[i + 1]?.left;
        if (leftEdge == null || rightEdge == null) continue;

        const midX = (leftEdge + rightEdge) / 2;
        const handle = document.createElement("div");
        handle.className = "track-handle track-handle--col";
        handle.style.left = `${midX - 4}px`;
        handle.style.top = "0";
        handle.style.bottom = "0";
        handle.dataset.axis = "col";
        handle.dataset.index = String(i);
        handle.setAttribute(
          "aria-label",
          `Resize between column ${i} and ${i + 1}`,
        );
        handle.addEventListener("pointerdown", startTrackDrag);
        preview.appendChild(handle);
      }

      // Row handles (between rows)
      for (let i = 1; i < rows; i++) {
        const topEdge = rowEdges[i]?.bottom;
        const bottomEdge = rowEdges[i + 1]?.top;
        if (topEdge == null || bottomEdge == null) continue;

        const midY = (topEdge + bottomEdge) / 2;
        const handle = document.createElement("div");
        handle.className = "track-handle track-handle--row";
        handle.style.top = `${midY - 4}px`;
        handle.style.left = "0";
        handle.style.right = "0";
        handle.dataset.axis = "row";
        handle.dataset.index = String(i);
        handle.setAttribute(
          "aria-label",
          `Resize between row ${i} and ${i + 1}`,
        );
        handle.addEventListener("pointerdown", startTrackDrag);
        preview.appendChild(handle);
      }
    });
  }

  /**
   * Starts a track resize drag operation.
   * @param {PointerEvent} e
   */
  function startTrackDrag(e) {
    e.preventDefault();
    e.stopPropagation();

    const preview = document.getElementById("grid-preview");
    if (!preview) return;

    const axis = e.target.dataset.axis;
    const lineIndex = parseInt(e.target.dataset.index, 10);
    const rect = preview.getBoundingClientRect();
    const isCol = axis === "col";

    trackDrag.active = true;
    trackDrag.axis = axis;
    trackDrag.lineIndex = lineIndex;
    trackDrag.startPos = isCol ? e.clientX : e.clientY;
    trackDrag.previewRect = rect;
    trackDrag.handleEl = e.target;

    e.target.style.opacity = "1";
    e.target.style.transition = "none";

    const trackStr = isCol ? state.grid.columns : state.grid.rows;
    trackDrag.tracks = parseTracks(trackStr);

    document.body.style.userSelect = "none";
    document.body.style.cursor = isCol ? "col-resize" : "row-resize";
    document.addEventListener("pointermove", handleTrackDragMove);
    document.addEventListener("pointerup", stopTrackDrag);
  }

  /**
   * Handles pointer move during track resize.
   * @param {PointerEvent} e
   */
  function handleTrackDragMove(e) {
    if (!trackDrag.active) return;

    const isCol = trackDrag.axis === "col";
    const currentPos = isCol ? e.clientX : e.clientY;
    const delta = currentPos - trackDrag.startPos;
    const totalSize = isCol
      ? trackDrag.previewRect.width
      : trackDrag.previewRect.height;

    if (totalSize === 0 || delta === 0) return;

    const idx = trackDrag.lineIndex - 1;
    const nextIdx = trackDrag.lineIndex;

    const tracks = parseTracks(isCol ? state.grid.columns : state.grid.rows);
    if (idx < 0 || nextIdx >= tracks.length) return;

    const prevTrack = tracks[idx];
    const nextTrack = tracks[nextIdx];

    // Only resize tracks that use fr units
    const prevIsFr = /^[\d.]+fr$/.test(prevTrack);
    const nextIsFr = /^[\d.]+fr$/.test(nextTrack);

    if (!prevIsFr || !nextIsFr) return;

    const prevVal = parseFloat(prevTrack) || 1;
    const nextVal = parseFloat(nextTrack) || 1;
    const totalFr = prevVal + nextVal;
    const pxPerFr =
      totalSize /
      tracks.reduce((sum, t) => {
        const m = t.match(/^([\d.]+)fr$/);
        return sum + (m ? parseFloat(m[1]) : 1);
      }, 0);

    const deltaFr = delta / pxPerFr;
    const newPrev = Math.max(0.25, Math.round((prevVal + deltaFr) * 4) / 4);
    const newNext = Math.max(0.25, Math.round((nextVal - deltaFr) * 4) / 4);

    // Only update if values actually changed after snapping
    if (newPrev === prevVal && newNext === nextVal) return;

    tracks[idx] = `${newPrev}fr`;
    tracks[nextIdx] = `${newNext}fr`;

    if (isCol) {
      state.grid.columns = tracks.join(" ");
    } else {
      state.grid.rows = tracks.join(" ");
    }

    trackDrag.startPos = currentPos;

    // Update grid template inline without full DOM rebuild
    const preview = document.getElementById("grid-preview");
    if (preview) {
      preview.style.gridTemplateColumns = state.grid.columns || "1fr";
      preview.style.gridTemplateRows = state.grid.rows || "auto";
    }

    // Reposition handle after browser reflows the grid
    requestAnimationFrame(() => {
      if (!trackDrag.handleEl || !trackDrag.active) return;
      const rect = preview.getBoundingClientRect();
      const cells = preview.querySelectorAll(".preview-item--bg");
      const lineIdx = trackDrag.lineIndex;

      if (isCol) {
        let right = 0;
        let left = 0;
        cells.forEach((cell) => {
          const c = parseInt(cell.dataset.col, 10);
          const cr = cell.getBoundingClientRect();
          if (c === lineIdx) right = cr.right - rect.left;
          if (c === lineIdx + 1) left = cr.left - rect.left;
        });
        if (right && left) {
          trackDrag.handleEl.style.left = `${(right + left) / 2 - 8}px`;
        }
      } else {
        let bottom = 0;
        let top = 0;
        cells.forEach((cell) => {
          const r = parseInt(cell.dataset.row, 10);
          const cr = cell.getBoundingClientRect();
          if (r === lineIdx) bottom = cr.bottom - rect.top;
          if (r === lineIdx + 1) top = cr.top - rect.top;
        });
        if (bottom && top) {
          trackDrag.handleEl.style.top = `${(bottom + top) / 2 - 8}px`;
        }
      }
    });
  }

  /**
   * Ends a track resize drag and syncs UI.
   */
  function stopTrackDrag() {
    trackDrag.active = false;
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
    document.removeEventListener("pointermove", handleTrackDragMove);
    document.removeEventListener("pointerup", stopTrackDrag);

    // Sync sidebar inputs
    const colInput = document.getElementById("grid-columns");
    const rowInput = document.getElementById("grid-rows");
    if (colInput) colInput.value = state.grid.columns;
    if (rowInput) rowInput.value = state.grid.rows;

    renderGridPreview();
    renderGridOutput();
  }

  /**
   * Renders grid line number labels on the preview edges.
   * @param {HTMLElement} preview
   * @param {number} cols
   * @param {number} rows
   */
  function renderGridLineNumbers(preview, cols, rows) {
    // Column lines along the top
    for (let L = 1; L <= cols + 1; L++) {
      const lbl = document.createElement("span");
      lbl.className = "grid-line-label grid-line-label--col";
      lbl.textContent = String(L);
      if (L <= cols) {
        lbl.style.gridColumn = String(L);
        lbl.style.gridRow = "1";
        lbl.style.alignSelf = "start";
        lbl.style.justifySelf = "start";
      } else {
        lbl.style.gridColumn = String(cols);
        lbl.style.gridRow = "1";
        lbl.style.alignSelf = "start";
        lbl.style.justifySelf = "end";
      }
      preview.appendChild(lbl);
    }

    // Row lines along the left
    for (let L = 1; L <= rows + 1; L++) {
      const lbl = document.createElement("span");
      lbl.className = "grid-line-label grid-line-label--row";
      lbl.textContent = String(L);
      if (L <= rows) {
        lbl.style.gridColumn = "1";
        lbl.style.gridRow = String(L);
        lbl.style.alignSelf = "start";
        lbl.style.justifySelf = "start";
      } else {
        lbl.style.gridColumn = "1";
        lbl.style.gridRow = String(rows);
        lbl.style.alignSelf = "end";
        lbl.style.justifySelf = "start";
      }
      preview.appendChild(lbl);
    }
  }

  /**
   * Resets the grid tab to its default state and syncs all UI inputs.
   */
  function resetGridTab() {
    const d = gridDefaults();
    Object.assign(state.grid, d);

    const colInput = document.getElementById("grid-columns");
    const rowInput = document.getElementById("grid-rows");
    const colGapInput = document.getElementById("grid-col-gap");
    const rowGapInput = document.getElementById("grid-row-gap");
    const gapLinkedCheck = document.getElementById("grid-gap-linked");
    const areasToggle = document.getElementById("grid-areas-toggle");
    const areasWrapper = document.getElementById("grid-areas-wrapper");
    const alignEl = document.getElementById("grid-align-items");
    const justifyEl = document.getElementById("grid-justify-items");
    const templateSel = document.getElementById("grid-template-select");

    if (colInput) colInput.value = d.columns;
    if (rowInput) rowInput.value = d.rows;
    if (colGapInput) colGapInput.value = d.colGap;
    if (rowGapInput) rowGapInput.value = d.rowGap;
    if (gapLinkedCheck) gapLinkedCheck.checked = d.gapLinked;
    if (areasToggle) areasToggle.checked = false;
    if (areasWrapper) areasWrapper.hidden = true;
    if (alignEl) alignEl.value = "stretch";
    if (justifyEl) justifyEl.value = "stretch";
    if (templateSel) templateSel.value = "";

    renderGridOutput();
    renderGridPreview();
  }

  /**
   * Initializes all grid tab event listeners.
   */
  function initGridTab() {
    const colInput = document.getElementById("grid-columns");
    const rowInput = document.getElementById("grid-rows");
    const colGapInput = document.getElementById("grid-col-gap");
    const rowGapInput = document.getElementById("grid-row-gap");
    const gapLinkedCheck = document.getElementById("grid-gap-linked");
    const areasToggle = document.getElementById("grid-areas-toggle");
    const areasWrapper = document.getElementById("grid-areas-wrapper");
    const copyBtn = document.getElementById("grid-copy-btn");

    if (colInput) {
      colInput.addEventListener("input", (e) => {
        state.grid.columns = e.target.value;
        if (state.grid.areasEnabled) rebuildAreasGrid();
        renderGridOutput();
        renderGridPreview();
      });
    }

    if (rowInput) {
      rowInput.addEventListener("input", (e) => {
        state.grid.rows = e.target.value;
        if (state.grid.areasEnabled) rebuildAreasGrid();
        renderGridOutput();
        renderGridPreview();
      });
    }

    if (colGapInput) {
      colGapInput.addEventListener("input", (e) => {
        state.grid.colGap = e.target.value;
        if (state.grid.gapLinked) {
          state.grid.rowGap = e.target.value;
          if (rowGapInput) rowGapInput.value = e.target.value;
        }
        renderGridOutput();
        renderGridPreview();
      });
    }

    if (rowGapInput) {
      rowGapInput.addEventListener("input", (e) => {
        state.grid.rowGap = e.target.value;
        if (state.grid.gapLinked) {
          state.grid.colGap = e.target.value;
          if (colGapInput) colGapInput.value = e.target.value;
        }
        renderGridOutput();
        renderGridPreview();
      });
    }

    if (gapLinkedCheck) {
      gapLinkedCheck.addEventListener("change", (e) => {
        state.grid.gapLinked = e.target.checked;
        if (e.target.checked && colGapInput) {
          state.grid.rowGap = state.grid.colGap;
          if (rowGapInput) rowGapInput.value = state.grid.colGap;
        }
      });
    }

    if (areasToggle && areasWrapper) {
      areasToggle.addEventListener("change", (e) => {
        state.grid.areasEnabled = e.target.checked;
        areasWrapper.hidden = !e.target.checked;
        if (e.target.checked) {
          rebuildAreasGrid();
        }
        renderGridOutput();
        renderGridPreview();
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        const output = document.getElementById("grid-output");
        handleCopy(copyBtn, output?.textContent || "");
      });
    }

    document.querySelectorAll(".track-hint-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetId = btn.dataset.target;
        const value = btn.dataset.value;
        const input = document.getElementById(targetId);
        if (!input) return;
        const current = input.value.trim();
        input.value = current ? `${current} ${value}` : value;
        input.dispatchEvent(new Event("input"));
        input.focus();
      });
    });

    const selectorInput = document.getElementById("grid-selector");
    if (selectorInput) {
      selectorInput.addEventListener("input", renderGridOutput);
    }

    const resetBtn = document.getElementById("grid-reset-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", resetGridTab);
    }

    const alignEl = document.getElementById("grid-align-items");
    if (alignEl) {
      alignEl.addEventListener("change", (e) => {
        state.grid.alignItems = e.target.value;
        renderGridOutput();
        renderGridPreview();
      });
    }

    const justifyEl = document.getElementById("grid-justify-items");
    if (justifyEl) {
      justifyEl.addEventListener("change", (e) => {
        state.grid.justifyItems = e.target.value;
        renderGridOutput();
        renderGridPreview();
      });
    }

    const templateSel = document.getElementById("grid-template-select");
    if (templateSel) {
      templateSel.addEventListener("change", (e) => {
        if (e.target.value) applyGridTemplate(e.target.value);
      });
    }

    const outputToggleBtns = document.querySelectorAll(
      ".output-toggle__btn[data-panel='grid']",
    );
    outputToggleBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        state.gridOutputMode = btn.dataset.mode;
        outputToggleBtns.forEach((b) =>
          b.classList.toggle("output-toggle__btn--active", b === btn),
        );
        renderGridOutput();
      });
    });

    state.gridOutputMode = "css";
    renderGridOutput();
    renderGridPreview();
  }

  /* ================================
     SUBGRID TAB
     ================================ */

  /**
   * Reads the CSS parent selector name from the subgrid selector input.
   * @return {string}
   */
  function getSubgridSelector() {
    const val = (document.getElementById("sub-selector")?.value || "").trim();
    return val || "parent";
  }

  /**
   * Builds the CSS output string for the subgrid tab.
   * Supports multiple children.
   * @return {string}
   */
  function buildSubgridCSS() {
    const s = state.subgrid;
    const parentSelector = getSubgridSelector();

    const lines = [
      `.${parentSelector} {`,
      "  display: grid;",
      `  grid-template-columns: ${s.parentColumns.trim()};`,
      `  grid-template-rows: ${s.parentRows.trim()};`,
      `  gap: ${s.parentGap.trim()};`,
      "}",
    ];

    s.children.forEach((child, idx) => {
      const colSubgrid = child.axes === "both" || child.axes === "columns";
      const rowSubgrid = child.axes === "both" || child.axes === "rows";
      const childName =
        child.label.trim() ||
        (s.children.length === 1 ? "child" : `child-${idx + 1}`);

      lines.push("", `.${childName} {`);
      lines.push(`  grid-column: ${child.colStart} / ${child.colEnd};`);
      lines.push(`  grid-row: ${child.rowStart} / ${child.rowEnd};`);
      lines.push("  display: grid;");
      if (colSubgrid) lines.push("  grid-template-columns: subgrid;");
      if (rowSubgrid) lines.push("  grid-template-rows: subgrid;");
      lines.push("}");
    });

    return lines.join("\n");
  }

  /* ================================
     SUBGRID INTERACTIVE PREVIEW
     ================================ */

  const subgridDrag = {
    active: false,
    childIdx: -1,
    edge: "",
    childEl: null,
    colLines: {},
    rowLines: {},
    previewRect: null,
  };

  /**
   * Computes grid line pixel positions from rendered background cells.
   * @param {HTMLElement} preview The preview container element.
   * @return {{colLines: Object, rowLines: Object}}
   */
  function computeSubgridLines(preview) {
    const rect = preview.getBoundingClientRect();
    const cells = preview.querySelectorAll(".preview-item--bg");
    const colLines = {};
    const rowLines = {};

    cells.forEach((cell) => {
      const c = parseInt(cell.dataset.col, 10);
      const r = parseInt(cell.dataset.row, 10);
      const cr = cell.getBoundingClientRect();
      if (!(c in colLines)) colLines[c] = cr.left - rect.left;
      colLines[c + 1] = cr.right - rect.left;
      if (!(r in rowLines)) rowLines[r] = cr.top - rect.top;
      rowLines[r + 1] = cr.bottom - rect.top;
    });

    return { colLines, rowLines };
  }

  /**
   * Finds the nearest grid line number to a pixel position.
   * @param {number} pos Pixel position relative to preview.
   * @param {Object} lines Map of grid line number to pixel position.
   * @return {number}
   */
  function snapToLine(pos, lines) {
    const entries = Object.entries(lines)
      .map(([num, px]) => [parseInt(num, 10), px])
      .sort((a, b) => a[1] - b[1]);

    // Snap when 25% past a line (not 50%)
    for (let i = entries.length - 1; i >= 0; i--) {
      const [num, px] = entries[i];
      const nextPx = entries[i + 1] ? entries[i + 1][1] : px + 100;
      const threshold = px + (nextPx - px) * 0.25;
      if (pos >= threshold) return entries[i + 1] ? entries[i + 1][0] : num;
      if (pos >= px) return num;
    }
    return entries[0] ? entries[0][0] : 1;
  }

  /**
   * Creates resize handle elements for a subgrid child overlay.
   * @param {number} childIdx Index of the child in state.subgrid.children.
   * @return {DocumentFragment}
   */
  function createResizeHandles(childIdx) {
    const frag = document.createDocumentFragment();
    const edges = ["left", "right", "top", "bottom"];
    edges.forEach((edge) => {
      const handle = document.createElement("div");
      handle.className = `subgrid-handle subgrid-handle--${edge}`;
      handle.dataset.childIdx = String(childIdx);
      handle.dataset.edge = edge;
      handle.setAttribute(
        "aria-label",
        `Resize ${edge} edge of child ${childIdx + 1}`,
      );
      handle.addEventListener("pointerdown", startSubgridDrag);
      frag.appendChild(handle);
    });
    return frag;
  }

  /**
   * Starts a subgrid child resize drag.
   * @param {PointerEvent} e
   */
  function startSubgridDrag(e) {
    e.preventDefault();
    e.stopPropagation();

    const preview = document.getElementById("sub-preview");
    if (!preview) return;

    const childIdx = parseInt(e.target.dataset.childIdx, 10);
    const edge = e.target.dataset.edge;
    const childEl = e.target.parentElement;
    const { colLines, rowLines } = computeSubgridLines(preview);

    subgridDrag.active = true;
    subgridDrag.childIdx = childIdx;
    subgridDrag.edge = edge;
    subgridDrag.childEl = childEl;
    subgridDrag.colLines = colLines;
    subgridDrag.rowLines = rowLines;
    subgridDrag.previewRect = preview.getBoundingClientRect();

    document.body.style.userSelect = "none";
    document.addEventListener("pointermove", handleSubgridDragMove);
    document.addEventListener("pointerup", stopSubgridDrag);
  }

  /**
   * Handles pointer move during subgrid child resize.
   * @param {PointerEvent} e
   */
  function handleSubgridDragMove(e) {
    if (!subgridDrag.active) return;

    const child = state.subgrid.children[subgridDrag.childIdx];
    if (!child) return;

    const x = e.clientX - subgridDrag.previewRect.left;
    const y = e.clientY - subgridDrag.previewRect.top;
    const maxCol = parseTracks(state.subgrid.parentColumns).length + 1;
    const maxRow = parseTracks(state.subgrid.parentRows).length + 1;

    if (subgridDrag.edge === "right") {
      const n = Math.min(snapToLine(x, subgridDrag.colLines), maxCol);
      if (n > child.colStart) child.colEnd = n;
    } else if (subgridDrag.edge === "left") {
      const n = Math.max(snapToLine(x, subgridDrag.colLines), 1);
      if (n < child.colEnd) child.colStart = n;
    } else if (subgridDrag.edge === "bottom") {
      const n = Math.min(snapToLine(y, subgridDrag.rowLines), maxRow);
      if (n > child.rowStart) child.rowEnd = n;
    } else if (subgridDrag.edge === "top") {
      const n = Math.max(snapToLine(y, subgridDrag.rowLines), 1);
      if (n < child.rowEnd) child.rowStart = n;
    }

    subgridDrag.childEl.style.gridColumn = `${child.colStart} / ${child.colEnd}`;
    subgridDrag.childEl.style.gridRow = `${child.rowStart} / ${child.rowEnd}`;
  }

  /**
   * Ends the subgrid child resize drag and syncs UI.
   */
  function stopSubgridDrag() {
    subgridDrag.active = false;
    document.body.style.userSelect = "";
    document.removeEventListener("pointermove", handleSubgridDragMove);
    document.removeEventListener("pointerup", stopSubgridDrag);

    renderSubgridChildren();
    renderSubgridPreview();
    renderSubgridOutput();
  }

  /**
   * Adds a new subgrid child at the clicked cell position.
   * @param {number} col Column number (1-based).
   * @param {number} row Row number (1-based).
   */
  function addChildAtCell(col, row) {
    state.subgrid.children.push({
      label: "",
      colStart: col,
      colEnd: col + 1,
      rowStart: row,
      rowEnd: row + 1,
      axes: "both",
    });
    renderSubgridChildren();
    renderSubgridPreview();
    renderSubgridOutput();
  }

  /**
   * Renders the subgrid live preview with multiple children.
   */
  function renderSubgridPreview() {
    const preview = document.getElementById("sub-preview");
    if (!preview) return;

    const s = state.subgrid;
    const colTracks = parseTracks(s.parentColumns);
    const rowTracks = parseTracks(s.parentRows);
    const cols = Math.min(colTracks.length, 12) || 1;
    const rows = Math.min(rowTracks.length, 12) || 1;

    preview.style.cssText = `
      display: grid;
      grid-template-columns: ${s.parentColumns || "1fr"};
      grid-template-rows: ${s.parentRows || "auto"};
      gap: ${s.parentGap || "0"};
      position: relative;
    `;
    preview.innerHTML = "";

    const total = cols * rows;
    for (let i = 0; i < Math.min(total, 48); i++) {
      const r = Math.floor(i / cols) + 1;
      const c = (i % cols) + 1;
      const item = document.createElement("div");
      item.className = "preview-item preview-item--bg";
      item.dataset.col = String(c);
      item.dataset.row = String(r);
      item.style.gridColumn = String(c);
      item.style.gridRow = String(r);
      item.style.backgroundColor = "var(--clr-bg-alt)";
      item.style.borderColor = "var(--clr-border)";
      item.style.color = "var(--clr-text-muted)";
      item.style.fontSize = "0.6875rem";
      item.title = "Click to add child";
      item.textContent = String(i + 1);
      item.addEventListener("click", () => addChildAtCell(c, r));
      preview.appendChild(item);
    }

    s.children.forEach((child, idx) => {
      const color = AREA_COLORS[idx % AREA_COLORS.length];
      const childEl = document.createElement("div");
      childEl.className = "preview-item preview-item--subchild";
      childEl.style.gridColumn = `${child.colStart} / ${child.colEnd}`;
      childEl.style.gridRow = `${child.rowStart} / ${child.rowEnd}`;
      childEl.style.backgroundColor = color.bg;
      childEl.style.border = `2px solid ${color.border}`;
      childEl.style.borderColor = color.border;
      childEl.style.color = getTextColor(color);
      childEl.style.zIndex = String(2 + idx);
      childEl.style.fontWeight = "700";
      const childName =
        child.label.trim() ||
        (s.children.length === 1 ? ".child" : `.child-${idx + 1}`);
      childEl.textContent = childName;
      childEl.title = "Double-click to rename";
      childEl.addEventListener("dblclick", (ev) => {
        ev.stopPropagation();
        startInlineSubchildEdit(childEl, idx);
      });

      // Remove button
      const rmBtn = document.createElement("button");
      rmBtn.className = "grid-item-remove";
      rmBtn.type = "button";
      rmBtn.textContent = "\u00d7";
      rmBtn.title = "Remove child";
      rmBtn.setAttribute("aria-label", `Remove child ${idx + 1}`);
      rmBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        if (s.children.length > 1) {
          s.children.splice(idx, 1);
          renderSubgridChildren();
          renderSubgridPreview();
          renderSubgridOutput();
        }
      });
      childEl.appendChild(rmBtn);

      childEl.appendChild(createResizeHandles(idx));
      preview.appendChild(childEl);
    });
  }

  /**
   * Builds the HTML output for the subgrid tab.
   * @return {string}
   */
  function buildSubgridHTML() {
    const s = state.subgrid;
    const parentSelector = getSubgridSelector();
    const lines = [`<div class="${parentSelector}">`];

    s.children.forEach((child, idx) => {
      const childName =
        child.label.trim() ||
        (s.children.length === 1 ? "child" : `child-${idx + 1}`);
      lines.push(`  <div class="${childName}">`);
      lines.push(`    <!-- subgrid content -->`);
      lines.push(`  </div>`);
    });

    lines.push("</div>");
    return lines.join("\n");
  }

  /**
   * Updates the subgrid CSS/HTML output element.
   */
  function renderSubgridOutput() {
    const el = document.getElementById("sub-output");
    if (!el) return;
    const mode = state.subOutputMode || "css";
    el.textContent = mode === "html" ? buildSubgridHTML() : buildSubgridCSS();
  }

  /**
   * Handles changes to individual subgrid child properties.
   * @param {Event} e
   */
  function handleSubChildChange(e) {
    const idx = parseInt(e.target.dataset.index, 10);
    const prop = e.target.dataset.prop;
    const child = state.subgrid.children[idx];
    if (!child) return;

    const numProps = ["colStart", "colEnd", "rowStart", "rowEnd"];
    if (numProps.includes(prop)) {
      const val = parseInt(e.target.value, 10);
      if (!isNaN(val) && val >= 1) child[prop] = val;
    } else {
      child[prop] = e.target.value;
    }

    renderSubgridPreview();
    renderSubgridOutput();
  }

  /**
   * Renders the subgrid children list as interactive cards.
   */
  function renderSubgridChildren() {
    const container = document.getElementById("sub-children-list");
    if (!container) return;

    container.innerHTML = "";

    state.subgrid.children.forEach((child, idx) => {
      const card = document.createElement("div");
      card.className = "sub-child-card";
      const canRemove = state.subgrid.children.length > 1;

      card.innerHTML = `
        <div class="sub-child-card__header">
          <span class="sub-child-card__label">Child ${idx + 1}</span>
          <button class="sub-child-card__remove" type="button"
            data-index="${idx}"
            aria-label="Remove child ${idx + 1}"
            ${!canRemove ? "disabled" : ""}>&times;</button>
        </div>
        <div class="sub-child-card__body">
          <div class="control-group">
            <label class="form-group__label" for="sc-label-${idx}">CSS class name</label>
            <input class="form-group__input" type="text" id="sc-label-${idx}"
              value="${esc(child.label)}" placeholder="child" data-index="${idx}" data-prop="label"
              autocomplete="off" spellcheck="false">
          </div>
          <div class="control-group">
            <label class="form-group__label" for="sc-axes-${idx}">
              Subgrid axes
              <button class="info-btn" type="button" tabindex="0"
                data-tooltip="Which axes this child inherits from the parent grid. Both = inherits column and row tracks. Use Columns only or Rows only for partial subgrid layouts."
                aria-label="About subgrid axes">&#9432;</button>
            </label>
            <select class="form-group__input" id="sc-axes-${idx}"
              data-index="${idx}" data-prop="axes">
              <option value="both"${child.axes === "both" ? " selected" : ""}>Both (columns and rows)</option>
              <option value="columns"${child.axes === "columns" ? " selected" : ""}>Columns only</option>
              <option value="rows"${child.axes === "rows" ? " selected" : ""}>Rows only</option>
            </select>
          </div>
          <div class="grid-2col">
            <div class="control-group">
              <label class="form-group__label" for="sc-col-start-${idx}">Column start</label>
              <input class="form-group__input" type="number" id="sc-col-start-${idx}"
                value="${child.colStart}" min="1" data-index="${idx}" data-prop="colStart">
            </div>
            <div class="control-group">
              <label class="form-group__label" for="sc-col-end-${idx}">Column end</label>
              <input class="form-group__input" type="number" id="sc-col-end-${idx}"
                value="${child.colEnd}" min="2" data-index="${idx}" data-prop="colEnd">
            </div>
            <div class="control-group">
              <label class="form-group__label" for="sc-row-start-${idx}">Row start</label>
              <input class="form-group__input" type="number" id="sc-row-start-${idx}"
                value="${child.rowStart}" min="1" data-index="${idx}" data-prop="rowStart">
            </div>
            <div class="control-group">
              <label class="form-group__label" for="sc-row-end-${idx}">Row end</label>
              <input class="form-group__input" type="number" id="sc-row-end-${idx}"
                value="${child.rowEnd}" min="2" data-index="${idx}" data-prop="rowEnd">
            </div>
          </div>
        </div>
      `;

      card.querySelectorAll("[data-prop]").forEach((el) => {
        el.addEventListener("input", handleSubChildChange);
        el.addEventListener("change", handleSubChildChange);
      });

      const removeBtn = card.querySelector(".sub-child-card__remove");
      if (removeBtn && canRemove) {
        removeBtn.addEventListener("click", (e) => {
          const i = parseInt(e.currentTarget.dataset.index, 10);
          state.subgrid.children.splice(i, 1);
          renderSubgridChildren();
          renderSubgridPreview();
          renderSubgridOutput();
        });
      }

      container.appendChild(card);
    });
  }

  /**
   * Resets the subgrid tab to its default state and syncs all UI inputs.
   */
  function resetSubgridTab() {
    state.subgrid = subgridDefaults();

    const colInput = document.getElementById("sub-parent-columns");
    const rowInput = document.getElementById("sub-parent-rows");
    const gapInput = document.getElementById("sub-parent-gap");

    if (colInput) colInput.value = state.subgrid.parentColumns;
    if (rowInput) rowInput.value = state.subgrid.parentRows;
    if (gapInput) gapInput.value = state.subgrid.parentGap;

    renderSubgridChildren();
    renderSubgridPreview();
    renderSubgridOutput();
  }

  /**
   * Initializes subgrid tab event listeners.
   */
  function initSubgridTab() {
    const parentFields = [
      ["sub-parent-columns", "parentColumns"],
      ["sub-parent-rows", "parentRows"],
      ["sub-parent-gap", "parentGap"],
    ];

    parentFields.forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", (e) => {
          state.subgrid[key] = e.target.value;
          renderSubgridPreview();
          renderSubgridOutput();
        });
      }
    });

    const addChildBtn = document.getElementById("sub-add-child");
    if (addChildBtn) {
      addChildBtn.addEventListener("click", () => {
        state.subgrid.children.push({
          label: "",
          colStart: 1,
          colEnd: 3,
          rowStart: 1,
          rowEnd: 3,
          axes: "both",
        });
        renderSubgridChildren();
        renderSubgridPreview();
        renderSubgridOutput();
      });
    }

    const selectorInput = document.getElementById("sub-selector");
    if (selectorInput) {
      selectorInput.addEventListener("input", renderSubgridOutput);
    }

    const resetBtn = document.getElementById("sub-reset-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", resetSubgridTab);
    }

    const copyBtn = document.getElementById("sub-copy-btn");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        const output = document.getElementById("sub-output");
        handleCopy(copyBtn, output?.textContent || "");
      });
    }

    const subOutputBtns = document.querySelectorAll(
      ".output-toggle__btn[data-panel='subgrid']",
    );
    subOutputBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        state.subOutputMode = btn.dataset.mode;
        subOutputBtns.forEach((b) =>
          b.classList.toggle("output-toggle__btn--active", b === btn),
        );
        renderSubgridOutput();
      });
    });

    state.subOutputMode = "css";
    renderSubgridChildren();
    renderSubgridOutput();
    renderSubgridPreview();
  }

  /* ================================
     FLEXBOX TAB
     ================================ */

  /**
   * Reads the CSS selector name from the flex selector input.
   * @return {string}
   */
  function getFlexSelector() {
    const val = (document.getElementById("flex-selector")?.value || "").trim();
    return val || "container";
  }

  /**
   * Builds the flex shorthand value for one item.
   * @param {{grow:number, shrink:number, basis:string}} item
   * @return {string}
   */
  function buildFlexShorthand(item) {
    const { grow, shrink, basis } = item;
    if (grow === 0 && shrink === 1 && basis === "auto") return "0 1 auto";
    if (grow === 1 && shrink === 1 && basis === "0") return "1";
    return `${grow} ${shrink} ${basis}`;
  }

  /**
   * Builds the CSS output string for the flexbox tab.
   * @return {string}
   */
  function buildFlexCSS() {
    const f = state.flex;
    const selector = getFlexSelector();
    const lines = [`.${selector} {`, "  display: flex;"];

    if (f.direction !== "default") {
      lines.push(`  flex-direction: ${f.direction};`);
    }
    if (f.wrap !== "default") {
      lines.push(`  flex-wrap: ${f.wrap};`);
    }
    if (f.justifyContent !== "default") {
      lines.push(`  justify-content: ${f.justifyContent};`);
    }
    if (f.alignItems !== "default") {
      lines.push(`  align-items: ${f.alignItems};`);
    }
    if (f.alignContent !== "default") {
      lines.push(`  align-content: ${f.alignContent};`);
    }

    if (f.gap.trim()) {
      lines.push(`  gap: ${f.gap.trim()};`);
    }

    lines.push("}");

    const flexSel = selector;
    f.items.forEach((item, idx) => {
      const itemName = item.label.trim() || `${flexSel}__item-${idx + 1}`;
      const flexVal = buildFlexShorthand(item);
      const hasOverrides =
        flexVal !== "0 1 auto" || item.alignSelf !== "auto" || item.order !== 0;
      if (hasOverrides) {
        lines.push("", `.${itemName} {`);
        if (flexVal !== "0 1 auto") lines.push(`  flex: ${flexVal};`);
        if (item.alignSelf !== "auto")
          lines.push(`  align-self: ${item.alignSelf};`);
        if (item.order !== 0) lines.push(`  order: ${item.order};`);
        lines.push("}");
      }
    });

    return lines.join("\n");
  }

  /**
   * Renders the flexbox live preview.
   */
  function renderFlexPreview() {
    const preview = document.getElementById("flex-preview");
    if (!preview) return;

    const f = state.flex;
    preview.style.cssText = `
      display: flex;
      flex-direction: ${f.direction === "default" ? "row" : f.direction};
      flex-wrap: ${f.wrap === "default" ? "nowrap" : f.wrap};
      justify-content: ${f.justifyContent === "default" ? "flex-start" : f.justifyContent};
      align-items: ${f.alignItems === "default" ? "stretch" : f.alignItems};
      align-content: ${f.alignContent === "default" ? "normal" : f.alignContent};
      gap: ${f.gap || "0"};
    `;
    preview.innerHTML = "";

    f.items.forEach((item, idx) => {
      const color = AREA_COLORS[idx % AREA_COLORS.length];
      const el = document.createElement("div");
      el.className = "preview-item";
      el.style.flex = buildFlexShorthand(item);
      if (item.alignSelf !== "auto") el.style.alignSelf = item.alignSelf;
      if (item.order !== 0) el.style.order = String(item.order);
      el.style.backgroundColor = color.bg;
      el.style.borderColor = color.border;
      el.style.color = getTextColor(color);
      el.style.minWidth = "2.5rem";
      el.style.minHeight = "2.5rem";
      el.textContent = String(idx + 1);
      preview.appendChild(el);
    });
  }

  /**
   * Builds the HTML output for the flexbox tab.
   * @return {string}
   */
  function buildFlexHTML() {
    const selector = getFlexSelector();
    const lines = [`<div class="${selector}">`];
    const flexSel = selector;
    state.flex.items.forEach((item, idx) => {
      const itemName = item.label.trim() || `${flexSel}__item-${idx + 1}`;
      lines.push(`  <div class="${itemName}">${idx + 1}</div>`);
    });
    lines.push("</div>");
    return lines.join("\n");
  }

  /**
   * Updates the flex CSS/HTML output element.
   */
  function renderFlexOutput() {
    const el = document.getElementById("flex-output");
    if (!el) return;
    const mode = state.flexOutputMode || "css";
    el.textContent = mode === "html" ? buildFlexHTML() : buildFlexCSS();
  }

  /**
   * Renders the flex items configuration list.
   */
  function renderFlexItems() {
    const container = document.getElementById("flex-items-list");
    if (!container) return;

    container.innerHTML = "";

    state.flex.items.forEach((item, idx) => {
      const card = document.createElement("div");
      card.className = "flex-item-card";

      card.innerHTML = `
        <div class="flex-item-card__header">
          <span class="flex-item-card__label">Item ${idx + 1}</span>
          <button class="flex-item-card__remove" type="button" data-index="${idx}"
            aria-label="Remove item ${idx + 1}">&times;</button>
        </div>
        <div class="flex-item-card__body">
          <div class="control-group">
            <label class="form-group__label" for="fi-label-${idx}">CSS class name</label>
            <input class="form-group__input" type="text" id="fi-label-${idx}"
              value="${esc(item.label)}" placeholder="container__item-${idx + 1}"
              data-index="${idx}" data-prop="label"
              autocomplete="off" spellcheck="false">
          </div>
          <div class="flex-item-row">
            <div class="form-group">
              <label class="form-group__label" for="fi-grow-${idx}">
                flex-grow
                <button class="info-btn" type="button" tabindex="0"
                  data-tooltip="How much this item grows relative to siblings when there is extra space. 0=no growth. 1=grows equal to others. Higher value=grows more."
                  aria-label="About flex-grow">&#9432;</button>
              </label>
              <input class="form-group__input" type="number" id="fi-grow-${idx}"
                value="${item.grow}" min="0" step="1" data-index="${idx}" data-prop="grow">
            </div>
            <div class="form-group">
              <label class="form-group__label" for="fi-shrink-${idx}">
                flex-shrink
                <button class="info-btn" type="button" tabindex="0"
                  data-tooltip="How much this item shrinks relative to siblings when there is not enough space. 1=shrinks equally (default). 0=never shrinks."
                  aria-label="About flex-shrink">&#9432;</button>
              </label>
              <input class="form-group__input" type="number" id="fi-shrink-${idx}"
                value="${item.shrink}" min="0" step="1" data-index="${idx}" data-prop="shrink">
            </div>
            <div class="form-group">
              <label class="form-group__label" for="fi-basis-${idx}">
                flex-basis
                <button class="info-btn" type="button" tabindex="0"
                  data-tooltip="The item's starting size before flex-grow or shrink apply. auto=use width or content. 0=start from zero. Also accepts px, %, rem values."
                  aria-label="About flex-basis">&#9432;</button>
              </label>
              <input class="form-group__input" type="text" id="fi-basis-${idx}"
                value="${esc(item.basis)}" data-index="${idx}" data-prop="basis"
                autocomplete="off" spellcheck="false">
            </div>
            <div class="form-group">
              <label class="form-group__label" for="fi-align-${idx}">
                align-self
                <button class="info-btn" type="button" tabindex="0"
                  data-tooltip="Overrides the container's align-items for this specific item only. Useful when one item needs different cross-axis alignment than the rest."
                  aria-label="About align-self">&#9432;</button>
              </label>
              <select class="form-group__input" id="fi-align-${idx}"
                data-index="${idx}" data-prop="alignSelf">
                <option value="auto"${item.alignSelf === "auto" ? " selected" : ""}>auto</option>
                <option value="stretch"${item.alignSelf === "stretch" ? " selected" : ""}>stretch</option>
                <option value="flex-start"${item.alignSelf === "flex-start" ? " selected" : ""}>flex-start</option>
                <option value="flex-end"${item.alignSelf === "flex-end" ? " selected" : ""}>flex-end</option>
                <option value="center"${item.alignSelf === "center" ? " selected" : ""}>center</option>
                <option value="baseline"${item.alignSelf === "baseline" ? " selected" : ""}>baseline</option>
              </select>
            </div>
          </div>
        </div>
      `;

      card.querySelectorAll("[data-prop]").forEach((el) => {
        el.addEventListener("input", handleFlexItemChange);
        el.addEventListener("change", handleFlexItemChange);
      });

      card
        .querySelector(".flex-item-card__remove")
        .addEventListener("click", (e) => {
          const i = parseInt(e.currentTarget.dataset.index, 10);
          if (state.flex.items.length > 1) {
            state.flex.items.splice(i, 1);
            renderFlexItems();
            renderFlexPreview();
            renderFlexOutput();
          }
        });

      container.appendChild(card);
    });
  }

  /**
   * Handles changes to individual flex item properties.
   * @param {Event} e
   */
  function handleFlexItemChange(e) {
    const idx = parseInt(e.target.dataset.index, 10);
    const prop = e.target.dataset.prop;
    const item = state.flex.items[idx];
    if (!item) return;

    if (prop === "grow" || prop === "shrink") {
      const val = parseFloat(e.target.value);
      item[prop] = isNaN(val) ? 0 : Math.max(0, val);
    } else if (prop === "order") {
      const val = parseInt(e.target.value, 10);
      item.order = isNaN(val) ? 0 : val;
    } else {
      item[prop] = e.target.value;
    }

    renderFlexPreview();
    renderFlexOutput();
  }

  /**
   * Resets the flexbox tab to its default state and syncs all UI inputs.
   */
  function resetFlexTab() {
    state.flex = flexDefaults();

    const dirEl = document.getElementById("flex-direction");
    const wrapEl = document.getElementById("flex-wrap");
    const justifyEl = document.getElementById("flex-justify");
    const alignItemsEl = document.getElementById("flex-align-items");
    const alignContentEl = document.getElementById("flex-align-content");
    const gapEl = document.getElementById("flex-gap");

    if (dirEl) dirEl.value = state.flex.direction;
    if (wrapEl) wrapEl.value = state.flex.wrap;
    if (justifyEl) justifyEl.value = state.flex.justifyContent;
    if (alignItemsEl) alignItemsEl.value = state.flex.alignItems;
    if (alignContentEl) alignContentEl.value = state.flex.alignContent;
    if (gapEl) gapEl.value = state.flex.gap;

    renderFlexItems();
    renderFlexPreview();
    renderFlexOutput();
  }

  /**
   * Initializes flexbox tab event listeners.
   */
  function initFlexTab() {
    const containerFields = [
      ["flex-direction", "direction"],
      ["flex-wrap", "wrap"],
      ["flex-justify", "justifyContent"],
      ["flex-align-items", "alignItems"],
      ["flex-align-content", "alignContent"],
    ];

    containerFields.forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("change", (e) => {
          state.flex[key] = e.target.value;
          renderFlexPreview();
          renderFlexOutput();
        });
      }
    });

    const gapEl = document.getElementById("flex-gap");
    if (gapEl) {
      gapEl.addEventListener("input", (e) => {
        state.flex.gap = e.target.value;
        renderFlexPreview();
        renderFlexOutput();
      });
    }

    const addBtn = document.getElementById("flex-add-item");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        state.flex.items.push({
          label: "",
          grow: 0,
          shrink: 1,
          basis: "auto",
          alignSelf: "auto",
          order: 0,
        });
        renderFlexItems();
        renderFlexPreview();
        renderFlexOutput();
      });
    }

    const selectorInput = document.getElementById("flex-selector");
    if (selectorInput) {
      selectorInput.addEventListener("input", renderFlexOutput);
    }

    const resetBtn = document.getElementById("flex-reset-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", resetFlexTab);
    }

    const copyBtn = document.getElementById("flex-copy-btn");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        const output = document.getElementById("flex-output");
        handleCopy(copyBtn, output?.textContent || "");
      });
    }

    const flexOutputBtns = document.querySelectorAll(
      ".output-toggle__btn[data-panel='flex']",
    );
    flexOutputBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        state.flexOutputMode = btn.dataset.mode;
        flexOutputBtns.forEach((b) =>
          b.classList.toggle("output-toggle__btn--active", b === btn),
        );
        renderFlexOutput();
      });
    });

    state.flexOutputMode = "css";
    renderFlexItems();
    renderFlexPreview();
    renderFlexOutput();
  }

  /* ================================
     TOOLTIP ACCESSIBILITY
     ================================ */

  /**
   * Makes data-tooltip content accessible to screen readers by creating hidden
   * sr-only spans and linking them via aria-describedby.
   */
  function initTooltipAccessibility() {
    document.querySelectorAll("[data-tooltip]").forEach((el, idx) => {
      const id = `tt-desc-${idx}`;
      const span = document.createElement("span");
      span.className = "sr-only";
      span.id = id;
      span.textContent = el.getAttribute("data-tooltip");
      el.appendChild(span);
      el.setAttribute("aria-describedby", id);
    });
  }

  /* ================================
     INIT
     ================================ */

  /**
   * Initializes the application.
   */
  function initializeApp() {
    setFooterYear();
    initTheme();

    const themeBtn = document.getElementById("theme-toggle");
    if (themeBtn) {
      themeBtn.addEventListener("click", toggleTheme);
    }

    document.querySelectorAll("[role='tab']").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tabId = btn.id.replace("tab-", "");
        switchTab(tabId);
      });
      btn.addEventListener("keydown", (e) => {
        const tabs = ["grid", "subgrid", "flexbox"];
        const current = tabs.indexOf(state.activeTab);
        let next = -1;
        if (e.key === "ArrowRight") next = (current + 1) % tabs.length;
        if (e.key === "ArrowLeft")
          next = (current - 1 + tabs.length) % tabs.length;
        if (e.key === "Home") next = 0;
        if (e.key === "End") next = tabs.length - 1;
        if (next !== -1) {
          e.preventDefault();
          switchTab(tabs[next]);
          document.getElementById(`tab-${tabs[next]}`)?.focus();
        }
      });
    });

    initGridTab();
    initSubgridTab();
    initFlexTab();
    initTooltipAccessibility();
  }

  if (document.readyState === "complete") {
    initializeApp();
  } else {
    window.addEventListener("load", initializeApp, { once: true });
  }
})();

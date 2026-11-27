// The deal finder: hash routes, live search and filters, no network.
//   #/            the list, with search + filters
//   #/deal/<id>   one deal, with its verdict explained
//
// window.__shotReady is false while a page renders and true once it is on
// screen, so a screenshot script knows when to capture.

import { deals, saleWindows } from "./data.js";
import { deal, list, missing, percentOff, rows, saveAmount } from "./views.js";

const app = document.getElementById("app");

const state = {
  q: "",
  category: "All",
  store: "All stores",
  minOff: 0,
  sort: "off",
};

function filtered() {
  const q = state.q.trim().toLowerCase();
  let out = deals.filter(
    (d) =>
      (state.category === "All" || d.category === state.category) &&
      (state.store === "All stores" || d.store === state.store) &&
      percentOff(d) >= state.minOff &&
      (q === "" ||
        `${d.title} ${d.store} ${d.category}`.toLowerCase().includes(q)),
  );
  const by = {
    off: (a, b) => percentOff(b) - percentOff(a),
    save: (a, b) => saveAmount(b) - saveAmount(a),
    price: (a, b) => a.price - b.price,
    name: (a, b) => a.title.localeCompare(b.title),
  }[state.sort];
  return out.sort(by);
}

function renderList() {
  const shown = filtered();
  app.innerHTML = list(shown, deals, state);
  const q = app.querySelector("#q");
  q.addEventListener("input", () => {
    state.q = q.value;
    app.querySelector(".deals").innerHTML = rows(filtered());
    app.querySelector(".count").textContent = `${filtered().length} of ${deals.length} deals shown`;
  });
  app.querySelector("#store").addEventListener("change", (e) => {
    state.store = e.target.value;
    renderList();
  });
  app.querySelector("#minoff").addEventListener("change", (e) => {
    state.minOff = Number(e.target.value);
    renderList();
  });
  app.querySelector("#sort").addEventListener("change", (e) => {
    state.sort = e.target.value;
    renderList();
  });
  app.querySelectorAll("[data-cat]").forEach((btn) =>
    btn.addEventListener("click", () => {
      state.category = btn.dataset.cat;
      renderList();
    }),
  );
}

function render() {
  window.__shotReady = false;
  const match = location.hash.match(/^#\/deal\/([^/?]+)/);
  if (match) {
    const found = deals.find((d) => d.id === decodeURIComponent(match[1]));
    document.title = `${found ? found.title : "Not found"} | Real Deal Finder — Black Friday 2026`;
    app.innerHTML = found ? deal(found, deals) : missing();
  } else {
    document.title = "Real Deal Finder — Black Friday 2026";
    renderList();
  }
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

const footer = document.getElementById("sale-windows");
if (footer) {
  footer.innerHTML = saleWindows
    .map((w) => `<li><strong>${w.store}:</strong> ${w.window}</li>`)
    .join("");
}

window.addEventListener("hashchange", render);
render();

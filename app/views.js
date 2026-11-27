// HTML for every page, built from the deal data. Every value is escaped
// before it goes into the page. No network requests: all data is local.
//
// Verdict — "is it really a deal?" — from the discount and the check notes:
//   40%+ off            -> REAL DEAL (green): a cut that beats the usual
//                            Black Friday noise, or a recorded low price.
//   25–39% off          -> GOOD DEAL (amber): a solid cut, worth buying if
//                            you wanted the item anyway.
//   under 25% off       -> CHECK FIRST (grey): small cut, or a was-price
//                            that needs a second look before you trust it.
// A `caveat` on a deal always caps its verdict at CHECK FIRST, because a
// was-price the store itself inflated is not a deal until proven otherwise.

const escape = (s) =>
  String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export const usd = (n) =>
  `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

export const percentOff = (d) => Math.round((1 - d.price / d.was) * 100);
export const saveAmount = (d) => d.was - d.price;

export function verdict(d) {
  if (d.caveat) return { label: "CHECK FIRST", cls: "check", rank: 0 };
  const p = percentOff(d);
  if (p >= 40) return { label: "REAL DEAL", cls: "real", rank: 2 };
  if (p >= 25) return { label: "GOOD DEAL", cls: "good", rank: 1 };
  return { label: "CHECK FIRST", cls: "check", rank: 0 };
}

const checkedDay = (iso) =>
  new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }) + " UTC";

const storeClass = (store) => store.toLowerCase().replace(/[^a-z]+/g, "-");

function verdictBadge(d) {
  const v = verdict(d);
  return `<span class="verdict ${v.cls}" title="${escape(
    d.caveat ? `Caution: ${d.caveat}.` : d.note,
  )}">${v.label} · ${percentOff(d)}% OFF</span>`;
}

function priceRow(d) {
  return `<p class="price"><strong>${usd(d.price)}</strong> <s>${usd(d.was)}</s>
    <span class="save">save ${usd(saveAmount(d))}</span></p>`;
}

export function card(d) {
  return `<article class="card">
  <div class="card-top">
    <span class="cat">${escape(d.category)}</span>
    <span class="store store-${storeClass(d.store)}">${escape(d.store)}</span>
  </div>
  <h3><a href="#/deal/${encodeURIComponent(d.id)}">${escape(d.title)}</a></h3>
  ${priceRow(d)}
  ${verdictBadge(d)}
  <p class="meta">Checked ${checkedDay(d.checked)}</p>
  <div class="card-actions">
    <a class="btn" href="${escape(d.url)}" target="_blank" rel="noopener">View at ${escape(d.store)} ↗</a>
    <a class="btn ghost" href="#/deal/${encodeURIComponent(d.id)}">Why this verdict →</a>
  </div>
</article>`;
}

export function rows(deals) {
  if (deals.length === 0)
    return `<li class="empty">No deal matches those filters. Loosen the discount or clear the search.</li>`;
  return deals.map((d) => `<li>${card(d)}</li>`).join("");
}

export function stats(deals) {
  const totalSave = deals.reduce((s, d) => s + saveAmount(d), 0);
  const avgOff =
    deals.length === 0
      ? 0
      : Math.round(deals.reduce((s, d) => s + percentOff(d), 0) / deals.length);
  const realCount = deals.filter((d) => verdict(d).rank === 2).length;
  return { totalSave, avgOff, realCount };
}

export function list(deals, all, state) {
  const s = stats(all);
  const catPills = ["All", ...new Set(all.map((d) => d.category))]
    .sort()
    .map(
      (c) =>
        `<button class="pill${state.category === c ? " active" : ""}" data-cat="${escape(c)}">${escape(c)}</button>`,
    )
    .join("");
  const storeOptions = ["All stores", ...new Set(all.map((d) => d.store))]
    .map(
      (st) =>
        `<option value="${escape(st)}"${state.store === st ? " selected" : ""}>${escape(st)}</option>`,
    )
    .join("");
  return `<section class="hero">
  <p class="kicker">BLACK FRIDAY 2026 · FRI 27 NOV — CYBER MONDAY 30 NOV</p>
  <h1>Real Deal <span>Finder</span></h1>
  <p class="lede">Every price below was checked by an agent against a live deals
  source that names the store — no invented prices, no inflated “was” prices
  taken on trust. Each deal carries a verdict: is it <em>really</em> a deal?</p>
  <dl class="stats">
    <div><dt>Deals checked</dt><dd>${all.length}</dd></div>
    <div><dt>Real deals (40%+ off)</dt><dd>${s.realCount}</dd></div>
    <div><dt>Total you could save</dt><dd>${usd(s.totalSave)}</dd></div>
    <div><dt>Average discount</dt><dd>${s.avgOff}%</dd></div>
  </dl>
</section>

<section class="controls" aria-label="Find a deal">
  <label class="search">Search
    <input type="search" id="q" placeholder="Try “AirPods”, “Dyson”, “TV”…" value="${escape(state.q)}">
  </label>
  <label>Store
    <select id="store">${storeOptions}</select>
  </label>
  <label>Minimum discount
    <select id="minoff">
      ${[0, 20, 30, 40, 50]
        .map((n) => `<option value="${n}"${state.minOff === n ? " selected" : ""}>${n === 0 ? "Any discount" : n + "% off or more"}</option>`)
        .join("")}
    </select>
  </label>
  <label>Sort by
    <select id="sort">
      <option value="off"${state.sort === "off" ? " selected" : ""}>Biggest % off</option>
      <option value="save"${state.sort === "save" ? " selected" : ""}>Biggest saving ($)</option>
      <option value="price"${state.sort === "price" ? " selected" : ""}>Lowest price</option>
      <option value="name"${state.sort === "name" ? " selected" : ""}>Name A–Z</option>
    </select>
  </label>
</section>

<nav class="cats" aria-label="Categories">${catPills}</nav>

<p class="count">${deals.length} of ${all.length} deals shown</p>
<ul class="deals">${rows(deals)}</ul>

<section class="method">
  <h2>How the verdict works</h2>
  <ul>
    <li><span class="verdict real">REAL DEAL · 40%+ OFF</span> A cut that beats the usual Black Friday noise — or a price a tracker calls a record low.</li>
    <li><span class="verdict good">GOOD DEAL · 25–39% OFF</span> A solid cut. Worth buying if you wanted the item anyway.</li>
    <li><span class="verdict check">CHECK FIRST · UNDER 25%</span> A small cut, or a “was” price that needs a second look. We say why on each deal's page.</li>
  </ul>
  <p>Amazon raised list prices on some Echo, Fire TV and Kindle devices earlier this year, so discounts on those are measured against a higher starting price — flagged on the deal. Prices move hourly during Black Friday week: always confirm the live price at the store before you buy. This finder takes no commission and no store paid for placement.</p>
</section>`;
}

export function deal(d, all) {
  const v = verdict(d);
  const p = percentOff(d);
  const barNow = Math.max(4, Math.round((d.price / d.was) * 100));
  const same = all
    .filter((x) => x.id !== d.id && x.title === d.title)
    .map(
      (x) =>
        `<li><a href="#/deal/${encodeURIComponent(x.id)}">${escape(x.store)}: ${usd(x.price)}</a> (${percentOff(x)}% off)</li>`,
    )
    .join("");
  return `<p class="back"><a href="#/">&larr; All deals</a></p>
<article class="detail">
  <div class="card-top">
    <span class="cat">${escape(d.category)}</span>
    <span class="store store-${storeClass(d.store)}">${escape(d.store)}</span>
  </div>
  <h1>${escape(d.title)}</h1>
  ${priceRow(d)}
  <div class="pricebar" role="img" aria-label="Sale price is ${p}% below the usual price">
    <div class="pricebar-now" style="width:${barNow}%"></div>
  </div>
  <p class="pricebar-caption">You pay ${barNow}% of the usual price — ${p}% off</p>
  <p>${verdictBadge(d)}</p>
  <h2>Is it really a deal?</h2>
  <p>${escape(d.note)}</p>
  ${d.caveat ? `<p class="caveat">⚠ Caution: ${escape(d.caveat)}.</p>` : ""}
  <dl class="facts">
    <dt>Store</dt><dd>${escape(d.store)}</dd>
    <dt>Category</dt><dd>${escape(d.category)}</dd>
    <dt>Sale price</dt><dd>${usd(d.price)}</dd>
    <dt>Usual price</dt><dd>${usd(d.was)}</dd>
    <dt>You save</dt><dd>${usd(saveAmount(d))} (${p}% off)</dd>
    <dt>Price checked</dt><dd>${checkedDay(d.checked)}</dd>
    <dt>Read in</dt><dd>${escape(d.source)}</dd>
  </dl>
  <p><a class="btn big" href="${escape(d.url)}" target="_blank" rel="noopener">Find it at ${escape(d.store)} ↗</a></p>
  ${same ? `<h2>Same product, other stores</h2><ul class="same">${same}</ul>` : ""}
</article>`;
}

export function missing() {
  return `<h1>Not found</h1>
<p>There is no deal at this address. <a href="#/">See all deals</a>.</p>`;
}

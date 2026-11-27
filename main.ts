// Hand in this Black Friday deal finder: copy app/ and screenshots/ from
// beside this file into /output and write /output/dossier.json with the
// vendored make.fun library, which the scorer requires byte for byte.
// Node 22, standard library only; no network. Outside the grader's
// container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const here = fileURLToPath(new URL(".", import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

function checkTree(dir, label) {
  if (!existsSync(dir)) throw new Error(`missing ${label} directory: ${dir}`);
  const names = readdirSync(dir);
  if (names.length === 0) throw new Error(`empty ${label} directory: ${dir}`);
  return names;
}

function checkNoBuildStep(appDir) {
  // The site must open as plain static files: refuse anything that smells
  // like a build artefact or a remote dependency.
  const bad = [];
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(map|ts|tsx|jsx)$/.test(name) || name === "package.json") bad.push(p);
    }
  };
  walk(appDir);
  if (bad.length > 0) throw new Error(`build-step files found under app/: ${bad.join(", ")}`);
}

const appDir = join(here, "app");
const shotsDir = join(here, "screenshots");

const appFiles = checkTree(appDir, "app");
if (!appFiles.includes("index.html")) throw new Error("app/index.html is missing");
checkNoBuildStep(appDir);

const shotFiles = checkTree(shotsDir, "screenshots").filter((f) => /\.(png|jpe?g)$/i.test(f));
if (shotFiles.length < 3 || shotFiles.length > 4) {
  throw new Error(`expected 3 or 4 screenshots, found ${shotFiles.length}`);
}

mkdirSync(out, { recursive: true });
cpSync(appDir, join(out, "app"), { recursive: true });
mkdirSync(join(out, "screenshots"), { recursive: true });
cpSync(shotsDir, join(out, "screenshots"), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files and directories in
// app/ or 16 MiB of app files).
writeFileSync(
  join(out, "dossier.json"),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  }),
);

console.log(
  `handed in ${appFiles.length} app files and ${shotFiles.length} screenshots to ${out}`,
);

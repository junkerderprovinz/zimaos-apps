/**
 * The store banner, in the layout of the GitHub style guide: the ZimaOS mark on the
 * left (largest ink 400px, ink-left x=165, centred on y=250), the name to its
 * right in Bree Serif at a cap height of 110, since the ZimaOS wordmark is part
 * of an image, and one Lato claim below it. Light and dark variants for the README's
 * <picture>; the single-colour mark takes the text colour of each.
 *
 * Text is rendered at the origin and placed with a transform, because
 * opentype.js emits NaN control points for some Lato glyphs at large offsets.
 * Deps (global): opentype.js, @resvg/resvg-js.
 * Run: node .github/assets/gen-banner.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";

const require = createRequire(import.meta.url);
const groot = execSync("npm root -g").toString().trim();
const opentype = require(`${groot}/opentype.js`);
const { Resvg } = require(`${groot}/@resvg/resvg-js`);
const DIR = dirname(fileURLToPath(import.meta.url));

const NAME = "ZimaOS";
const CLAIM = "Your Zima, better stocked.";

const MARK = {
  vb: "0 0 64 64",
  content: `<path fill-rule="evenodd" clip-rule="evenodd" fill="COLOR" d="M10.5312 25.0022V29.3543H30.6811V24.9974H18.3774L28.1888 15.1861C28.7256 14.654 29.4398 14.3569 30.1971 14.3569H30.6811V10H10.5312V14.3569H22.8589L13.0668 24.1538C12.5204 24.7002 11.7918 25.0022 11.0153 25.0022H10.5312ZM46.8221 34.6406H47.5362C47.3062 35.1679 47.3062 35.767 47.5362 36.2942L55.1763 53.9949H50.0334L44.6077 41.4228L39.182 53.9949H34.0391L41.6792 36.2942C41.9092 35.767 41.9092 35.1679 41.6792 34.6406H46.8221ZM29.0515 34.6367H26.0511V35.1879C26.0511 35.9452 25.706 36.6642 25.1164 37.1387L20.6062 40.7622L16.1007 37.1435C15.5112 36.669 15.1661 35.95 15.1661 35.1927V34.6415H10.5312V54.0006H15.1613V42.3343L16.9108 43.7339L20.611 46.7056L24.3064 43.7387L26.0559 42.3343V54.0006H30.6859V34.6415H29.0563L29.0515 34.6367ZM46.3269 15.6366V23.7176V23.7224C46.3269 24.4078 46.8829 24.959 47.5635 24.959H53.7225V29.3638H34.5312V24.959H40.6903C41.3757 24.959 41.9269 24.4031 41.9269 23.7224V15.6414C41.9269 14.956 41.3709 14.4048 40.6903 14.4048H34.5312V10H53.7225V14.4H47.5635C46.8781 14.4 46.3269 14.956 46.3269 15.6366Z"/>`,
};

const W = 1600, H = 500, LOGO_INK = 400, LOGO_X = 165, GAP_LOGO_TEXT = 70, GAP_NAME_CLAIM = 16, CLAIM_SIZE = 44;
const TARGET_CAP = 110;
const THEMES = [
  { suf: "", bg: "#ffffff", name: "#1f2328", claim: "#5a5d5e" },
  { suf: "-dark", bg: "#0d1117", name: "#e6edf3", claim: "#9aa4ad" },
];

async function font(file, url) {
  const p = join(tmpdir(), file);
  if (!existsSync(p)) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${file} ${r.status}`);
    writeFileSync(p, Buffer.from(await r.arrayBuffer()));
  }
  const b = readFileSync(p);
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
}
const bree = await font("jdp-BreeSerif-Regular.ttf", "https://github.com/google/fonts/raw/main/ofl/breeserif/BreeSerif-Regular.ttf");
const lato = await font("jdp-Lato-Regular.ttf", "https://github.com/google/fonts/raw/main/ofl/lato/Lato-Regular.ttf");
const bbox = (vb, content) =>
  new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${content}</svg>`, { fitTo: { mode: "original" } }).getBBox();

const mb = bbox(MARK.vb, MARK.content.replace(/COLOR/g, "#000"));
const sM = LOGO_INK / Math.max(mb.width, mb.height);
const markTX = LOGO_X - mb.x * sM, markTY = H / 2 - (mb.height * sM) / 2 - mb.y * sM;
const textX = LOGO_X + mb.width * sM + GAP_LOGO_TEXT;

const capRatio = bbox("0 0 600 400", `<path d="${bree.getPath("H", 0, 300, 200).toPathData(2)}"/>`).height / 200;
const nameSize = TARGET_CAP / capRatio;
const nb = bbox("0 0 2000 800", `<path d="${bree.getPath(NAME, 0, 500, nameSize).toPathData(2)}"/>`);
const nameH = nb.height;
const nameD = bree.getPath(NAME, 0, 0, nameSize).toPathData(2);

const claimScale = CLAIM_SIZE / lato.unitsPerEm;
const claimAsc = lato.ascender * claimScale, claimDesc = -lato.descender * claimScale;
const top = H / 2 - (nameH + GAP_NAME_CLAIM + claimAsc + claimDesc) / 2;
const claimBaseline = Math.round(top + nameH + GAP_NAME_CLAIM + claimAsc);
const claimD = lato.getPath(CLAIM, 0, 0, CLAIM_SIZE, { kerning: false }).toPathData(2);
if (claimD.includes("NaN")) throw new Error("claim path has NaN points");

for (const t of THEMES) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${NAME}: ${CLAIM}">
  <rect width="${W}" height="${H}" fill="${t.bg}"/>
  <g transform="translate(${markTX.toFixed(2)},${markTY.toFixed(2)}) scale(${sM.toFixed(5)})">${MARK.content.replace(/COLOR/g, t.name)}</g>
  <g transform="translate(${textX.toFixed(2)},${(top - (nb.y - 500)).toFixed(2)})"><path d="${nameD}" fill="${t.name}"/></g>
  <g transform="translate(${textX.toFixed(2)},${claimBaseline})"><path d="${claimD}" fill="${t.claim}"/></g>
</svg>
`;
  writeFileSync(join(DIR, `banner${t.suf}.svg`), svg);
  writeFileSync(join(DIR, `banner${t.suf}.png`), new Resvg(svg, { background: t.bg, fitTo: { mode: "original" } }).render().asPng());
}
console.log(`zimaos-apps banner: name at x ${textX.toFixed(0)}, right margin ${(W - textX - nb.width).toFixed(0)}`);

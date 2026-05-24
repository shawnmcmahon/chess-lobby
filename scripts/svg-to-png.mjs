import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const svgFile = process.argv[2];
const pngFile = process.argv[3];
if (!svgFile || !pngFile) {
  console.error("Usage: node scripts/svg-to-png.mjs <input.svg> <output.png>");
  process.exit(1);
}

const svgPath = path.resolve(root, svgFile);
const pngPath = path.resolve(root, pngFile);
const svg = readFileSync(svgPath, "utf8");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1040, height: 380 } });
await page.setContent(
  `<!doctype html><html><body style="margin:0;background:#f8fafc">${svg}</body></html>`,
);
await page.locator("svg").screenshot({ path: pngPath });
await browser.close();
console.log(`Wrote ${pngPath}`);

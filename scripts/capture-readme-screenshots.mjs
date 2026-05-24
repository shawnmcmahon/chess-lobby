/**
 * Capture 4 README screenshots per theme: landing, login, dashboard, game.
 *
 *   npm run screenshots:readme
 *   ONLY_THEMES=bento,brutal npm run screenshots:readme
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "docs", "screenshots");

const BASE_URL = (process.env.BASE_URL ?? "https://thechesslobby.com").replace(
  /\/$/,
  "",
);
const VIEWPORT = { width: 1440, height: 900 };

const THEMES = ["default", "bento", "brutal", "atelier"];

function uniqueEmail(themeId) {
  return `readme.${themeId}.${Date.now().toString(36)}@example.com`;
}

async function setTheme(page, themeId) {
  await page.addInitScript((id) => {
    localStorage.setItem("chess-lobby:theme", id);
  }, themeId);
}

async function goto(page, route) {
  await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);
}

async function shot(page, themeId, slug) {
  const dir = path.join(OUT_DIR, themeId);
  await mkdir(dir, { recursive: true });
  await page.screenshot({
    path: path.join(dir, `${slug}.png`),
    fullPage: true,
  });
  console.log(`  ${themeId}/${slug}`);
}

async function signUpAndCompleteProfile(page, themeId) {
  await goto(page, "/login");
  await page.getByRole("button", { name: /need an account|sign up/i }).click();
  await page.locator('input[name="email"]').fill(uniqueEmail(themeId));
  await page.locator('input[type="password"]').first().fill("ReadmeScreenshot1!");
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(
    (url) => !url.pathname.startsWith("/login"),
    { timeout: 90_000 },
  );

  await goto(page, "/profile/setup");
  const nameInput = page.locator("form input").first();
  if (await nameInput.isVisible().catch(() => false)) {
    await nameInput.fill(`Player ${themeId}`);
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL((url) => url.pathname === "/dashboard", {
      timeout: 90_000,
    });
  }
}

async function waitForDashboard(page) {
  await goto(page, "/dashboard");
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (
      (await page.getByRole("button", { name: "5+0", exact: true }).count()) > 0
    ) {
      return;
    }
    if (page.url().includes("/login")) {
      throw new Error("Lost session on dashboard");
    }
    await page.waitForTimeout(400);
  }
  throw new Error(`Dashboard did not load (${page.url()})`);
}

async function startComputerGame(page) {
  await waitForDashboard(page);
  for (const pattern of [/vs computer/i, /^engine$/i, /machine/i, /^cpu$/i]) {
    const tab = page.getByRole("button", { name: pattern });
    if ((await tab.count()) > 0) {
      await tab.first().click();
      break;
    }
  }
  await page.getByRole("button", { name: "5+0", exact: true }).click();
  await page.waitForURL(/\/game\/[^/]+$/, { timeout: 90_000 });
  await page.waitForTimeout(1000);
}

async function captureTheme(browser, themeId) {
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();
  await setTheme(page, themeId);

  await goto(page, "/");
  await shot(page, themeId, "landing");

  await goto(page, "/login");
  await shot(page, themeId, "login");

  await signUpAndCompleteProfile(page, themeId);
  await waitForDashboard(page);
  await shot(page, themeId, "dashboard");

  await startComputerGame(page);
  await shot(page, themeId, "game");

  await context.close();
}

async function main() {
  const only = (process.env.ONLY_THEMES ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const themes = only.length > 0 ? only : THEMES;

  console.log(`Capturing from ${BASE_URL} → docs/screenshots/`);
  const browser = await chromium.launch();

  for (const themeId of themes) {
    console.log(`\n${themeId}`);
    await captureTheme(browser, themeId);
  }

  await browser.close();
  await writeFile(
    path.join(OUT_DIR, "manifest.json"),
    JSON.stringify(
      { capturedAt: new Date().toISOString(), baseUrl: BASE_URL, themes },
      null,
      2,
    ),
  );
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

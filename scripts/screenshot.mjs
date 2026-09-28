// Dev helper: screenshot pages for visual review.
// Usage: node scripts/screenshot.mjs <outDir> <theme: light|dark> [role] path1 path2 ...
import { chromium } from "@playwright/test";

const [, , outDir, theme = "light", role = "", ...paths] = process.argv;
const base = process.env.BASE_URL || "http://localhost:3000";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: theme === "dark" ? "dark" : "light" });
if (role) await ctx.addCookies([{ name: "dg_demo_role", value: role, url: base }]);
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
for (const p of paths) {
  await page.goto(base + p, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForTimeout(1500);
  const name = (p.replace(/[/?=&]+/g, "_") || "_root") + `-${theme}${role ? "-" + role : ""}.png`;
  await page.screenshot({ path: `${outDir}/${name}`, fullPage: process.env.FULL === "1" });
  console.log("shot", name);
}
if (errors.length) console.log("ERRORS:\n" + [...new Set(errors)].join("\n"));
await browser.close();

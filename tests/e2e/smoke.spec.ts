import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function axe(page: Page) {
  // let entrance animations (opacity fades) finish so contrast is measured on the final state
  await page.waitForTimeout(1800);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious.map((v) => `${v.id}: ${v.nodes.length} node(s) — ${v.help} — ${v.nodes[0]?.target.join(" ")}`)).toEqual([]);
}

test.describe("public pages", () => {
  test("landing @mobile", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("polar science");
    await expect(page.getByRole("link", { name: /Enter portal/i }).first()).toBeVisible();
    await axe(page);
  });

  test("portal home @mobile", async ({ page }) => {
    await page.goto("/portal");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await axe(page);
  });

  test("explore search finds the sample field log", async ({ page }) => {
    await page.goto("/explore?q=weather%20stations");
    await expect(page.getByRole("link", { name: /45-ISEA Summer Field Log/ })).toBeVisible();
    await axe(page);
  });

  test("expedition Story Mode", async ({ page }) => {
    await page.goto("/expeditions/45-ISEA");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("45th Indian Scientific Expedition");
    await expect(page.getByRole("tab", { name: /Reports/ })).toBeVisible();
    await axe(page);
  });

  test("published story shows provenance", async ({ page }) => {
    await page.goto("/stories/inside-a-sample-antarctic-field-log");
    await expect(page.getByText(/Source-cited · Reviewed by/)).toBeVisible();
    await axe(page);
  });

  test("login", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /Sign in/ })).toBeVisible();
    await axe(page);
  });

  test("internal and embargoed items stay hidden from the public", async ({ page }) => {
    const internal = await page.goto("/items/00000000-0000-4000-a000-000000000105");
    expect(internal?.status()).toBe(404);
    const embargoed = await page.goto("/items/00000000-0000-4000-a000-000000000106");
    expect(embargoed?.status()).toBe(404);
  });

  test("staff pages redirect visitors to login", async ({ page }) => {
    await page.goto("/studio/review");
    await expect(page).toHaveURL(/\/login\?next=/);
  });
});

test("command palette opens and finds items", async ({ page }) => {
  await page.goto("/portal");
  await page.getByRole("button", { name: /Search pages, items/ }).click();
  await page.getByRole("combobox").fill("glacier");
  await expect(page.getByRole("option", { name: /Glacier Mass-Balance Field Notes/ })).toBeVisible();
});

test.describe("staff flow (demo personas)", () => {
  test("curator generates, trust panel flags the wrong number, fix turns it green", async ({ page, context }) => {
    await context.addCookies([{ name: "dg_demo_role", value: "curator", url: "http://localhost:3000" }]);
    await page.goto("/studio/content?items=00000000-0000-4000-a000-000000000101");
    await page.getByRole("button", { name: "X", exact: true }).click();
    await page.getByRole("button", { name: "Website article" }).click(); // deselect default
    await page.getByRole("button", { name: "Instagram" }).click(); // deselect default
    await page.getByRole("button", { name: /Generate drafts/ }).click();
    await expect(page.getByText(/Numbers not in source: 8/)).toBeVisible();
    await expect(page.getByText(/Approval blocked/)).toBeVisible();
    await page.getByRole("button", { name: "Edit", exact: true }).first().click();
    await page.getByRole("textbox").last().fill("Sample field log: the team serviced 6 automatic weather stations along the coastal traverse [c2].");
    await page.getByRole("button", { name: "Re-check", exact: true }).first().click();
    await expect(page.getByText(/All claims pass/)).toBeVisible();
    await axe(page);
  });

  test("reviewer can publish an approved article", async ({ page, context }) => {
    await context.addCookies([{ name: "dg_demo_role", value: "reviewer", url: "http://localhost:3000" }]);
    await page.goto("/studio/review?status=approved");
    await expect(page.getByRole("heading", { name: "Review Queue" })).toBeVisible();
    await axe(page);
  });
});

test.describe("dark mode", () => {
  test.use({ colorScheme: "dark" });
  test("landing and item page pass axe in dark mode @mobile", async ({ page }) => {
    await page.goto("/");
    await axe(page);
    await page.goto("/items/00000000-0000-4000-a000-000000000111");
    await expect(page.getByText("Data Quick-Look")).toBeVisible();
    await axe(page);
  });
});

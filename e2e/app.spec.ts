import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("loads and shows EnergiaNostra branding", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toContainText("EnergiaNostra");
  });

  test("has navigation links", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('a[href="/login"]')).toBeVisible();
  });
});

test.describe("Login Flow", () => {
  test("shows login form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("rejects invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "invalid@test.com");
    await page.fill('input[type="password"]', "wrong");
    await page.click('button[type="submit"]');
    await expect(page.locator("body")).toContainText(/error|errore|credenziali/i);
  });
});

test.describe("Dashboard", () => {
  test("loads dashboard page", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("body")).toContainText(/panoramica|dashboard/i);
  });
});

test.describe("API Routes", () => {
  test("GET /api/health returns healthy status", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe("healthy");
  });

  test("GET /api/members returns member list", async ({ request }) => {
    const res = await request.get("/api/members");
    expect(res.ok()).toBeTruthy();
    const members = await res.json();
    expect(Array.isArray(members)).toBeTruthy();
    expect(members.length).toBeGreaterThan(0);
  });

  test("GET /api/energy returns energy data", async ({ request }) => {
    const res = await request.get("/api/energy");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.cer).toBeDefined();
    expect(body.months).toBeDefined();
  });

  test("GET /api/forecasting returns forecast data", async ({ request }) => {
    const res = await request.get("/api/forecasting");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.production).toBeDefined();
    expect(body.summary).toBeDefined();
  });

  test("GET /api/gamification returns gamification data", async ({ request }) => {
    const res = await request.get("/api/gamification");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.summary).toBeDefined();
    expect(body.leaderboard).toBeDefined();
  });

  test("GET /api/carbon-credits returns carbon data", async ({ request }) => {
    const res = await request.get("/api/carbon-credits");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.totalCo2Avoided).toBeDefined();
  });

  test("GET /api/i18n returns translations", async ({ request }) => {
    const res = await request.get("/api/i18n?locale=it");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.locale).toBe("it");
    expect(body.translations).toBeDefined();
  });

  test("GET /api/i18n?locale=es returns Spanish", async ({ request }) => {
    const res = await request.get("/api/i18n?locale=es");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.locale).toBe("es");
  });
});

import { test, expect } from "@playwright/test";
import { installTauriMock } from "./mocks/tauri";

test.describe("Sysper Desktop E2E and Visual Workflows", () => {
  test.beforeEach(async ({ page }) => {
    await installTauriMock(page);
  });

  test("renders initial welcome view with branding and scan action", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Emiote Sysper" })
    ).toBeVisible();
    await expect(
      page.getByText("System Sweeper · 100% offline · Trash only")
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Select Folder & Scan" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Find the dust eating your memory" })
    ).toBeVisible();

    await page.screenshot({ path: "test-results/screenshots/welcome.png" });
  });

  test("supports tab navigation and dark mode toggle", async ({ page }) => {
    await page.goto("/");

    // Navigate to Settings
    await page.getByRole("button", { name: "Settings" }).click();
    await expect(
      page.getByRole("heading", { name: "Appearance" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Whitelist" })
    ).toBeVisible();

    // Toggle dark mode
    const themeBtn = page.getByRole("button", { name: /switch to/i });
    await expect(themeBtn).toBeVisible();
    await themeBtn.click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.screenshot({
      path: "test-results/screenshots/settings-dark.png",
    });

    // Navigate to History
    await page.getByRole("button", { name: "History" }).click();
    await expect(page.getByText("No cleans yet.")).toBeVisible();
    await expect(
      page.getByText(/Your last 10 cleans appear here/i)
    ).toBeVisible();
    await page.screenshot({
      path: "test-results/screenshots/history-empty.png",
    });

    // Navigate back to Cleaner
    await page.getByRole("button", { name: "Cleaner" }).click();
    await expect(
      page.getByRole("button", { name: "Select Folder & Scan" })
    ).toBeVisible();
  });

  test("runs folder scan and renders categorized results list", async ({
    page,
  }) => {
    await page.goto("/");

    // Trigger scan
    await page.getByRole("button", { name: "Select Folder & Scan" }).click();

    // Results screen verification
    await expect(page.getByText("/mock/workspace")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Clean to Trash" })
    ).toBeVisible();

    // Verify junk category cards exist
    await expect(page.getByText("node_modules").first()).toBeVisible();
    await expect(page.getByText("target").first()).toBeVisible();
    await expect(page.getByText("dist").first()).toBeVisible();
    await expect(page.getByText("Quick wins")).toBeVisible();

    await page.screenshot({
      path: "test-results/screenshots/results-list.png",
    });
  });

  test("allows inspecting items via file manager action", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Select Folder & Scan" }).click();

    // Expand first group to view individual items
    await page.getByRole("button", { name: "Show paths" }).first().click();

    // Verify reveal button is rendered and clickable
    const revealBtn = page
      .getByRole("button", { name: /Show .* in file manager/i })
      .first();
    await expect(revealBtn).toBeVisible();
    await revealBtn.click();
  });

  test("filters results via live search and handles empty state", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Select Folder & Scan" }).click();

    const searchInput = page.getByPlaceholder(
      "Filter by folder name, project, or type..."
    );
    await expect(searchInput).toBeVisible();

    // Filter by project-alpha
    await searchInput.fill("alpha");
    await expect(page.getByText("Showing 2 of 5 items")).toBeVisible();
    await page.screenshot({
      path: "test-results/screenshots/search-filtered.png",
    });

    // Clear via search clear icon
    await page.getByLabel("Clear filter").click();
    await expect(searchInput).toHaveValue("");

    // Query with no matches
    await searchInput.fill("nonexistent-folder");
    await expect(
      page.getByText('No items match "nonexistent-folder"')
    ).toBeVisible();
    await page.screenshot({
      path: "test-results/screenshots/search-empty.png",
    });

    // Reset filter using the empty state button
    await page.getByText("Clear filter").click();
    await expect(page.getByText("target").first()).toBeVisible();
  });

  test("executes clean confirmation flow to success page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Select Folder & Scan" }).click();

    // Click Clean to Trash
    await page.getByRole("button", { name: "Clean to Trash" }).click();

    // Verify confirmation modal
    await expect(page.getByText("Move to Trash?")).toBeVisible();
    await expect(page.getByText("You can restore from Trash")).toBeVisible();
    await page.screenshot({
      path: "test-results/screenshots/confirm-modal.png",
    });

    // Confirm clean in modal
    await page.getByRole("button", { name: "Move to Trash" }).click();

    // Verify success page
    await expect(page.getByRole("heading", { name: /Freed/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Scan Again" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "View History" })
    ).toBeVisible();
    await page.screenshot({
      path: "test-results/screenshots/success-page.png",
    });

    // Click Scan Again returns to idle state
    await page.getByRole("button", { name: "Scan Again" }).click();
    await expect(
      page.getByRole("button", { name: "Select Folder & Scan" })
    ).toBeVisible();
  });
});

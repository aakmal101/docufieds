import { test, expect } from '@playwright/test';

test.describe('Individual Dashboard - New Application', () => {
    test('should navigate to module selection without crashing', async ({ page }) => {
        // 1. Login as Individual
        await page.goto('/auth/signin');
        // (Assuming mock login or seeding)
        // For this test structure, we assume authenticated state

        // 2. Go to Dashboard
        await page.goto('/dashboard/individual');

        // 3. Click "New Application"
        // Expectation: Routes to /apply/module
        await page.click('text=New Application');
        await expect(page).toHaveURL(/\/apply\/module/);

        // 4. Verification: Check if Module Page loads
        await expect(page.locator('text=Select Application Type')).toBeVisible();
        await expect(page.locator('text=Personal / Tourism')).toBeVisible();

        // 5. Select Module and Proceed
        await page.click('text=Personal / Tourism');
        // Should navigate to application form /dashboard/individual/new-application?module=PERSONAL or similar
        // OR /apply/module -> /apply/country ... depending on flow

        // In our implementation, /apply/module redirects to /dashboard/individual/new-application?module=...
        // Let's verify we don't see "Application Form Error"
        await expect(page.locator('text=Application Form Error')).not.toBeVisible();
    });
});

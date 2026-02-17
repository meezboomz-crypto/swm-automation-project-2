import { test, expect } from '../../pages/base';
import { getUsernameAndPassword } from '../../utils/index';

test.describe('UI Dashboard', () => {
    const { admins } = getUsernameAndPassword();

    test.beforeEach(async ({ page, loginPage }) => {
        await page.goto('/');

        await expect(page).toHaveTitle(/SWM System/);
        await expect(loginPage.pageHeading).toHaveText(/SWM System/);

        await loginPage.fillUsernameAndPassword(admins[0].username, admins[0].password);
        await loginPage.login();
    });

    test('should display dashboard heading and logout button', async ({ dashboardPage }) => {
        await expect(dashboardPage.pageHeading).toHaveText(/ภาพรวมกิจการ/);
        await expect(dashboardPage.logoutBtn).toBeVisible();
    });

    test('should logout successfully', async ({ dashboardPage }) => {
        await dashboardPage.logout();
    });
});
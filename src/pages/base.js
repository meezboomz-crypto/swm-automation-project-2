import { test as base } from '@playwright/test';
import { createLoginPage } from './login.page';
import { createDashboardPage } from './dashboard.page';

export const test = base.extend({
    loginPage: async ({ page }, use) => {
        const loginPageInstance = createLoginPage(page);
        await use(loginPageInstance);
    },
    dashboardPage: async ({ page }, use) => {
        const dashboardPageInstance = createDashboardPage(page);
        await use(dashboardPageInstance);
    },
});

export { expect } from '@playwright/test'
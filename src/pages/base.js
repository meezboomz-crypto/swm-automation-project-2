import { test as base } from '@playwright/test';
import { createLoginPage } from './login.page';
import { createDashboardPage } from './dashboard.page';
import { createJobPage } from './job.page';

export const test = base.extend({
    loginPage: async ({ page }, use) => {
        const loginPageInstance = createLoginPage(page);
        await use(loginPageInstance);
    },
    dashboardPage: async ({ page }, use) => {
        const dashboardPageInstance = createDashboardPage(page);
        await use(dashboardPageInstance);
    },
    jobPage: async ({ page }, use) => {
        const jobPageInstance = createJobPage(page);
        await use(jobPageInstance);
    },
});

export { expect } from '@playwright/test'
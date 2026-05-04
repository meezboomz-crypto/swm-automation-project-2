import { test as base } from '@playwright/test';
// pages
import { createLoginPage } from './pages/login.page';
import { createDashboardPage } from './pages/dashboard.page';
import { createJobPage } from './pages/job.page';
// requests
import { createLoginReq } from './requests/login.req';
import { createJobReq } from './requests/job.req';

export const test = base.extend({
    // pages
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
    // requests
    loginReq: async ({ request }, use) => {
        const loginReqInstance = createLoginReq(request);
        await use(loginReqInstance);
    },
    jobReq: async ({ request }, use) => {
        const token = process.env.ACCESS_TOKEN;

        const jobReqInstance = createJobReq(request, token);
        await use(jobReqInstance);
    },
});

export { expect } from '@playwright/test'
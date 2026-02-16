import { test as base } from '@playwright/test';
import { createLoginPage } from './login.page';

export const test = base.extend({
    loginPage: async ({ page }, use) => {
        const loginPageInstance = createLoginPage(page);
        await use(loginPageInstance);
    },
});

export { expect } from '@playwright/test'
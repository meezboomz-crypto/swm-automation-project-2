import { test as base } from '@playwright/test';
import { createLoginReq } from './login.req';

export const test = base.extend({
    loginReq: async ({ request }, use) => {
        const loginReqInstance = createLoginReq(request);
        await use(loginReqInstance);
    },
});

export { expect } from '@playwright/test'
export { request } from '@playwright/test'
import { test as base } from '@playwright/test';
import { createLoginReq } from './login.req';
import { createJobReq } from './job.req';  

export const test = base.extend({
    loginReq: async ({ request }, use) => {
        const loginReqInstance = createLoginReq(request);
        await use(loginReqInstance);
    },
    jobReq: async ({ request }, use) => {
        const jobReqInstance = createJobReq(request);
        await use(jobReqInstance);
    },
});

export { expect } from '@playwright/test'
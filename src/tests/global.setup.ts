import { test as setup, expect } from '@playwright/test'
import path from 'node:path';

const adminFile = path.join(__dirname, '../.auth/admin.json');
const generalFile = path.join(__dirname, '../.auth/general.json');

setup('authenticate as admin', async ({ request }) => {
    const response = await request.post('/api/login', {
        data: { username: 'admin1', password: '1234' }
    });

    await expect(response.ok()).toBeTruthy();

    await request.storageState({ path: adminFile });
});

setup('authenticate as general', async ({ request }) => {
    const response = await request.post('/api/login', {
        data: { username: 'user1', password: '1234' }
    });

    await expect(response.ok()).toBeTruthy();

    await request.storageState({ path: generalFile });
});


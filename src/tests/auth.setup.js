import { test as setup } from '@playwright/test';
import { getUsernameAndPassword } from '../utils';

const authFile = 'playwrtight/.auth/user.json';

setup('authenticate', async ({ request }) => {
    const { admins, generals } = getUsernameAndPassword();

    const response = await request.post('/api/login', {
        data: {
            username: admins[0].username,
            password: admins[0].password,
        }
    });

    // เพิ่มตรงนี้เพื่อความชัวร์: ถ้า Login ไม่ผ่าน ให้หยุดรันเทสทั้งหมดทันที
    if (!response.ok()) {
        throw new Error('Login failed! Check your credentials.');
    }

    const body = await response.json();
    process.env.ACCESS_TOKEN = body.accessToken;

    await request.storageState({ path: authFile });
});

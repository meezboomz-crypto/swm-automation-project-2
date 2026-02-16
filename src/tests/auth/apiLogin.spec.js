import { test, expect, request } from '../../requests/base'
import { getUsernameAndPassword } from '../../utils'

test.describe('Login on API tests', () => {
    const { admins, generals } = getUsernameAndPassword();

    test.describe('Admins', () => {
        for (const admin of admins) {
            test(`Login with valid credentials by username: ${admin.username}.`, async ({ loginReq }) => {
                const { response, body } = await loginReq.login(admin.username, admin.password);

                expect(response.ok()).toBeTruthy();
                expect(body.role).toBe('admin');
            });
        };
    });

    test.describe('Genarals', () => {
        for (const general of generals) {
            test(`Login with valid credentials by username: ${general.username}.`, async ({ loginReq }) => {
                const { response, body } = await loginReq.login(general.username, general.password);

                expect(response.ok()).toBeTruthy();
                expect(body.role).toBe('general');
            });
        };
    });

    test.describe.only('Negatives', () => {
        test('Login with an existing username but invalid password.', async ({ loginReq }) => {
            const { response, body } = await loginReq.login(admins[0].username, 'invalid password');

            expect(response.status()).toBe(401);
            expect(body.error).toBe('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        });

        test('Login with a non-existent username.', async ({ loginReq }) => {
            const { response, body } = await loginReq.login('non-existent', admins.password);

            expect(response.status()).toBe(401);
            expect(body.error).toBe('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        });

        test('Login with an empty field.', async ({ loginReq }) => {
            const { response, body } = await loginReq.login('', '');

            expect(response.status()).toBe(401);
            expect(body.error).toBe('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        });

        test('Login with invalid data type.', async ({ loginReq }) => {
            const { response } = await loginReq.login(['admin1'], { password: '1234' });

            expect(response.status()).toBe(400);
        });

        test('SQL Injection attempt on username field', async ({ loginReq }) => {
            const { response, body } = await loginReq.login("' OR '1'='1", "anything");

            expect(response.status()).toBe(401);
            expect(body.error).toBe('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        });

        test('Login with wrong case username', async ({ loginReq }) => {
            const admin = admins[0];
            const uppercaseUsername = admin.username.toUpperCase();

            if (admin.username !== uppercaseUsername) {
                const { response, body } = await loginReq.login(uppercaseUsername, admin.password);

                expect(response.status()).toBe(401);
                expect(body.error).toBe('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
            };
        });

        test('Login with wrong Content-Type header', async ({ request }) => {
            const response = await request.post('/api/login', {
                data: 'username=admin1&password=1234',
                headers: { 'Content-Type': 'text/plain' }
            });

            expect(response.status()).toBeGreaterThanOrEqual(400);
        });
    });
});



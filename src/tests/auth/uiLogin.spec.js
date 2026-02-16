import { test, expect } from '../../pages/base'
import { getUsernameAndPassword } from '../../utils'

test.describe('Login on UI tests', () => {
    test.beforeEach(async ({ page, loginPage }) => {
        await page.goto('/');

        await expect(page).toHaveTitle(/SWM System/);
        await expect(loginPage.pageHeading).toHaveText(/SWM System/);
    });

    const { admins, generals } = getUsernameAndPassword();

    test.describe('Admins', () => {
        for (const admin of admins) {
            test(`Login with valid credentials by username: ${admin.username}.`, async ({ loginPage }) => {
                await loginPage.fillUsernameAndPassword(admin.username, admin.password);
                await loginPage.login();
            });
        };
    });

    test.describe('Generals', () => {
        for (const general of generals) {
            test(`Login with valid credentials by username: ${general.username}.`, async ({ loginPage }) => {
                await loginPage.fillUsernameAndPassword(general.username, general.password);
                await loginPage.login();
            });
        };
    });

    test.describe('Negatives', () => {
        test('Login with an existing username but invalid password.', async ({ loginPage }) => {
            await loginPage.fillUsernameAndPassword(generals[0].username, 'invalid password');
            await loginPage.login();

            await expect(loginPage.errorBox).toHaveText(/ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง/);
        });

        test('Login with a non-existent username.', async ({ loginPage }) => {
            await loginPage.fillUsernameAndPassword('non-existent', 'invalid password');
            await loginPage.login();

            await expect(loginPage.errorBox).toHaveText(/ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง/);

        });

        test('Login with an empty field.', async ({ loginPage }) => {
            await loginPage.fillUsernameAndPassword('', '');
            await loginPage.login();

            await expect(loginPage.errorBox).toHaveText(/กรุณากรอกชื่อผู้ใช้และรหัสผ่าน/);
        });
    });
});
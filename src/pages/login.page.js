/**
* @param {import('@playwright/test').Page} page 
*/

export const createLoginPage = (page) => ({
    pageHeading: page.getByRole('heading', { name: 'SWM System' }),
    usernameInput: page.getByRole('textbox', { name: 'Username' }),
    passwordInput: page.getByRole('textbox', { name: '••••••••' }),
    loginBtn: page.getByRole('button', { name: 'เข้าสู่ระบบ' }),
    errorBox: page.locator('div.bg-red-50'),

    async fillUsernameAndPassword(username, password) {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
    },

    async login() {
        await this.loginBtn.click();
    },

    async getErrorMessage() {
        return await this.errorBox.textContent();
    },

});
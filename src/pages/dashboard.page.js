/**
 * @param {import('@playwright/test').Page} page
 */

export const createDashboardPage = (page) => ({
    pageHeading: page.getByRole('heading', { name: 'ภาพรวมกิจการ' }),
    logoutBtn: page.getByRole('button', { name: ' ออกจากระบบ ' }),

    async logout() {
        await this.logoutBtn.click();
    },
});
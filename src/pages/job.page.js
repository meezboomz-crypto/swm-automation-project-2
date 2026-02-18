/**
 * @param {import('@playwright/test').Page} page
 */

export const createJobPage = (page) => ({
    createNewJobBtn: page.getByRole('button', { name: 'สร้างงานใหม่' }),
    pageHeading: page.getByRole('heading').first(),
    customerNameInput: page.getByRole('textbox', { name: /ชื่อลูกค้า/ }),
    jobTypeSelect: page.getByRole('combobox'),
    descriptionInput: page.getByRole('textbox', { name: /รายละเอียด/ }),
    priceInput: page.locator('input[type="number"]'),
    addDescriptionBtn: page.getByRole('button', { name: /เพิ่มรายการใหม่/ }),
    removeDescriptionBtn: page.locator('button[title="ลบรายการ"]'),
    notesInput: page.getByRole('textbox').last(),
    submitBtn: page.getByRole('button', { name: /บันทึก/ }),
    cancelBtn: page.getByRole('button', { name: /ยกเลิก/ }),

    jobListBtn: page.getByRole('button', { name: /รายการงานทั้งหมด/ }),
    updateStatusBtn: page.locator('button[title="กำลังทำ"]'),
    updateJobBtn: page.locator('button[title="แก้ไข"]'),

    async fillJobForm(jobData) {
        await this.customerNameInput.fill(jobData.customerName);
        await this.jobTypeSelect.selectOption(jobData.jobType);

        const isUpdate = await this.descriptionInput.count() > 1;
        if (isUpdate) {
            const existedCount = await this.removeDescriptionBtn.count();
            for (let i = 0; i < existedCount - 1; i++) {
                await this.removeDescriptionBtn.last().click();
            };
        };
        for (const [index, item] of jobData.items.entries()) {
            if (jobData.items.length > index + 1) {
                await this.addDescriptionBtn.click();
            };
            await this.descriptionInput.nth(index).fill(item.description);
            await this.priceInput.nth(index).fill(item.price.toString());
        };
        await this.notesInput.fill(jobData.notes || '');
    },

    async submitJob() {
        await this.submitBtn.click();
    },

    async cancelJob() {
        await this.cancelBtn.click();
    },
});
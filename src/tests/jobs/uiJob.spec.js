import { test, expect } from '../../pages/base';
import { getUsernameAndPassword } from '../../utils';

test.describe('UI Job Creation', () => {
    const { admins, generals } = getUsernameAndPassword();

    test.describe('Admin', () => {
        test.beforeEach(async ({ page, loginPage }) => {
            await page.goto('/');
            await loginPage.fillUsernameAndPassword(admins[0].username, admins[0].password);
            await loginPage.login();
        });

        test('should create a new job with valid data', async ({ jobPage }) => {
            const jobData = {
                id: Date.now().toString(), // Use timestamp as a unique ID for testing
                customerName: 'Test Job Created',
                jobType: 'General',
                status: 'Pending',
                notes: 'This is an created test job.',
                items: [
                    { description: 'Item 1', price: 200 },
                    { description: 'Item 2', price: 400 },
                    { description: 'Item 3', price: 600 },
                ],
                createdAt: new Date().toISOString(),
            };
            await jobPage.createNewJobBtn.click();
            await expect(jobPage.pageHeading).toHaveText(/สร้างงานใหม่/);

            await jobPage.fillJobForm(jobData);
            await jobPage.submitJob();
        });

        test('should update a job with valid data', async ({ jobPage }) => {
            const jobData = {
                id: Date.now().toString(), // Use timestamp as a unique ID for testing
                customerName: 'Test Job Updated',
                jobType: 'General',
                status: 'In Progress',
                notes: 'This is an updated test job.',
                items: [
                    { description: 'Item 1', price: 400 },
                    { description: 'Item 2', price: 600 },
                    { description: 'Item 3', price: 800 },
                ],
                createdAt: new Date().toISOString(),
            };
            await jobPage.jobListBtn.click();
            await jobPage.updateJobBtn.first().click();
            await expect(jobPage.pageHeading).toHaveText(/แก้ไขข้อมูลงาน/);

            await jobPage.fillJobForm(jobData);
            await jobPage.submitJob();
        });

        test.describe('Negative cases', () => {
            test('should show validation error when creating a job with empty customer name', async ({ jobPage }) => {
                const jobData = {
                    customerName: '',
                    jobType: 'General',
                    status: 'Pending',
                    notes: 'This is an invalid test job.',
                    items: [
                        { description: 'Item 1', price: 200 },
                    ],
                };
                await jobPage.createNewJobBtn.click();
                await expect(jobPage.pageHeading).toHaveText(/สร้างงานใหม่/);

                await jobPage.fillJobForm(jobData);
                await jobPage.submitJob();

                await expect(jobPage.customerNameInput).toHaveClass(/bg-red-50/);
                await jobPage.cancelJob();
            });

            test('should show validation error when creating a job with empty description', async ({ jobPage }) => {
                const jobData = {
                    customerName: 'Test Job Invalid',
                    jobType: 'General',
                    status: 'Pending',
                    notes: 'This is an invalid test job.',
                    items: [
                        { description: '', price: 200 },
                    ],
                };
                await jobPage.createNewJobBtn.click();
                await expect(jobPage.pageHeading).toHaveText(/สร้างงานใหม่/);

                await jobPage.fillJobForm(jobData);
                await jobPage.submitJob();

                await expect(jobPage.descriptionInput).toHaveClass(/placeholder-red-300/);
                await jobPage.cancelJob();
            });

            test('should show validation error when creating a job with negative price', async ({ jobPage }) => {
                const jobData = {
                    customerName: 'Test Job Invalid',
                    jobType: 'General',
                    status: 'Pending',
                    notes: 'This is an invalid test job.',
                    items: [
                        { description: 'Item 1', price: -100 },
                    ],
                };
                await jobPage.createNewJobBtn.click();
                await expect(jobPage.pageHeading).toHaveText(/สร้างงานใหม่/);

                await jobPage.fillJobForm(jobData);
                await jobPage.submitJob();

                const isInvalid = await jobPage.priceInput.evaluate(node => node.validity.rangeUnderflow);
                expect(isInvalid).toBe(true); // ถ้าเป็น true แปลว่าค่าต่ำกว่าที่กำหนด (min="0")
                await jobPage.cancelJob();
            });
        });
    });

    test.describe('General', () => {
        test.beforeEach(async ({ page, loginPage }) => {
            await page.goto('/');
            await loginPage.fillUsernameAndPassword(generals[0].username, generals[0].password);
            await loginPage.login();
        });

        test('should create a new job with valid data', async ({ jobPage }) => {
            const jobData = {
                id: Date.now().toString(), // Use timestamp as a unique ID for testing
                customerName: 'Test Job Created',
                jobType: 'General',
                status: 'Pending',
                notes: 'This is an created test job.',
                items: [
                    { description: 'Item 1', price: 200 },
                    { description: 'Item 2', price: 400 },
                    { description: 'Item 3', price: 600 },
                ],
                createdAt: new Date().toISOString(),
            };
            await jobPage.createNewJobBtn.click();
            await expect(jobPage.pageHeading).toHaveText(/สร้างงานใหม่/);

            await jobPage.fillJobForm(jobData);
            await jobPage.submitJob();
        });
    });
});
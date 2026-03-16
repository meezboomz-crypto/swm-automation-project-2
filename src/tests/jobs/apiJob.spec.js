import { test, expect } from '../../requests/base';
import { getUsernameAndPassword } from '../../utils';

test.describe.serial('Job API tests', () => {
    const { admins, generals } = getUsernameAndPassword();

    let jobId;

    test.describe('Admin', () => {
        let token;
        test.beforeEach(async ({ loginReq }) => {
            // First, log in to get the token
            const { response, body } = await loginReq.login(admins[0].username, admins[0].password);

            expect(response.ok()).toBeTruthy();

            token = body.accessToken;

            expect(token).toBeDefined();
        });

        test('Create a job with valid data', async ({ jobReq }) => {
            const startTime = Date.now();

            // Then, create a job using the token
            const jobData = {
                id: Date.now().toString(), // Use timestamp as a unique ID for testing
                customerName: 'Test Job',
                jobType: 'General',
                status: 'Pending',
                notes: 'This is a test job.',
                items: [
                    { description: 'Item 1', price: 100 },
                    { description: 'Item 2', price: 200 },
                ],
                createdAt: new Date().toISOString(),
            };

            const { response, body } = await jobReq.createJob(jobData, token);

            expect(response.ok()).toBeTruthy();

            const duration = Date.now() - startTime;

            expect(duration).toBeLessThan(500);
            expect(body).toHaveProperty('id')
        });

        test.beforeEach(async ({ jobReq }) => {
            const { response, body } = await jobReq.getJobs(token);

            expect(response.ok()).toBeTruthy();
            jobId = body[0]?.id; // Get the ID of the first job for update/delete tests
        });

        test('Update a job with valid data', async ({ jobReq }) => {
            const startTime = Date.now();

            const jobData = {
                customerName: 'Test Job Updated',
                jobType: 'General',
                status: 'Pending',
                notes: 'This is an updated test job.',
                items: [
                    { description: 'Item 1', price: 200 },
                    { description: 'Item 2', price: 400 },
                ],
                createdAt: new Date().toISOString(),
            };

            const { response, body } = await jobReq.updateJob(jobId, jobData, token);

            expect(response.ok()).toBeTruthy();

            const duration = Date.now() - startTime;

            expect(duration).toBeLessThan(500);
            expect(body).toHaveProperty('message', 'Job updated');
        });

        test('Update job status', async ({ jobReq }) => {
            const startTime = Date.now();

            const newStatus = 'In Progress';
            const { response, body } = await jobReq.updateJobStatus(jobId, newStatus, token);

            expect(response.ok()).toBeTruthy();

            const duration = Date.now() - startTime;

            expect(duration).toBeLessThan(500);
            expect(body).toHaveProperty('message', 'Status updated');
        });

        test('Delete a job', async ({ jobReq }) => {
            const startTime = Date.now();

            const { response, body } = await jobReq.deleteJob(jobId, token);

            expect(response.ok()).toBeTruthy();

            const duration = Date.now() - startTime;

            expect(duration).toBeLessThan(500);
            expect(body).toHaveProperty('message', 'Job cancelled (soft deleted)');
        });
    });

    test.describe('General User', () => {
        let token;
        test.beforeEach(async ({ loginReq }) => {
            const { response, body } = await loginReq.login(generals[0].username, generals[0].password);

            expect(response.ok()).toBeTruthy();
            token = body.accessToken;
        });

        test('Create a job with valid data', async ({ jobReq }) => {
            const startTime = Date.now();

            const jobData = {
                id: Date.now().toString(), // Use timestamp as a unique ID for testing
                customerName: 'Test Job',
                jobType: 'General',
                status: 'Pending',
                notes: 'This is a test job.',
                items: [
                    { description: 'Item 1', price: 100 },
                    { description: 'Item 2', price: 200 },
                ],
                createdAt: new Date().toISOString(),
            };
            const { response, body } = await jobReq.createJob(jobData, token);

            expect(response.ok()).toBeTruthy();

            const duration = Date.now() - startTime;

            expect(duration).toBeLessThan(500);
            expect(body).toHaveProperty('id');
        });

        test.describe('Negative Tests', () => {
            test('Create a job with missing fields', async ({ jobReq }) => {
                const startTime = Date.now();

                const jobData = {
                    id: Date.now().toString(), // Use timestamp as a unique ID for testing
                    jobType: 'General',
                    status: 'Pending',
                    notes: 'This is a test job.',
                    items: [
                        { description: 'Item 1', price: 100 },
                        { description: 'Item 2', price: 200 },
                    ],
                    createdAt: new Date().toISOString(),
                };
                const { response, body } = await jobReq.createJob(jobData, token);

                expect(response.status()).toBe(400);

                const duration = Date.now() - startTime;

                expect(duration).toBeLessThan(500);
                expect(body).toHaveProperty('error');
            });

            test.beforeEach(async ({ jobReq }) => {
                const { response, body } = await jobReq.getJobs(token);
                expect(response.ok()).toBeTruthy();
                jobId = body[0]?.id; // Get the ID of the first job for update/delete tests
            });

            test('Update a job with non-authorized user', async ({ jobReq }) => {
                const startTime = Date.now();

                const jobData = {
                    id: Date.now().toString(), // Use timestamp as a unique ID for testing
                    customerName: 'Test Job Updated',
                    jobType: 'General',
                    status: 'Pending',
                    notes: 'This is an updated test job.',
                    items: [
                        { description: 'Item 1', price: 200 },
                        { description: 'Item 2', price: 400 },
                    ],
                    createdAt: new Date().toISOString(),
                };
                const { response, body } = await jobReq.updateJob(jobId, jobData, token);

                expect(response.status()).toBe(403);

                const duration = Date.now() - startTime;

                expect(duration).toBeLessThan(500);
                expect(body).toHaveProperty('error');
            });

            test('Update job status with non-authorized user', async ({ jobReq }) => {
                const startTime = Date.now();

                const newStatus = 'In Progress';
                const { response, body } = await jobReq.updateJobStatus(jobId, newStatus, token);

                expect(response.status()).toBe(403);

                const duration = Date.now() - startTime;

                expect(duration).toBeLessThan(500);
                expect(body).toHaveProperty('error');
            });

            test('Delete a job with non-authorized user', async ({ jobReq }) => {
                const startTime = Date.now();

                const { response, body } = await jobReq.deleteJob(jobId, token);

                expect(response.status()).toBe(403);

                const duration = Date.now() - startTime;

                expect(duration).toBeLessThan(500);
                expect(body).toHaveProperty('error');
            });
        });
    });
});
/**
 * @param {import('@playwright/test').Request} request
 */

export const createJobReq = (request) => ({
    endpoint: '/api/jobs',

    _preparePayload(payload) {
        let subtotal = 0;
        if (payload.items) {
            payload.items.forEach(item => {
                item.description = item.description || '';
                subtotal += item.price;
            });
            payload.subtotal = subtotal;
            payload.vat = subtotal * 0.07;
            payload.estimatedPrice = subtotal + payload.vat;
        };
        return payload;
    },

    async getJobs(token) {
        const response = await request.get(this.endpoint, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        const body = await response.json().catch(() => ({}));
        return { response, body };
    },

    async createJob(jobData, token) {
        const payload = this._preparePayload(jobData);
        return await this._sendRequest('post', this.endpoint, payload, token);
    },

    async updateJob(jobId, jobData, token) {
        const payload = this._preparePayload(jobData);
        return await this._sendRequest('put', `${this.endpoint}/${jobId}`, payload, token);
    },

    async deleteJob(jobId, token) {
        const response = await request.delete(`${this.endpoint}/${jobId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        const body = await response.json().catch(() => ({}));
        return { response, body };
    },

    async _sendRequest(method, url, payload, token) {
        const response = await request[method](url, {
            data: payload,
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        const body = await response.json().catch(() => ({}));
        return { response, body };
    },
});
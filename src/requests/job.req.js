/**
 * @param {import('@playwright/test').Request} request
 */

export const createJobReq = (request, token) => ({
    endpoint: '/api/jobs',

    _preparePayload(payload) {
        let subtotal = 0;
        if (payload.items && Array.isArray(payload.items)) {
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

    async getJobs() {
        return await this._sendRequest('get', this.endpoint, '', token);
    },

    async createJob(jobData) {
        const payload = this._preparePayload(jobData);
        return await this._sendRequest('post', this.endpoint, payload, token);
    },

    async updateJob(jobId, jobData, authendicated = true) {
        if (!jobId) { throw new Error('Job ID is required for updating a job'); };
        const payload = this._preparePayload(jobData);
        if (!authendicated) {
            return await this._sendRequest('put', `${this.endpoint}/${jobId}`, payload, '');
        } else {
            return await this._sendRequest('put', `${this.endpoint}/${jobId}`, payload, token);
        }
    },

    async updateJobStatus(jobId, status, authendicated = true) {
        if (!jobId) { throw new Error('Job ID is required for updating job status'); };
        if (!status) { throw new Error('Status is required for updating job status'); };
        if (!authendicated) {
            return await this._sendRequest('patch', `${this.endpoint}/${jobId}/status`, { status }, '');
        } else {
            return await this._sendRequest('patch', `${this.endpoint}/${jobId}/status`, { status }, token);
        }
    },

    async deleteJob(jobId, authendicated = true) {
        if (!jobId) { throw new Error('Job ID is required for deleting a job'); };
        if (!authendicated) {
            return await this._sendRequest('delete', `${this.endpoint}/${jobId}`, '', '');
        } else {
            return await this._sendRequest('delete', `${this.endpoint}/${jobId}`, '', token);
        }
    },

    async _sendRequest(method, url, payload) {
        if (!token) { throw new Error('Token is required for sending requests'); };
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
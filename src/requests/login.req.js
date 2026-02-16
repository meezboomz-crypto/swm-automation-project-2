/**
* @param {import('@playwright/test').Request} request 
*/

export const createLoginReq = (request) => ({
    endpoint: '/api/login',

    async login(username, password) {
        return await this.postRaw({ username, password });
    },

    async postRaw(payload) {
        const response = await request.post(this.endpoint, {
            data: payload
        });
        const body = await response.json().catch(() => ({}));
        return { response, body };
    }
});
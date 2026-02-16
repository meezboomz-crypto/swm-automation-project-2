function getUsernameAndPassword() {
    let admins = [];
    let generals = [];

    if (process.env.ADMIN_ACCOUNTS && process.env.USER_ACCOUNTS) {
        try {
            admins = JSON.parse(process.env.ADMIN_ACCOUNTS);
            generals = JSON.parse(process.env.USER_ACCOUNTS);
        } catch (e) {
            console.error("๋JSON ใน Secret รูปแบบผิด!", e);
        };
    } else {
        try {
            const testData = require('../testData.json');
            admins = testData.validLoginAdmin;
            generals = testData.validLoginUser;
        } catch (e) {
            console.warn("ไม่พบไฟล์ testData.json ในเครื่อง");
        };
    };

    return { admins, generals };
};

module.exports = {
    getUsernameAndPassword
}
const fs = require('fs');
const path = require('path');

function getUsernameAndPassword() {
    let admins = [];
    let generals = [];

    // 1. ตรวจสอบจาก Environment Variables ก่อน (สำหรับ CI/CD)
    const envAdmins = process.env.ADMIN_ACCOUNTS;
    const envGenerals = process.env.USER_ACCOUNTS;

    if (envAdmins && envGenerals) {
        try {
            admins = JSON.parse(envAdmins);
            generals = JSON.parse(envGenerals);
            return { admins, generals }; // เจอแล้วคืนค่าเลย
        } catch (e) {
            console.error("❌ รูปแบบ JSON ใน Env เพี้ยน! กรุณาตรวจสอบ Quotes");
        }
    }

    // 2. Fallback: ถ้าไม่มี Env ให้มาดูที่ไฟล์ (สำหรับ Local)
    try {
        const filePath = path.resolve(__dirname, '../testData.json');
        if (fs.existsSync(filePath)) {
            const fileData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            admins = fileData.validLoginAdmin || [];
            generals = fileData.validLoginUser || [];
        } else {
            console.warn("⚠️ ไม่พบไฟล์ testData.json และไม่ได้ตั้งค่า Env");
        }
    } catch (e) {
        console.error("❌ อ่านไฟล์ testData.json พัง:", e.message);
    }

    return { admins, generals };
}

module.exports = { getUsernameAndPassword };
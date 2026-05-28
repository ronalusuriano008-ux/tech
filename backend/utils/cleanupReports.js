const fs = require('fs');
const path = require('path');

function cleanupOldReports(hours = 24) {

    const reportsDir = path.join(__dirname, '../public/reports');

    if (!fs.existsSync(reportsDir)) return;

    const now = Date.now();

    fs.readdirSync(reportsDir).forEach(file => {

        const filePath = path.join(reportsDir, file);

        const stats = fs.statSync(filePath);

        const ageHours = (now - stats.mtimeMs) / (1000 * 60 * 60);

        if (ageHours > hours) {
            fs.unlinkSync(filePath);
            console.log('[Cleanup] Eliminado:', file);
        }

    });
}

module.exports = { cleanupOldReports };

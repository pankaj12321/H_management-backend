const cron = require('node-cron');
const { autoMarkStaffPresent } = require('../controller/attendance');

const initCronJobs = () => {
    // Schedule a task to run every day at 00:00 (midnight) IST
    cron.schedule('0 0 * * *', async () => {
        console.log('--- Running Daily Attendance Cron Job ---');
        await autoMarkStaffPresent();
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });

    console.log('✅ Daily Attendance Cron Job Initialized (Midnight IST)');

    // Run once on startup to ensure today's attendance is marked
    autoMarkStaffPresent();
};

module.exports = { initCronJobs };

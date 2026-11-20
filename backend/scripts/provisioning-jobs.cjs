require('../dist/config/env');
const { deliverEmails } = require('../dist/jobs/provisioning');
const { queueDueDeadlineNotices } = require('../dist/modules/recruitment/notification.service');
const { pool } = require('../dist/config/database');
(async () => {
  console.log('Deadline notifications created:', await queueDueDeadlineNotices());
  console.log('Emails accepted by SMTP:', await deliverEmails());
})().catch(() => { console.error('Provisioning jobs failed. Check migration and email configuration.'); process.exitCode = 1; }).finally(() => pool?.end());

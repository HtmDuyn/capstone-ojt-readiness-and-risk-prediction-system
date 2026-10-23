require('../dist/config/env');
const { archiveRecruitment, deliverEmails } = require('../dist/jobs/provisioning');
const { pool } = require('../dist/config/database');
(async () => {
  console.log('Archived recruitment posts:', await archiveRecruitment());
  console.log('Emails accepted by SMTP:', await deliverEmails());
})().catch(() => { console.error('Provisioning jobs failed. Check migration and email configuration.'); process.exitCode = 1; }).finally(() => pool?.end());

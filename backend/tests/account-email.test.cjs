const { test } = require('node:test');
const assert = require('node:assert/strict');
const { frontendLoginUrl, PRODUCTION_LOGIN_URL } = require('../dist/config/frontend');
const { accountEmail, accountRoleLabels, formatEmailDateTime } = require('../dist/shared/account-email');
function loginConfig(t, value) {
  const previous = process.env.FRONTEND_LOGIN_URL;
  process.env.FRONTEND_LOGIN_URL = value;
  t.after(() => { if (previous === undefined) delete process.env.FRONTEND_LOGIN_URL; else process.env.FRONTEND_LOGIN_URL = previous; });
}

test('account email links use Vercel when configuration is absent or points at a local machine', () => {
  for (const value of ['', '  ', 'http://localhost:5173/login', 'http://127.0.0.1:5173/login', 'http://[::1]:5173/login', 'http://app.localhost/login', 'http://0.0.0.0:5173/login'])
    assert.equal(frontendLoginUrl(value), PRODUCTION_LOGIN_URL);
  assert.equal(frontendLoginUrl('https://ojt.example.test'), 'https://ojt.example.test/login');
  assert.equal(frontendLoginUrl(' https://ojt.example.test/login '), 'https://ojt.example.test/login');
  for (const value of ['invalid', 'javascript:alert(1)', 'https://user:password@example.test/login'])
    assert.throws(() => frontendLoginUrl(value), { code: 'FRONTEND_LOGIN_URL_INVALID' });
});

test('password deadlines display day/month/year and hour/minute in Vietnam, including date rollover', () => {
  assert.equal(formatEmailDateTime(new Date('2026-11-23T06:05:08.297Z')), '23/11/2026, 13:05 (giờ Việt Nam, UTC+7)');
  assert.equal(formatEmailDateTime(new Date('2026-12-31T20:15:00Z')), '01/01/2027, 03:15 (giờ Việt Nam, UTC+7)');
  assert.equal(formatEmailDateTime(new Date('2026-11-22T17:00:00Z')), '23/11/2026, 00:00 (giờ Việt Nam, UTC+7)');
});

test('welcome templates cover every role with matching plain text and HTML and safely escaped account data', t => {
  loginConfig(t, 'http://localhost:5173/login');
  for (const [roleCode, label] of Object.entries(accountRoleLabels)) {
    const mail = accountEmail({ fullName: 'Nguyễn <An> & Co', email: 'an@example.test', username: 'account_test', roleCode,
      code: ['ENTERPRISE','STUDENT'].includes(roleCode) ? 'CODE001' : undefined,
      companyName: roleCode === 'ENTERPRISE' ? 'Company <script>alert(1)</script>' : undefined,
      temporary: { password: 'Test<&"Password', expiresAt: new Date('2026-11-23T06:05:08.297Z') },
    });
    assert.ok(mail.subject.includes(label));
    for (const body of [mail.text, mail.html]) {
      assert.ok(body.includes(PRODUCTION_LOGIN_URL));
      assert.ok(body.includes('23/11/2026, 13:05 (giờ Việt Nam, UTC+7)'));
      assert.ok(body.includes('Email đăng nhập')); assert.ok(body.includes('Hướng dẫn đăng nhập') || body.includes('HƯỚNG DẪN ĐĂNG NHẬP'));
      assert.ok(!body.includes('localhost')); assert.ok(!body.includes('2026-11-23T06:05'));
    }
    assert.ok(mail.text.includes('Mật khẩu tạm: Test<&"Password'));
    assert.ok(mail.html.includes('Nguyễn &lt;An&gt; &amp; Co'));
    assert.ok(mail.html.includes('Test&lt;&amp;&quot;Password'));
    assert.ok(!mail.html.includes('<script>'));
    if (roleCode === 'STUDENT') assert.ok(mail.text.includes('Mã sinh viên: CODE001'));
    if (roleCode === 'ENTERPRISE') assert.ok(mail.text.includes('Mã doanh nghiệp: CODE001'));
  }
});

test('manual staff welcome uses the supplied-password policy without inventing a temporary password deadline', t => {
  loginConfig(t, PRODUCTION_LOGIN_URL);
  for (const roleCode of ['ADMIN', 'ACADEMIC', 'OJT_COORD']) {
    const mail = accountEmail({ fullName: 'Nhân viên', email: 'staff@example.test', username: 'staff_test', roleCode });
    assert.ok(mail.text.includes('Sử dụng mật khẩu do quản trị viên cung cấp.'));
    assert.ok(!mail.text.includes('Mật khẩu tạm hết hạn'));
    assert.ok(mail.html.includes('Đăng nhập hệ thống'));
  }
});

test('administrator password reset uses the same public login and readable deadline', t => {
  loginConfig(t, 'http://localhost:5173/login');
  const mail = accountEmail({ fullName: 'Sinh viên', email: 'student@example.test', username: 'student_test', roleCode: 'STUDENT',
    purpose: 'PASSWORD_RESET', temporary: { password: 'TestPassword123', expiresAt: new Date('2026-11-23T06:05:00Z') } });
  assert.ok(mail.subject.includes('Đặt lại mật khẩu'));
  assert.ok(mail.text.includes(PRODUCTION_LOGIN_URL));
  assert.ok(mail.html.includes('23/11/2026, 13:05'));
});

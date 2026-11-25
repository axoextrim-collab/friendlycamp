import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeIdentifier, normalizePhone, passwordRequirements, validateIdentity, validatePassword } from '../src/utils/authForm';
import { registerSchema } from '../server/schemas';

test('Iranian phone numbers accept Persian, Arabic and international input without accepting invalid lengths', () => {
  for (const phone of ['۰۹۱۲۱۲۳۴۵۶۷', '٠٩١٢١٢٣٤٥٦٧', '+98 (912) 123-4567', '00989121234567', '989121234567']) {
    assert.equal(normalizePhone(phone), '09121234567');
    assert.deepEqual(validateIdentity({ fullName: 'همسفر آزمایشی', phone, email: 'hello@example.com' }), {});
  }
  for (const phone of ['0912', '091212345678', '02112345678', '+9891212345670']) {
    assert.ok(validateIdentity({ fullName: 'همسفر آزمایشی', phone, email: 'hello@example.com' }).phone);
  }
});

test('login identifiers normalize emails independently from phone numbers', () => {
  assert.equal(normalizeIdentifier(' HELLO+98@EXAMPLE.COM '), 'hello+98@example.com');
  assert.equal(normalizeIdentifier(' +۹۸۹۱۲۱۲۳۴۵۶۷ '), '09121234567');
});

test('password rules match server bounds and require Latin letters and digits', () => {
  for (const password of ['Short123', 'onlyletterslong', '12345678901', 'رمزفارسی۱۲۳۴۵', 'a1' + 'x'.repeat(127)]) {
    assert.ok(validatePassword({ password, confirmPassword: password, agreeTerms: true }).password);
  }
  for (const password of ['a123456789', 'a1' + 'x'.repeat(126), '  Camp1234  ']) {
    assert.equal(passwordRequirements(password).every(rule => rule.met), true);
    assert.deepEqual(validatePassword({ password, confirmPassword: password, agreeTerms: true }), {});
    assert.doesNotThrow(() => registerSchema.parse({ fullName: 'همسفر آزمایشی', phone: '09121234567', email: 'hello@example.com', password, agreeTerms: true }));
  }
});

test('registration requires matching passwords, explicit consent and complete identity', () => {
  const errors = validatePassword({ password: 'Friendly1234', confirmPassword: 'friendly1234', agreeTerms: false });
  assert.ok(errors.confirmPassword); assert.ok(errors.agreeTerms); assert.equal(errors.password, undefined);
  assert.deepEqual(Object.keys(validateIdentity({ fullName: '  ', phone: '', email: 'incomplete@' })), ['fullName', 'phone', 'email']);
});

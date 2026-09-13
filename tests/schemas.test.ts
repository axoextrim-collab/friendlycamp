import test from 'node:test';
import assert from 'node:assert/strict';
import { aiSchema, loginSchema, registerSchema } from '../server/schemas';

test('registration rejects weak passwords and invalid Iranian phones', () => {
  assert.equal(registerSchema.safeParse({ fullName: 'کاربر تست', phone: '123', email: 'test@example.com', password: 'weak', agreeTerms: true }).success, false);
});

test('registration accepts a valid payload and strips an injected admin role', () => {
  const result = registerSchema.parse({ fullName: 'کاربر تست', phone: '09123456789', email: 'test@example.com', password: 'SecurePass123', agreeTerms: true, role: 'admin' });
  assert.equal('role' in result, false);
});

test('login and AI prompts enforce bounded inputs', () => {
  assert.equal(loginSchema.safeParse({ identifier: 'test@example.com', password: 'x', remember: true }).success, true);
  assert.equal(aiSchema.safeParse({ contentType: 'blog', tourName: 'دماوند', additionalPrompt: 'x'.repeat(2001) }).success, false);
  assert.equal(aiSchema.safeParse({ contentType: 'unknown', tourName: 'دماوند' }).success, false);
});

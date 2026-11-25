import test from 'node:test';
import assert from 'node:assert/strict';
import { loginSchema, registerSchema } from '../server/schemas';

test('registration rejects weak passwords and invalid Iranian phones', () => {
  assert.equal(registerSchema.safeParse({ fullName: 'کاربر تست', phone: '123', email: 'test@example.com', password: 'weak', agreeTerms: true }).success, false);
});

test('registration accepts a valid payload and strips an injected admin role', () => {
  const result = registerSchema.parse({ fullName: 'کاربر تست', phone: '09123456789', email: 'test@example.com', password: 'SecurePass123', agreeTerms: true, role: 'admin' });
  assert.equal('role' in result, false);
});

test('login enforces bounded inputs', () => {
  assert.equal(loginSchema.safeParse({ identifier: 'test@example.com', password: 'x', remember: true }).success, true);
  assert.equal(loginSchema.safeParse({ identifier: 'a'.repeat(255), password: 'x' }).success, false);
  assert.equal(loginSchema.safeParse({ identifier: 'test@example.com', password: 'x'.repeat(129) }).success, false);
});

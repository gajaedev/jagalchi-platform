import { describe, expect, it } from 'vitest';

import {
  extractUserEmailFromToken,
  extractUserRoleFromToken,
  normalizeUserRole,
  permissionsForRole,
} from './jwt';

function createToken(payload: Record<string, unknown>): string {
  return [
    btoa(JSON.stringify({ alg: 'none' }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, ''),
    btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
    'signature',
  ].join('.');
}

describe('JWT product role mapping', () => {
  it.each([
    ['STUDENT', 'USER', 'READ,WRITE'],
    ['TEACHER', 'ADMIN', 'ALL'],
    ['ADMIN', 'ADMIN', 'ALL'],
    ['USER', 'USER', 'READ,WRITE'],
    ['GUEST', 'GUEST', 'READ'],
    [null, 'GUEST', 'READ'],
    [123, 'GUEST', 'READ'],
  ] as const)('maps %s to %s with %s permission', (role, expectedRole, expectedPermissions) => {
    expect(normalizeUserRole(role)).toBe(expectedRole);
    expect(permissionsForRole(role)).toBe(expectedPermissions);
  });

  it('extracts email from JWT payload', () => {
    const token = createToken({ email: 'kim@example.com' });

    expect(extractUserEmailFromToken(token)).toBe('kim@example.com');
  });

  it('reads the Nest access-token roles array', () => {
    const token = createToken({ roles: ['USER'] });
    expect(extractUserRoleFromToken(token)).toBe('USER');
  });
});

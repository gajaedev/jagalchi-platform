import { Buffer } from 'node:buffer';

import { createStore } from 'jotai';
import { describe, expect, it } from 'vitest';

import { getAccessToken } from '@/api/client';

import {
  currentUserEmailAtom,
  currentUserIdAtom,
  currentUserNameAtom,
  currentUserPermissionsAtom,
  currentUserRoleAtom,
  isAuthenticatedAtom,
  loginAtom,
  logoutAtom,
} from './auth.atoms';

function toBase64Url(value: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

function createToken(payload: Record<string, unknown>): string {
  return [toBase64Url({ alg: 'none', typ: 'JWT' }), toBase64Url(payload), 'signature'].join('.');
}

describe('auth atoms', () => {
  it('initializes current user state from login token and clears it on logout', () => {
    const store = createStore();
    const token = createToken({
      id: 1,
      email: 'kim@example.com',
      name: '김선배',
      role: 'STUDENT',
      sub: 'user-1',
    });

    store.set(loginAtom, token);

    expect(store.get(isAuthenticatedAtom)).toBe(true);
    expect(getAccessToken()).toBe(token);
    expect(store.get(currentUserEmailAtom)).toBe('kim@example.com');
    expect(store.get(currentUserIdAtom)).toBe('1');
    expect(store.get(currentUserNameAtom)).toBe('김선배');
    expect(store.get(currentUserRoleAtom)).toBe('USER');
    expect(store.get(currentUserPermissionsAtom)).toBe('READ,WRITE');

    store.set(logoutAtom);

    expect(store.get(isAuthenticatedAtom)).toBe(false);
    expect(getAccessToken()).toBeNull();
    expect(store.get(currentUserEmailAtom)).toBeNull();
    expect(store.get(currentUserIdAtom)).toBeNull();
    expect(store.get(currentUserNameAtom)).toBeNull();
    expect(store.get(currentUserRoleAtom)).toBeNull();
    expect(store.get(currentUserPermissionsAtom)).toBeNull();
  });
});

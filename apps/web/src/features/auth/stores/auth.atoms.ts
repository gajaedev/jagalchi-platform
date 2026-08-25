import { atom } from 'jotai';

import { setAccessToken, clearAccessToken } from '@/api/client';
import {
  accessTokenAtom,
  currentUserEmailAtom,
  currentUserIdAtom,
  currentUserNameAtom,
  currentUserPermissionsAtom,
  currentUserRoleAtom,
} from '@/lib/auth-atoms';
import {
  extractUserEmailFromToken,
  extractUserIdFromToken,
  extractUserNameFromToken,
  extractUserRoleFromToken,
  normalizeUserRole,
  permissionsForRole,
} from '@/lib/jwt';

export {
  currentUserEmailAtom,
  currentUserIdAtom,
  currentUserNameAtom,
  currentUserPermissionsAtom,
  currentUserRoleAtom,
  isAuthenticatedAtom,
  isAuthInitializedAtom,
} from '@/lib/auth-atoms';

/** 로그인 시 토큰 저장 + JWT에서 이름 추출 */
export const loginAtom = atom(null, (_get, set, token: string) => {
  set(accessTokenAtom, token);
  setAccessToken(token);
  const name = extractUserNameFromToken(token);
  const email = extractUserEmailFromToken(token);
  const userId = extractUserIdFromToken(token);
  const tokenRole = extractUserRoleFromToken(token);
  const userRole = normalizeUserRole(tokenRole);
  const userPermissions = permissionsForRole(tokenRole);
  set(currentUserNameAtom, name);
  set(currentUserEmailAtom, email);
  set(currentUserIdAtom, userId);
  set(currentUserRoleAtom, userRole);
  set(currentUserPermissionsAtom, userPermissions);
});

/** 로그아웃 시 토큰 삭제 + 상태 초기화 */
export const logoutAtom = atom(null, (_get, set) => {
  set(accessTokenAtom, null);
  set(currentUserNameAtom, null);
  set(currentUserEmailAtom, null);
  set(currentUserIdAtom, null);
  set(currentUserRoleAtom, null);
  set(currentUserPermissionsAtom, null);
  clearAccessToken();
});

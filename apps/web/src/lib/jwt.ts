/**
 * JWT payload를 클라이언트 사이드에서 디코딩하는 유틸리티.
 * 서명 검증 없이 payload만 파싱하므로 표시 용도로만 사용할 것.
 */

interface JwtPayload {
  sub?: string;
  id?: string | number;
  name?: string;
  email?: string;
  role?: unknown;
  roles?: unknown;
  type?: string;
  exp?: number;
  iat?: number;
}

/**
 * JWT 토큰에서 payload를 디코딩한다.
 * 파싱 실패 시 null 반환.
 */
export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    // base64url → base64 변환
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * JWT 토큰에서 사용자 이름을 추출한다.
 * name claim → id claim → sub claim 순서로 시도하고 모두 없으면 null 반환.
 */
export function extractUserNameFromToken(token: string): string | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  return payload.name ?? (payload.id !== undefined ? String(payload.id) : (payload.sub ?? null));
}

/**
 * JWT 토큰에서 사용자 이메일을 추출한다.
 */
export function extractUserEmailFromToken(token: string): string | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  return payload.email ?? null;
}

/**
 * JWT 토큰에서 사용자 ID를 추출한다.
 */
export function extractUserIdFromToken(token: string): string | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  return payload.id !== undefined ? String(payload.id) : (payload.sub ?? null);
}

/**
 * JWT 토큰에서 사용자 역할을 추출한다.
 */
export function extractUserRoleFromToken(token: string): string | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  if (Array.isArray(payload.roles)) {
    return normalizeUserRole(payload.roles);
  }
  return typeof payload.role === 'string' ? normalizeUserRole(payload.role) : null;
}

/**
 * 여러 인증 공급자의 역할 값을 제품 역할로 정규화한다.
 */
export function normalizeUserRole(role: unknown): string {
  if (Array.isArray(role)) {
    const normalizedRoles = role.map(normalizeUserRole);
    if (normalizedRoles.includes('ADMIN')) return 'ADMIN';
    if (normalizedRoles.includes('USER')) return 'USER';
    if (normalizedRoles.includes('GUEST')) return 'GUEST';
    return 'GUEST';
  }

  if (typeof role !== 'string' || !role) return 'GUEST';

  switch (role.toUpperCase()) {
    case 'STUDENT':
      return 'USER';
    case 'TEACHER':
    case 'REVIEWER':
    case 'ADMIN':
      return 'ADMIN';
    case 'USER':
      return 'USER';
    case 'GUEST':
      return 'GUEST';
    default:
      return 'GUEST';
  }
}

/**
 * 제품 역할에 맞는 UI 권한 표시 값을 계산한다.
 */
export function permissionsForRole(role: unknown): string {
  const normalizedRole = normalizeUserRole(role);

  switch (normalizedRole) {
    case 'ADMIN':
      return 'ALL';
    case 'USER':
      return 'READ,WRITE';
    default:
      return 'READ';
  }
}

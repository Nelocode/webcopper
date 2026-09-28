import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';

export async function getSession(): Promise<{
  userId: string;
  name: string;
  role: string;
  tenantId?: string;
  email?: string;
} | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('crm_session');
    if (!sessionCookie?.value) return null;
    const payload = await verifySession(sessionCookie.value);
    return payload as any;
  } catch {
    return null;
  }
}

export function requireRole(session: any, ...roles: string[]): boolean {
  if (!session) return false;
  return roles.includes(session.role);
}

/**
 * Returns the effective tenantId for data querying and modification.
 * - Non-SUPER_ADMIN users are STRICTLY scoped to their session.tenantId.
 * - SUPER_ADMIN users can specify a requestedTenantId or fall back to session.tenantId.
 */
export function getEffectiveTenantId(session: any, requestedTenantId?: string | null): string | null {
  if (!session) return null;
  if (session.role === 'SUPER_ADMIN') {
    if (requestedTenantId && requestedTenantId !== 'ALL' && requestedTenantId !== 'global') {
      return requestedTenantId;
    }
    return null; // SUPER_ADMIN without specific tenant query sees all
  }
  return session.tenantId || null;
}


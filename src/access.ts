export const roles = ['resident', 'official', 'merchant'] as const;
export type Role = typeof roles[number];
export type Grant = { role: Role; merchantIds?: string[] };
export type Profile = { id: string; name: string; grants: Grant[] };
export const canUseRole = (profile: Profile | null, role: Role, merchantId?: string) => !!profile?.grants.some(g => g.role === role && (role !== 'merchant' || !merchantId || g.merchantIds?.includes(merchantId)));
export const routeRoles: Record<string, Role[]> = {
  '/pickup': ['resident'], '/attendance': ['resident'], '/pay': ['resident'], '/receipt': ['resident'], '/activity': ['resident'],
  '/verify': ['official'], '/events': ['official'], '/merchant-qr': ['merchant'],
};
export const publicRoutes = ['/', '/login', '/signup', '/lgu'];

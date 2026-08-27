export type DirectoryResource = 'users' | 'teams' | 'organizations';

const PUBLIC_DIRECTORY_ENDPOINTS: Record<DirectoryResource, string> = {
  users: '/api/users?limit=200',
  teams: '/api/teams?limit=200',
  organizations: '/api/organizations',
};

const MANAGED_DIRECTORY_ENDPOINTS: Record<DirectoryResource, string> = {
  users: '/api/admin/users',
  teams: '/api/admin/teams',
  organizations: '/api/admin/organizations',
};

export function getDirectoryEndpoint(resource: DirectoryResource, canManage: boolean): string {
  return canManage
    ? MANAGED_DIRECTORY_ENDPOINTS[resource]
    : PUBLIC_DIRECTORY_ENDPOINTS[resource];
}

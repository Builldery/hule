import { http } from '@/app/api/httpClient'

export interface Workspace {
  id: string
  name: string
  ownerId: string
  memberIds: string[]
  createdAt: string
  updatedAt: string
}

export interface CreateWorkspaceDto {
  name: string
}

export interface UpdateWorkspaceDto {
  name?: string
}

export interface WorkspaceCreated {
  access_token: string
  workspace: Workspace
}

export const workspacesApi = {
  list: () => http<Workspace[]>('/api/workspaces'),

  get: (id: string) => http<Workspace>(`/api/workspaces/${id}`),

  create: (dto: CreateWorkspaceDto) =>
    http<WorkspaceCreated>('/api/workspaces', { method: 'POST', body: JSON.stringify(dto) }),

  update: (id: string, dto: UpdateWorkspaceDto) =>
    http<Workspace>(`/api/workspaces/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),

  remove: (id: string) =>
    http<void>(`/api/workspaces/${id}`, { method: 'DELETE' }),

  addMember: (id: string, email: string) =>
    http<Workspace>(`/api/workspaces/${id}/members`, { method: 'POST', body: JSON.stringify({ email }) }),

  removeMember: (id: string, memberId: string) =>
    http<Workspace>(`/api/workspaces/${id}/members/${memberId}`, { method: 'DELETE' }),
}

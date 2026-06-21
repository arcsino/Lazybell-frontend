import { api } from '@/lib/api'
import type {
  Group, GroupRole, GroupWebhook, Invite, MemberRelation, MyPermissions, PendingInvite, RolePermission, Subject, Tag, WebhookType
} from '@/types'

export const groupsApi = {
  list: () => api.get<Group[]>('/groups/').then((r) => r.data),

  get: (id: string) => api.get<Group>(`/groups/${id}/`).then((r) => r.data),

  create: (data: { name: string; description?: string; is_private?: boolean; max_members?: number | null }) =>
    api.post<Group>('/groups/', data).then((r) => r.data),

  update: (id: string, data: Partial<{ name: string; description: string; is_private: boolean; max_members: number | null }>) =>
    api.patch<Group>(`/groups/${id}/`, data).then((r) => r.data),

  delete: (id: string) => api.delete(`/groups/${id}/`),

  transfer: (id: string, user_id: string) =>
    api.post<Group>(`/groups/${id}/transfer/`, { user_id }).then((r) => r.data),

  leave: (id: string) => api.delete(`/groups/${id}/leave/`),

  myPermissions: (id: string) =>
    api.get<MyPermissions>(`/groups/${id}/my-permissions/`).then((r) => r.data),

  // Members
  members: (id: string) =>
    api.get<MemberRelation[]>(`/groups/${id}/members/`).then((r) => r.data),

  pendingMembers: (id: string) =>
    api.get<MemberRelation[]>(`/groups/${id}/pending-members/`).then((r) => r.data),

  bannedMembers: (id: string) =>
    api.get<MemberRelation[]>(`/groups/${id}/banned-members/`).then((r) => r.data),

  unban: (id: string, user_id: string) =>
    api.delete(`/groups/${id}/ban/${user_id}/`),

  join: (id: string) =>
    api.post<MemberRelation>(`/groups/${id}/join/`).then((r) => r.data),

  approve: (id: string, user_id: string) =>
    api.post<MemberRelation>(`/groups/${id}/approve/${user_id}/`).then((r) => r.data),

  removeMember: (id: string, user_id: string) =>
    api.delete(`/groups/${id}/members/${user_id}/`),

  ban: (id: string, user_id: string) =>
    api.post<MemberRelation>(`/groups/${id}/ban/${user_id}/`).then((r) => r.data),

  // Invites
  invite: (id: string, user_id: string) =>
    api.post<Invite>(`/groups/${id}/invite/`, { user_id }).then((r) => r.data),

  pendingInvites: (id: string) =>
    api.get<PendingInvite[]>(`/groups/${id}/invite/`).then((r) => r.data),

  cancelInvite: (id: string, invite_id: string) =>
    api.delete(`/groups/${id}/invites/${invite_id}/`),

  // Roles
  roles: (id: string) =>
    api.get<GroupRole[]>(`/groups/${id}/roles/`).then((r) => r.data),

  createRole: (id: string, data: { name: string; permission: RolePermission }) =>
    api.post<GroupRole>(`/groups/${id}/roles/`, data).then((r) => r.data),

  updateRole: (id: string, role_id: string, data: { name?: string; permission?: Partial<RolePermission> }) =>
    api.patch<GroupRole>(`/groups/${id}/roles/${role_id}/`, data).then((r) => r.data),

  deleteRole: (id: string, role_id: string) =>
    api.delete(`/groups/${id}/roles/${role_id}/`),

  assignRole: (id: string, user_id: string, role_id: string) =>
    api.post(`/groups/${id}/members/${user_id}/roles/`, { role_id }).then((r) => r.data),

  removeRole: (id: string, user_id: string, role_id: string) =>
    api.delete(`/groups/${id}/members/${user_id}/roles/${role_id}/`),

  // Subjects
  subjects: (id: string) =>
    api.get<Subject[]>(`/groups/${id}/subjects/`).then((r) => r.data),

  createSubject: (id: string, name: string) =>
    api.post<Subject>(`/groups/${id}/subjects/`, { name }).then((r) => r.data),

  updateSubject: (id: string, subject_id: string, name: string) =>
    api.patch<Subject>(`/groups/${id}/subjects/${subject_id}/`, { name }).then((r) => r.data),

  deleteSubject: (id: string, subject_id: string) =>
    api.delete(`/groups/${id}/subjects/${subject_id}/`),

  // Tags
  tags: (id: string) =>
    api.get<Tag[]>(`/groups/${id}/tags/`).then((r) => r.data),

  createTag: (id: string, name: string, color: string) =>
    api.post<Tag>(`/groups/${id}/tags/`, { name, color }).then((r) => r.data),

  updateTag: (id: string, tag_id: string, data: { color?: string; name?: string }) =>
    api.patch<Tag>(`/groups/${id}/tags/${tag_id}/`, data).then((r) => r.data),

  deleteTag: (id: string, tag_id: string) =>
    api.delete(`/groups/${id}/tags/${tag_id}/`),

  reorderTags: (id: string, order: string[]) =>
    api.post<Tag[]>(`/groups/${id}/tags/reorder/`, { order }).then((r) => r.data),

  // Webhooks
  webhooks: (id: string) =>
    api.get<GroupWebhook[]>(`/groups/${id}/webhooks/`).then((r) => r.data),

  createWebhook: (id: string, webhook_type: WebhookType, url: string, name?: string) =>
    api.post<GroupWebhook>(`/groups/${id}/webhooks/`, { webhook_type, url, name: name ?? '' }).then((r) => r.data),

  updateWebhook: (id: string, webhook_id: string, data: { url?: string; name?: string }) =>
    api.patch<GroupWebhook>(`/groups/${id}/webhooks/${webhook_id}/`, data).then((r) => r.data),

  deleteWebhook: (id: string, webhook_id: string) =>
    api.delete(`/groups/${id}/webhooks/${webhook_id}/`),
}

export const invitesApi = {
  list: () => api.get<Invite[]>('/invites/').then((r) => r.data),
  accept: (invite_id: string) =>
    api.post<MemberRelation>(`/invites/${invite_id}/accept/`).then((r) => r.data),
  decline: (invite_id: string) =>
    api.delete(`/invites/${invite_id}/`),
}

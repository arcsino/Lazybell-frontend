export interface User {
  id: string
  username: string
  nickname: string
  biography: string | null
  last_login_at: string | null
  registered_at: string
}

export interface PublicUser {
  id: string
  username: string
  nickname: string
  biography: string | null
  registered_at: string
}

export interface Group {
  id: string
  name: string
  description: string | null
  is_private: boolean
  max_members: number | null
  owner: PublicUser
  member_count: number
  is_member: boolean
  created_at: string
}

export type MemberStatus = 'joined' | 'request_pending' | 'rejected' | 'banned'

export interface MemberRelation {
  id: string
  user: PublicUser
  status: MemberStatus
  joined_at: string | null
  roles: { id: string; name: string }[]
}

export interface Invite {
  id: string
  group: Group
  invited_by: PublicUser
  created_at: string
}

export interface RolePermission {
  can_invite_user: boolean
  can_remove_member: boolean
  can_manage_role: boolean
  can_edit_group: boolean
  can_edit_schedule: boolean
  can_manage_subject: boolean
  can_manage_tag: boolean
  can_manage_webhook: boolean
}

export interface GroupRole {
  id: string
  name: string
  permission: RolePermission
}

export interface MyPermissions extends RolePermission {
  is_owner: boolean
  is_member: boolean
}

export interface Subject {
  id: string
  name: string
}

export interface Tag {
  id: string
  name: string
  color: string
  priority: number
}

export interface Schedule {
  id: string
  title: string
  detail: string | null
  start_at: string | null
  deadline: string | null
  is_all_day: boolean
  subject: Subject | null
  tags: Tag[]
  created_by: PublicUser
  created_at: string
  updated_at: string
  completed_by_me: boolean
}

export interface CompletionRecord {
  id: string
  user: PublicUser
  completed_at: string
}

export interface ScheduleDetail extends Schedule {
  completions: CompletionRecord[]
}

export interface UpcomingSchedule {
  id: string
  title: string
  start_at: string | null
  deadline: string
  is_all_day: boolean
  group: { id: string; name: string }
  subject: Subject | null
  tags: Tag[]
}

export type WebhookType = 'remind' | 'created_log'

export interface GroupWebhook {
  id: string
  webhook_type: WebhookType
  name: string
  created_by: PublicUser
  updated_by: PublicUser
  created_at: string
  updated_at: string
}

export interface ApiError {
  error?: string
  errors?: Record<string, string[]>
  detail?: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

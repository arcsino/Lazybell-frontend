import { api } from '@/lib/api'
import type { Schedule, ScheduleDetail, UpcomingSchedule } from '@/types'

export interface ScheduleCreatePayload {
  title: string
  detail?: string
  start_at?: string | null
  deadline?: string | null
  is_all_day?: boolean
  subject_id?: string | null
  tag_ids?: string[]
}

export const schedulesApi = {
  upcoming: () =>
    api.get<UpcomingSchedule[]>('/users/me/upcoming-schedules/').then((r) => r.data),

  list: (group_id: string) =>
    api.get<Schedule[]>(`/groups/${group_id}/schedules/`).then((r) => r.data),

  get: (group_id: string, schedule_id: string) =>
    api.get<ScheduleDetail>(`/groups/${group_id}/schedules/${schedule_id}/`).then((r) => r.data),

  create: (group_id: string, data: ScheduleCreatePayload) =>
    api.post<Schedule>(`/groups/${group_id}/schedules/`, data).then((r) => r.data),

  update: (group_id: string, schedule_id: string, data: Partial<ScheduleCreatePayload>) =>
    api.patch<Schedule>(`/groups/${group_id}/schedules/${schedule_id}/`, data).then((r) => r.data),

  delete: (group_id: string, schedule_id: string) =>
    api.delete(`/groups/${group_id}/schedules/${schedule_id}/`),

  complete: (group_id: string, schedule_id: string) =>
    api.post(`/groups/${group_id}/schedules/${schedule_id}/complete/`).then((r) => r.data),

  uncomplete: (group_id: string, schedule_id: string) =>
    api.delete(`/groups/${group_id}/schedules/${schedule_id}/complete/`),
}

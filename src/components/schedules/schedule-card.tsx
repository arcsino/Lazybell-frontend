'use client'
import Link from 'next/link'
import { Calendar, Check, Clock, Tag as TagIcon, Trash2, Edit2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, formatDateTime, isOverdue } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { MyPermissions, Schedule } from '@/types'

interface ScheduleCardProps {
  schedule: Schedule
  groupId: string
  permissions: MyPermissions
  currentUserId: string
  onComplete: () => void
  onEdit: () => void
  onDelete: () => void
}

export function ScheduleCard({
  schedule, groupId, permissions, currentUserId, onComplete, onEdit, onDelete
}: ScheduleCardProps) {
  const overdue = isOverdue(schedule.deadline) && !schedule.completed_by_me
  const canEdit =
    schedule.created_by.id === currentUserId || permissions.can_edit_schedule
  const canDelete = canEdit

  const topTag = schedule.tags.length > 0
    ? [...schedule.tags].sort((a, b) => a.priority - b.priority)[0]
    : null

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:shadow-md',
        schedule.completed_by_me ? 'border-emerald-200 bg-emerald-50/30' : 'border-zinc-200',
        overdue && !schedule.completed_by_me && 'border-red-200'
      )}
    >
      {topTag && (
        <div
          className="absolute inset-y-0 left-0 w-[4px]"
          style={{ backgroundColor: topTag.color }}
        />
      )}
      <div className={cn('flex items-start gap-3 p-4', topTag && 'pl-5')}>
        {/* Completion toggle */}
        <button
          onClick={onComplete}
          className={cn(
            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
            schedule.completed_by_me
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : 'border-zinc-300 hover:border-brand-500'
          )}
        >
          {schedule.completed_by_me && <Check className="h-3 w-3" />}
        </button>

        <Link
          href={`/groups/${groupId}/schedules/${schedule.id}`}
          className="flex-1 min-w-0 block"
        >
          <p className={cn(
            'font-medium',
            schedule.completed_by_me ? 'line-through text-zinc-400' : 'text-zinc-900 group-hover:text-brand-700'
          )}>
            {schedule.title}
          </p>

          {schedule.detail && (
            <p className="mt-0.5 text-sm text-zinc-500 line-clamp-2">{schedule.detail}</p>
          )}

          <div className="mt-2 flex flex-wrap gap-2">
            {schedule.subject && (
              <Badge variant="brand" className="text-xs">{schedule.subject.name}</Badge>
            )}
            {schedule.tags.map((tag) => (
              <Badge key={tag.id} variant="default" className="flex items-center gap-1 text-xs">
                <TagIcon className="h-2.5 w-2.5" />
                {tag.name}
              </Badge>
            ))}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
            {schedule.start_at && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {schedule.is_all_day ? formatDate(schedule.start_at) : formatDateTime(schedule.start_at)}
              </span>
            )}
            {schedule.deadline && (
              <span className={cn('flex items-center gap-1', overdue && 'text-red-500 font-medium')}>
                <Clock className="h-3 w-3" />
                期限: {schedule.is_all_day ? formatDate(schedule.deadline) : formatDateTime(schedule.deadline)}
                {overdue && '（期限超過）'}
              </span>
            )}
          </div>
        </Link>

        {/* Actions */}
        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {canEdit && (
            <Button variant="ghost" size="icon-sm" onClick={onEdit} title="編集">
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
          )}
          {canDelete && (
            <Button variant="ghost" size="icon-sm" onClick={onDelete} title="削除" className="text-red-500 hover:bg-red-50 hover:text-red-700">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

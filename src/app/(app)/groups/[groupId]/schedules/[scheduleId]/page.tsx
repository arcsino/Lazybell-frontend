'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Calendar, Clock, CheckCircle2, Circle,
  Edit2, Trash2, Tag as TagIcon, BookOpen, User, AlertCircle
} from 'lucide-react'
import { schedulesApi, type ScheduleCreatePayload } from '@/lib/api/schedules'
import { groupsApi } from '@/lib/api/groups'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/components/ui/toast'
import { extractApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog'
import { PageLoader } from '@/components/ui/spinner'
import { ScheduleForm } from '@/components/schedules/schedule-form'
import { formatDate, formatDateTime, getInitials, isOverdue } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function ScheduleDetailPage({
  params,
}: {
  params: { groupId: string; scheduleId: string }
}) {
  const { groupId, scheduleId } = params
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const qc = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [completing, setCompleting] = useState(false)

  const { data: schedule, isLoading } = useQuery({
    queryKey: ['schedule', groupId, scheduleId],
    queryFn: () => schedulesApi.get(groupId, scheduleId),
  })
  const { data: group } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => groupsApi.get(groupId),
  })
  const { data: perms } = useQuery({
    queryKey: ['my-permissions', groupId],
    queryFn: () => groupsApi.myPermissions(groupId),
  })
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects', groupId],
    queryFn: () => groupsApi.subjects(groupId),
    enabled: !!perms?.can_edit_schedule,
  })
  const { data: tags = [] } = useQuery({
    queryKey: ['tags', groupId],
    queryFn: () => groupsApi.tags(groupId),
    enabled: !!perms?.can_edit_schedule,
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['schedule', groupId, scheduleId] })
    qc.invalidateQueries({ queryKey: ['schedules', groupId] })
  }

  const handleComplete = async () => {
    if (!schedule) return
    setCompleting(true)
    try {
      if (schedule.completed_by_me) {
        await schedulesApi.uncomplete(groupId, scheduleId)
        toast('完了を取り消しました。', 'info')
      } else {
        await schedulesApi.complete(groupId, scheduleId)
        toast('完了にしました！', 'success')
      }
      invalidate()
    } catch (err) {
      toast(extractApiError(err), 'error')
    } finally {
      setCompleting(false)
    }
  }

  const handleEdit = async (data: Partial<ScheduleCreatePayload>) => {
    setEditSaving(true)
    try {
      await schedulesApi.update(groupId, scheduleId, data)
      invalidate()
      setEditOpen(false)
      toast('スケジュールを更新しました！', 'success')
    } catch (err) {
      toast(extractApiError(err), 'error')
    } finally {
      setEditSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!schedule || !confirm(`「${schedule.title}」を削除しますか？`)) return
    try {
      await schedulesApi.delete(groupId, scheduleId)
      qc.invalidateQueries({ queryKey: ['schedules', groupId] })
      router.push(`/groups/${groupId}`)
      toast('スケジュールを削除しました。', 'success')
    } catch (err) {
      toast(extractApiError(err), 'error')
    }
  }

  if (isLoading) return <PageLoader />
  if (!schedule) return <div className="p-6 text-sm text-zinc-500">スケジュールが見つかりません。</div>

  const canEdit = perms && (
    schedule.created_by.id === user?.id || perms.can_edit_schedule
  )
  const overdue = isOverdue(schedule.deadline)
  const completionCount = schedule.completions?.length ?? 0

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href={`/groups/${groupId}`}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {group?.name ?? 'グループへ戻る'}
      </Link>

      {/* Header card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              {/* Overdue badge */}
              {overdue && !schedule.completed_by_me && (
                <div className="mb-3 flex items-center gap-1.5 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">期限超過</span>
                </div>
              )}

              <h1 className={cn(
                'text-2xl font-bold leading-tight',
                schedule.completed_by_me ? 'text-zinc-400 line-through' : 'text-zinc-900'
              )}>
                {schedule.title}
              </h1>

              {/* Subject */}
              {schedule.subject && (
                <div className="mt-2 flex items-center gap-1.5 text-sm text-zinc-500">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>{schedule.subject.name}</span>
                </div>
              )}

              {/* Tags */}
              {schedule.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {schedule.tags.map((tag) => (
                    <Badge key={tag.id} variant="brand" className="flex items-center gap-1 text-xs">
                      <TagIcon className="h-2.5 w-2.5" />
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons */}
            {canEdit && (
              <div className="flex gap-2 shrink-0">
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Edit2 className="h-3.5 w-3.5" /> 編集
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>スケジュール編集</DialogTitle>
                    </DialogHeader>
                    <ScheduleForm
                      defaultValues={schedule}
                      subjects={subjects}
                      tags={tags}
                      onSubmit={handleEdit}
                      submitLabel="変更を保存"
                      loading={editSaving}
                    />
                  </DialogContent>
                </Dialog>
                <Button size="sm" variant="danger-outline" onClick={handleDelete}>
                  <Trash2 className="h-3.5 w-3.5" /> 削除
                </Button>
              </div>
            )}
          </div>

          {/* Date/time info */}
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {schedule.start_at && (
              <div className="flex items-center gap-2 text-sm text-zinc-600">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-100">
                  <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                </div>
                <div>
                  <p className="text-xs text-zinc-400">開始</p>
                  <p className="font-medium">
                    {schedule.is_all_day ? formatDate(schedule.start_at) : formatDateTime(schedule.start_at)}
                  </p>
                </div>
              </div>
            )}
            {schedule.deadline && (
              <div className="flex items-center gap-2 text-sm">
                <div className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-md',
                  overdue && !schedule.completed_by_me ? 'bg-red-50' : 'bg-zinc-100'
                )}>
                  <Clock className={cn(
                    'h-3.5 w-3.5',
                    overdue && !schedule.completed_by_me ? 'text-red-500' : 'text-zinc-500'
                  )} />
                </div>
                <div>
                  <p className="text-xs text-zinc-400">期限</p>
                  <p className={cn(
                    'font-medium',
                    overdue && !schedule.completed_by_me ? 'text-red-600' : 'text-zinc-600'
                  )}>
                    {schedule.is_all_day ? formatDate(schedule.deadline) : formatDateTime(schedule.deadline)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {schedule.is_all_day && (
            <p className="mt-2 text-xs text-zinc-400">終日イベント</p>
          )}
        </CardContent>
      </Card>

      {/* Detail / description */}
      {schedule.detail && (
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-3 text-sm font-semibold text-zinc-700">説明</h2>
            <p className="whitespace-pre-wrap text-sm text-zinc-700 leading-relaxed">
              {schedule.detail}
            </p>
          </CardContent>
        </Card>
      )}

      {/* My completion status */}
      <Card className={cn(
        'transition-colors',
        schedule.completed_by_me ? 'border-emerald-200 bg-emerald-50/40' : ''
      )}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {schedule.completed_by_me ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              ) : (
                <Circle className="h-6 w-6 text-zinc-300" />
              )}
              <div>
                <p className={cn(
                  'font-medium',
                  schedule.completed_by_me ? 'text-emerald-700' : 'text-zinc-700'
                )}>
                  {schedule.completed_by_me ? '完了しました' : '未完了'}
                </p>
                {schedule.completed_by_me && (
                  <p className="text-xs text-emerald-600">
                    あなたが完了しました
                    {schedule.completions?.find(c => c.user.id === user?.id)?.completed_at
                      ? `（${formatDateTime(schedule.completions.find(c => c.user.id === user?.id)!.completed_at)}）`
                      : ''}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant={schedule.completed_by_me ? 'outline' : 'primary'}
              size="sm"
              loading={completing}
              onClick={handleComplete}
            >
              {schedule.completed_by_me ? '取り消し' : '完了にする'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Completions list */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-sm font-semibold text-zinc-700">
            完了したメンバー ({completionCount})
          </h2>
          {completionCount === 0 ? (
            <p className="text-sm text-zinc-400">まだ誰も完了していません。</p>
          ) : (
            <div className="space-y-3">
              {schedule.completions.map((c) => (
                <div key={c.id} className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{getInitials(c.user.nickname)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900">{c.user.nickname}</p>
                    <p className="text-xs text-zinc-400">{formatDateTime(c.completed_at)}</p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Meta info */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400 pb-4">
        <span className="flex items-center gap-1">
          <User className="h-3 w-3" />
          作成者: {schedule.created_by.nickname}
        </span>
        <span>作成日: {formatDateTime(schedule.created_at)}</span>
        {schedule.updated_at !== schedule.created_at && (
          <span>更新日: {formatDateTime(schedule.updated_at)}</span>
        )}
      </div>
    </div>
  )
}

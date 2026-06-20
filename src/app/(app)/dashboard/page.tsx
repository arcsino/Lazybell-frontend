'use client'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Users, Mail, CalendarDays, ArrowRight, Clock, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { groupsApi, invitesApi } from '@/lib/api/groups'
import { schedulesApi } from '@/lib/api/schedules'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/ui/spinner'
import { GroupCard } from '@/components/groups/group-card'
import { formatDate, formatDateTime, isOverdue } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const { user } = useAuth()

  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: groupsApi.list,
  })

  const { data: invites } = useQuery({
    queryKey: ['invites'],
    queryFn: invitesApi.list,
  })

  const { data: upcomingSchedules = [] } = useQuery({
    queryKey: ['upcoming-schedules'],
    queryFn: schedulesApi.upcoming,
  })

  const myGroups = groups?.filter((g) => g.is_member) ?? []
  const pendingInvites = invites ?? []

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">
          おかえり、<span className="text-brand-600">{user?.nickname}</span> 👋
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          グループの最新情報をご確認ください。
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
              <Users className="h-5 w-5 text-brand-600" />
            </div>
            <div className="space-y-0.5">
              <p className="text-2xl font-bold text-zinc-900">{myGroups.length}</p>
              <p className="text-sm text-zinc-500">グループ</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <Mail className="h-5 w-5 text-amber-600" />
            </div>
            <div className="space-y-0.5">
              <p className="text-2xl font-bold text-zinc-900">{pendingInvites.length}</p>
              <p className="text-sm text-zinc-500">招待待ち</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <CalendarDays className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="space-y-0.5">
              <p className="text-2xl font-bold text-zinc-900">{upcomingSchedules.length}</p>
              <p className="text-sm text-zinc-500">直近のスケジュール</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-zinc-900">
              招待
              <Badge variant="warning" className="ml-2">{pendingInvites.length}</Badge>
            </h2>
            <Link href="/invites">
              <Button variant="ghost" size="sm">
                すべて表示 <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <div className="space-y-2">
            {pendingInvites.slice(0, 3).map((invite) => (
              <Card key={invite.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-zinc-900">{invite.group.name}</p>
                    <p className="text-xs text-zinc-500">
                      招待者: {invite.invited_by.nickname} · {formatDateTime(invite.created_at)}
                    </p>
                  </div>
                  <Link href="/invites">
                    <Button variant="outline" size="sm">管理</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming schedules */}
      {upcomingSchedules.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-zinc-900">
              直近のスケジュール
              <Badge variant="brand" className="ml-2">{upcomingSchedules.length}</Badge>
            </h2>
            <Link href="/calendar">
              <Button variant="ghost" size="sm">
                カレンダー表示 <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <div className="space-y-2">
            {upcomingSchedules.map((schedule) => {
              const overdue = isOverdue(schedule.deadline)
              const topTag = schedule.tags.length > 0
                ? [...schedule.tags].sort((a, b) => a.priority - b.priority)[0]
                : null
              return (
                <Link
                  key={schedule.id}
                  href={`/groups/${schedule.group.id}/schedules/${schedule.id}`}
                  className="block"
                >
                  <Card className={cn('relative overflow-hidden transition-colors hover:border-brand-200')}>
                    {topTag && (
                      <div
                        className="absolute inset-y-0 left-0 w-[4px]"
                        style={{ backgroundColor: topTag.color }}
                      />
                    )}
                    <CardContent className={cn('flex items-center justify-between p-4', topTag && 'pl-5')}>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-zinc-900">{schedule.title}</p>
                        <p className="text-xs text-zinc-500">{schedule.group.name}</p>
                      </div>
                      <div className={cn(
                        'ml-4 flex shrink-0 items-center gap-1.5 text-xs font-medium',
                        overdue ? 'text-red-600' : 'text-zinc-500'
                      )}>
                        {overdue
                          ? <AlertCircle className="h-3.5 w-3.5" />
                          : <Clock className="h-3.5 w-3.5" />
                        }
                        {schedule.is_all_day
                          ? formatDate(schedule.deadline)
                          : formatDateTime(schedule.deadline)
                        }
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* My groups */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-zinc-900">参加中のグループ</h2>
          <Link href="/groups">
            <Button variant="ghost" size="sm">
              すべて表示 <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {groupsLoading ? (
          <PageLoader />
        ) : myGroups.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="mx-auto h-8 w-8 text-zinc-300 mb-2" />
              <p className="text-sm text-zinc-500">まだグループに参加していません。</p>
              <Link href="/groups/new" className="mt-3 inline-block">
                <Button size="sm">グループを作成</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myGroups.slice(0, 6).map((g) => (
              <GroupCard key={g.id} group={g} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

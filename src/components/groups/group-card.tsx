'use client'
import Link from 'next/link'
import { Lock, Users, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Group } from '@/types'

export function GroupCard({ group }: { group: Group }) {
  return (
    <Link href={`/groups/${group.id}`}>
      <Card className={cn(
        'group h-full cursor-pointer transition-all hover:shadow-md',
        group.is_member
          ? 'border-brand-200 hover:border-brand-400'
          : 'border-zinc-200 hover:border-zinc-300 opacity-75 hover:opacity-100'
      )}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-2">
            <h3 className={cn(
              'font-semibold transition-colors line-clamp-1',
              group.is_member
                ? 'text-zinc-900 group-hover:text-brand-700'
                : 'text-zinc-600 group-hover:text-zinc-900'
            )}>
              {group.name}
            </h3>
            <div className="flex shrink-0 gap-1">
              {group.is_private && (
                <Badge variant="private" className="flex items-center gap-1">
                  <Lock className="h-2.5 w-2.5" />
                  非公開
                </Badge>
              )}
            </div>
          </div>

          {group.description && (
            <p className="mt-1.5 text-sm text-zinc-500 line-clamp-2">{group.description}</p>
          )}

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Users className="h-3.5 w-3.5" />
              <span>
                {group.member_count}
                {group.max_members ? ` / ${group.max_members}` : ''} メンバー
              </span>
            </div>
            {group.is_member ? (
              <span className="flex items-center gap-1 text-xs font-medium text-brand-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                参加中
              </span>
            ) : (
              <span className="text-xs text-zinc-400">{formatDate(group.created_at)}</span>
            )}
          </div>

          <div className="mt-2 text-xs text-zinc-400">
            オーナー: <span className="text-zinc-600">{group.owner.nickname}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

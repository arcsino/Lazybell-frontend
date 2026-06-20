'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Copy, Check, Calendar, User as UserIcon } from 'lucide-react'
import { usersApi } from '@/lib/api/auth'
import { useAuth } from '@/contexts/auth-context'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PageLoader } from '@/components/ui/spinner'
import { Card, CardContent } from '@/components/ui/card'
import { getInitials, formatDate } from '@/lib/utils'

export default function UserProfilePage({ params }: { params: { userId: string } }) {
  const { userId } = params
  const { user: me } = useAuth()
  const [copiedId, setCopiedId] = useState(false)

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => usersApi.getUser(userId),
  })

  const copyId = async () => {
    await navigator.clipboard.writeText(userId)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  if (isLoading) return <PageLoader />

  if (isError || !user) {
    return (
      <div className="p-6 text-sm text-zinc-500">
        ユーザーが見つかりません。
      </div>
    )
  }

  const isMe = me?.id === user.id

  return (
    <div className="max-w-lg mx-auto p-6 space-y-4">
      <Card>
        <CardContent className="p-6">
          {/* Avatar & name */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 text-xl">
              <AvatarFallback>{getInitials(user.nickname)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-zinc-900">{user.nickname}</h1>
                {isMe && (
                  <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                    あなた
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {user.biography && (
            <p className="mt-4 text-sm text-zinc-600 whitespace-pre-wrap leading-relaxed">
              {user.biography}
            </p>
          )}

          {/* Meta */}
          <div className="mt-5 space-y-2.5 border-t border-zinc-100 pt-4">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>登録日: <span className="text-zinc-600">{formatDate(user.registered_at)}</span></span>
            </div>

            {/* User ID (for inviting) */}
            <div className="flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2">
              <UserIcon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
              <span className="text-xs text-zinc-400 shrink-0">ユーザーID:</span>
              <span className="flex-1 truncate font-mono text-xs text-zinc-600">{user.id}</span>
              <button
                onClick={copyId}
                title="コピー"
                className="shrink-0 rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-700"
              >
                {copiedId
                  ? <Check className="h-3.5 w-3.5 text-emerald-500" />
                  : <Copy className="h-3.5 w-3.5" />
                }
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

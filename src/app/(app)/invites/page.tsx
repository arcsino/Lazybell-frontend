'use client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Mail, Users, Check, X } from 'lucide-react'
import { invitesApi } from '@/lib/api/groups'
import { useToast } from '@/components/ui/toast'
import { extractApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/layout/page-header'
import { PageLoader } from '@/components/ui/spinner'
import { formatDateTime } from '@/lib/utils'

export default function InvitesPage() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const { data: invites = [], isLoading } = useQuery({
    queryKey: ['invites'],
    queryFn: invitesApi.list,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['invites'] })

  const handleAccept = async (inviteId: string, groupName: string) => {
    try {
      await invitesApi.accept(inviteId)
      invalidate()
      qc.invalidateQueries({ queryKey: ['groups'] })
      toast(`「${groupName}」に参加しました！`, 'success')
    } catch (err) { toast(extractApiError(err), 'error') }
  }

  const handleDecline = async (inviteId: string) => {
    try {
      await invitesApi.decline(inviteId)
      invalidate()
      toast('招待を辞退しました。', 'info')
    } catch (err) { toast(extractApiError(err), 'error') }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="招待"
        description="あなたへのグループ招待の一覧です。"
      />

      {isLoading ? (
        <PageLoader />
      ) : invites.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Mail className="mx-auto h-8 w-8 text-zinc-300 mb-2" />
            <p className="text-sm text-zinc-500">保留中の招待はありません。</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {invites.map((invite) => (
            <Card key={invite.id}>
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-zinc-900">{invite.group.name}</h3>
                      {invite.group.is_private && (
                        <Badge variant="private" className="text-xs">非公開</Badge>
                      )}
                    </div>
                    {invite.group.description && (
                      <p className="mt-0.5 text-sm text-zinc-500 line-clamp-1">{invite.group.description}</p>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {invite.group.member_count} メンバー
                      </span>
                      <span>招待者: {invite.invited_by.nickname}</span>
                      <span>{formatDateTime(invite.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleAccept(invite.id, invite.group.name)}
                    >
                      <Check className="h-3.5 w-3.5" /> 承認
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDecline(invite.id)}
                    >
                      <X className="h-3.5 w-3.5" /> 辞退
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

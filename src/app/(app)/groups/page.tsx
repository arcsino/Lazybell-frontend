'use client'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { groupsApi } from '@/lib/api/groups'
import { GroupCard } from '@/components/groups/group-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/layout/page-header'
import { PageLoader } from '@/components/ui/spinner'
import { Card, CardContent } from '@/components/ui/card'

export default function GroupsPage() {
  const [search, setSearch] = useState('')
  const { data: groups, isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: groupsApi.list,
  })

  const filtered = (groups?.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.description?.toLowerCase().includes(search.toLowerCase())
  ) ?? []).sort((a, b) => {
    if (a.is_member === b.is_member) return 0
    return a.is_member ? -1 : 1
  })

  const joinedGroups = filtered.filter((g) => g.is_member)
  const otherGroups = filtered.filter((g) => !g.is_member)

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="グループ"
        description="グループを管理して、チームと協力しましょう。"
        action={
          <Link href="/groups/new">
            <Button>
              <Plus className="h-4 w-4" />
              新規グループ
            </Button>
          </Link>
        }
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          className="pl-9"
          placeholder="グループを検索…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-sm text-zinc-500">
              {search ? '検索条件に合うグループはありません。' : 'グループが見つかりません。新しく作成してみましょう！'}
            </p>
            {!search && (
              <Link href="/groups/new" className="mt-3 inline-block">
                <Button size="sm">グループを作成</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {joinedGroups.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-zinc-500 uppercase tracking-wide">
                参加中のグループ ({joinedGroups.length})
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {joinedGroups.map((g) => (
                  <GroupCard key={g.id} group={g} />
                ))}
              </div>
            </section>
          )}
          {otherGroups.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-zinc-400 uppercase tracking-wide">
                その他のグループ ({otherGroups.length})
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {otherGroups.map((g) => (
                  <GroupCard key={g.id} group={g} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

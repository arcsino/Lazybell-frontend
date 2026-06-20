'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { groupsApi } from '@/lib/api/groups'
import { GroupForm } from '@/components/groups/group-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { extractApiError } from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'

export default function NewGroupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: {
    name: string; description?: string; is_private: boolean; max_members: number | null
  }) => {
    setLoading(true)
    try {
      const group = await groupsApi.create(data)
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast('グループを作成しました！', 'success')
      router.push(`/groups/${group.id}`)
    } catch (err) {
      toast(extractApiError(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" /> 戻る
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>グループを作成</CardTitle>
        </CardHeader>
        <CardContent>
          <GroupForm onSubmit={handleSubmit} loading={loading} />
        </CardContent>
      </Card>
    </div>
  )
}

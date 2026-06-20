'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Copy, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { usersApi } from '@/lib/api/auth'
import { useToast } from '@/components/ui/toast'
import { extractApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PageHeader } from '@/components/layout/page-header'
import { getInitials, formatDate } from '@/lib/utils'

const profileSchema = z.object({
  nickname: z.string().min(1, 'ニックネームを入力してください').max(150),
  biography: z.string().max(2000).optional(),
})

const passwordSchema = z.object({
  current_password: z.string().min(1, '現在のパスワードを入力してください'),
  new_password: z.string()
    .min(8, '8文字以上で入力してください')
    .regex(/[A-Za-z]/, '英字を含める必要があります')
    .regex(/[0-9]/, '数字を含める必要があります')
    .regex(/[!@#$%^&*()\-_=+\[\]{}|;:\'",.<>?/`~\\]/, '特殊文字を含める必要があります'),
})

type ProfileValues = z.infer<typeof profileSchema>
type PasswordValues = z.infer<typeof passwordSchema>

export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyUserId = async () => {
    await navigator.clipboard.writeText(user?.id ?? '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const {
    register: regProfile,
    handleSubmit: handleProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { nickname: user?.nickname ?? '', biography: user?.biography ?? '' },
  })

  const {
    register: regPassword,
    handleSubmit: handlePassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) })

  const onSaveProfile = async (values: ProfileValues) => {
    setProfileLoading(true)
    try {
      await usersApi.updateProfile(values)
      await refreshUser()
      toast('プロフィールを更新しました！', 'success')
    } catch (err) {
      toast(extractApiError(err), 'error')
    } finally { setProfileLoading(false) }
  }

  const onChangePassword = async (values: PasswordValues) => {
    setPasswordLoading(true)
    try {
      await usersApi.changePassword(values.current_password, values.new_password)
      await logout()
      router.push('/login')
    } catch (err) {
      toast(extractApiError(err), 'error')
      setPasswordLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <PageHeader title="プロフィール" description="アカウント設定を管理します。" />

      {/* Profile overview */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 text-lg">
              <AvatarFallback>{getInitials(user.nickname)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-zinc-900">{user.nickname}</p>
              <p className="text-sm text-zinc-500">@{user.username}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-zinc-400">
            <div>登録日: <span className="text-zinc-600">{formatDate(user.registered_at)}</span></div>
            <div>最終ログイン: <span className="text-zinc-600">{formatDate(user.last_login_at)}</span></div>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2">
            <span className="text-xs text-zinc-400 select-none">ユーザーID:</span>
            <span className="flex-1 truncate font-mono text-xs text-zinc-600">{user.id}</span>
            <button
              onClick={copyUserId}
              title="コピー"
              className="shrink-0 rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-700"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Edit profile */}
      <Card>
        <CardHeader><CardTitle>プロフィール編集</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleProfile(onSaveProfile)} className="space-y-4">
            <FormField label="ニックネーム" required error={profileErrors.nickname?.message}>
              <Input {...regProfile('nickname')} />
            </FormField>
            <FormField label="自己紹介" error={profileErrors.biography?.message}>
              <Textarea {...regProfile('biography')} rows={3} placeholder="自己紹介を入力…" />
            </FormField>
            <div className="flex justify-end">
              <Button type="submit" loading={profileLoading}>保存</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader><CardTitle>パスワード変更</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handlePassword(onChangePassword)} className="space-y-4">
            <FormField label="現在のパスワード" required error={passwordErrors.current_password?.message}>
              <Input {...regPassword('current_password')} type="password" autoComplete="current-password" />
            </FormField>
            <FormField label="新しいパスワード" required error={passwordErrors.new_password?.message}>
              <Input {...regPassword('new_password')} type="password" autoComplete="new-password" />
            </FormField>
            <div className="flex justify-end">
              <Button type="submit" loading={passwordLoading}>パスワードを変更</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

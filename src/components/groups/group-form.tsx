'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'
import type { Group } from '@/types'

const schema = z.object({
  name: z.string().min(1, 'グループ名を入力してください').max(255),
  description: z.string().max(2000).optional(),
  is_private: z.boolean(),
  max_members: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

interface GroupFormProps {
  defaultValues?: Partial<Group>
  onSubmit: (data: {
    name: string
    description?: string
    is_private: boolean
    max_members: number | null
  }) => Promise<void>
  submitLabel?: string
  loading?: boolean
}

export function GroupForm({ defaultValues, onSubmit, submitLabel = 'グループを作成', loading }: GroupFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      description: defaultValues?.description ?? '',
      is_private: defaultValues?.is_private ?? false,
      max_members: defaultValues?.max_members?.toString() ?? '',
    },
  })

  const handleFormSubmit = async (values: FormValues) => {
    const max = values.max_members ? parseInt(values.max_members, 10) : null
    await onSubmit({
      name: values.name,
      description: values.description || undefined,
      is_private: values.is_private,
      max_members: max && !isNaN(max) ? max : null,
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <FormField label="グループ名" required error={errors.name?.message}>
        <Input {...register('name')} placeholder="例：勉強グループ" />
      </FormField>

      <FormField label="説明" error={errors.description?.message}>
        <Textarea {...register('description')} placeholder="グループの説明を入力してください" rows={3} />
      </FormField>

      <div className="flex flex-col sm:flex-row gap-4">
        <FormField label="最大メンバー数" error={errors.max_members?.message} className="flex-1">
          <Input
            {...register('max_members')}
            type="number"
            min="1"
            placeholder="無制限"
          />
        </FormField>

        <div className="flex items-end gap-3 pb-0.5">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              {...register('is_private')}
              className="h-4 w-4 rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm font-medium text-zinc-700">非公開グループ</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={loading}>{submitLabel}</Button>
      </div>
    </form>
  )
}

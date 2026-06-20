'use client'
import { useEffect } from 'react'
import { useForm, Controller, FieldErrors } from 'react-hook-form'
import { useToast } from '@/components/ui/toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Schedule, Subject, Tag } from '@/types'

const schema = z.object({
  title: z.string().min(1, 'タイトルを入力してください').max(255),
  detail: z.string().max(5000).optional(),
  start_at: z.string().optional(),
  deadline: z.string().optional(),
  is_all_day: z.boolean(),
  subject_id: z.string().optional(),
  tag_ids: z.array(z.string()),
}).refine(data => {
  if (data.start_at && data.deadline) {
    return new Date(data.start_at) <= new Date(data.deadline)
  }
  return true
}, {
  message: '開始日時は終了日時より前に設定してください。',
  path: ['start_at'],
})
type FormValues = z.infer<typeof schema>

interface ScheduleFormProps {
  defaultValues?: Partial<Schedule>
  subjects: Subject[]
  tags: Tag[]
  onSubmit: (data: {
    title: string; detail?: string; start_at?: string | null
    deadline?: string | null; is_all_day: boolean
    subject_id?: string | null; tag_ids: string[]
  }) => Promise<void>
  submitLabel?: string
  loading?: boolean
}

function jstParts(iso: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date(iso))
  const v = (t: string) => parts.find(p => p.type === t)?.value ?? '00'
  return { year: v('year'), month: v('month'), day: v('day'), hour: v('hour') === '24' ? '00' : v('hour'), minute: v('minute') }
}

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  const { year, month, day, hour, minute } = jstParts(iso)
  return `${year}-${month}-${day}T${hour}:${minute}`
}

function toDateOnly(iso: string | null | undefined): string {
  if (!iso) return ''
  const { year, month, day } = jstParts(iso)
  return `${year}-${month}-${day}`
}

export function ScheduleForm({
  defaultValues, subjects, tags, onSubmit, submitLabel = '保存', loading,
}: ScheduleFormProps) {
  const { toast } = useToast()
  const {
    register, handleSubmit, control, watch, setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      detail: defaultValues?.detail ?? '',
      start_at: defaultValues?.is_all_day
        ? toDateOnly(defaultValues?.start_at)
        : toDatetimeLocal(defaultValues?.start_at),
      deadline: defaultValues?.is_all_day
        ? toDateOnly(defaultValues?.deadline)
        : toDatetimeLocal(defaultValues?.deadline),
      is_all_day: defaultValues?.is_all_day ?? false,
      subject_id: defaultValues?.subject?.id ?? '',
      tag_ids: defaultValues?.tags?.map((t) => t.id) ?? [],
    },
  })

  const isAllDay = watch('is_all_day')
  const selectedTagIds = watch('tag_ids')

  const toggleTag = (tagId: string) => {
    const current = selectedTagIds ?? []
    setValue(
      'tag_ids',
      current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId]
    )
  }

  const handleInvalid = (errs: FieldErrors<FormValues>) => {
    const msg = errs.start_at?.message ?? errs.deadline?.message ?? errs.title?.message
    if (msg) toast(msg, 'error')
  }

  const handleFormSubmit = async (values: FormValues) => {
    const toIso = (v?: string) => {
      if (!v) return null
      if (values.is_all_day) {
        // date input is YYYY-MM-DD → treat as JST midnight
        return new Date(v + 'T00:00:00+09:00').toISOString()
      }
      // datetime-local input is YYYY-MM-DDTHH:MM → treat as JST
      return new Date(v + ':00+09:00').toISOString()
    }
    await onSubmit({
      title: values.title,
      detail: values.detail || undefined,
      start_at: toIso(values.start_at),
      deadline: toIso(values.deadline),
      is_all_day: values.is_all_day,
      subject_id: values.subject_id || null,
      tag_ids: values.tag_ids,
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit, handleInvalid)} className="space-y-4">
      <FormField label="タイトル" required error={errors.title?.message}>
        <Input {...register('title')} placeholder="スケジュールのタイトル" />
      </FormField>

      <FormField label="詳細" error={errors.detail?.message}>
        <Textarea {...register('detail')} placeholder="詳細（任意）" rows={3} />
      </FormField>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="is_all_day" {...register('is_all_day')}
          className="h-4 w-4 rounded border-zinc-300 text-brand-600 focus:ring-brand-500" />
        <label htmlFor="is_all_day" className="text-sm font-medium text-zinc-700 cursor-pointer">
          終日イベント
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label={isAllDay ? '開始日' : '開始日時'}>
          <Input
            {...register('start_at')}
            type={isAllDay ? 'date' : 'datetime-local'}
          />
        </FormField>
        <FormField label={isAllDay ? '期限日' : '期限日時'}>
          <Input
            {...register('deadline')}
            type={isAllDay ? 'date' : 'datetime-local'}
          />
        </FormField>
      </div>

      {subjects.length > 0 && (
        <FormField label="科目">
          <Controller
            name="subject_id"
            control={control}
            render={({ field }) => (
              <Select value={field.value ?? ''} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="科目を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">科目なし</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
      )}

      {tags.length > 0 && (
        <FormField label="タグ">
          <div className="flex flex-wrap gap-2">
            {[...tags].sort((a, b) => a.priority - b.priority).map((tag) => {
              const selected = selectedTagIds?.includes(tag.id)
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all"
                  style={selected ? {
                    backgroundColor: tag.color,
                    borderColor: tag.color,
                    color: '#fff',
                  } : {
                    borderColor: tag.color,
                    backgroundColor: 'white',
                    color: '#3f3f46',
                  }}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: selected ? 'rgba(255,255,255,0.7)' : tag.color }}
                  />
                  #{tag.name}
                </button>
              )
            })}
          </div>
        </FormField>
      )}

      <div className="flex justify-end pt-2">
        <Button type="submit" loading={loading}>{submitLabel}</Button>
      </div>
    </form>
  )
}

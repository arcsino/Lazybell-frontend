'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
  addMonths, subMonths, addWeeks, subWeeks, addDays, subDays,
  format, parseISO, isAfter, isBefore,
  startOfDay, endOfDay, differenceInMinutes,
  max as dateMax, min as dateMin,
} from 'date-fns'
import { ja } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Filter, X } from 'lucide-react'
import { schedulesApi } from '@/lib/api/schedules'
import { groupsApi } from '@/lib/api/groups'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/layout/page-header'
import type { UpcomingSchedule } from '@/types'

type View = 'month' | 'week' | 'day'

const WEEK_DAYS = ['月', '火', '水', '木', '金', '土', '日']
const HOURS = Array.from({ length: 24 }, (_, i) => i)
const HOUR_PX = 64
const LANE_PX = 22
const WEEK_LANE_PX = 76
const DAY_NUM_PX = 28

// ── Helpers ───────────────────────────────────────────────────────────────────

function evStart(s: UpcomingSchedule): Date {
  return s.start_at ? parseISO(s.start_at) : parseISO(s.deadline)
}
function evEnd(s: UpcomingSchedule): Date {
  return parseISO(s.deadline)
}
function fmtDateTime(dt: Date): string {
  return format(dt, 'M/d H:mm')
}

function topPriority(s: UpcomingSchedule): number {
  if (!s.tags.length) return Infinity
  return Math.min(...s.tags.map(t => t.priority))
}

function topColor(s: UpcomingSchedule): string {
  if (!s.tags.length) return '#6B7280'
  return [...s.tags].sort((a, b) => a.priority - b.priority)[0].color
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

// ── Month/Week horizontal-bar layout ──────────────────────────────────────────

type WeekEvent = {
  s: UpcomingSchedule
  col0: number
  col1: number
  before: boolean
  after: boolean
  lane: number
}

function layoutWeek(schedules: UpcomingSchedule[], weekDays: Date[]): WeekEvent[] {
  const wkStart = startOfDay(weekDays[0])
  const wkEnd = endOfDay(weekDays[6])

  const spans: Omit<WeekEvent, 'lane'>[] = []
  for (const s of schedules) {
    const raw0 = evStart(s)
    const raw1 = evEnd(s)
    if (isAfter(raw0, wkEnd) || isBefore(raw1, wkStart)) continue

    const c0 = dateMax([raw0, wkStart])
    const c1 = dateMin([raw1, wkEnd])

    const col0 = weekDays.findIndex(d => isSameDay(d, c0))
    let col1 = -1
    for (let i = weekDays.length - 1; i >= 0; i--) {
      if (!isAfter(weekDays[i], c1)) { col1 = i; break }
    }
    if (col0 < 0 || col1 < 0 || col0 > col1) continue

    spans.push({ s, col0, col1, before: isBefore(raw0, wkStart), after: isAfter(raw1, wkEnd) })
  }

  spans.sort((a, b) =>
    a.col0 - b.col0 || (b.col1 - b.col0) - (a.col1 - a.col0) || topPriority(a.s) - topPriority(b.s)
  )

  const laneEnd: number[] = []
  return spans.map(sp => {
    let lane = 0
    while (laneEnd[lane] !== undefined && laneEnd[lane] >= sp.col0) lane++
    laneEnd[lane] = sp.col1
    return { ...sp, lane }
  })
}

// ── Day time-grid layout ──────────────────────────────────────────────────────

type DayEvent = {
  s: UpcomingSchedule
  top: number
  height: number
  col: number
  totalCols: number
  startLabel: string
  endLabel: string
}

function layoutDay(schedules: UpcomingSchedule[], day: Date): DayEvent[] {
  const dayStart = startOfDay(day)
  const dayEnd = endOfDay(day)

  type Raw = { s: UpcomingSchedule; startMin: number; endMin: number; startLabel: string; endLabel: string }
  const raw: Raw[] = []

  for (const s of schedules) {
    if (s.is_all_day) continue
    const dl = parseISO(s.deadline)
    const st = s.start_at ? parseISO(s.start_at) : dl
    if (isAfter(st, dayEnd) || isBefore(dl, dayStart)) continue

    const cs = dateMax([st, dayStart])
    const ce = dateMin([dl, dayEnd])
    const startMin = differenceInMinutes(cs, dayStart)
    const rawEnd = differenceInMinutes(ce, dayStart)
    const endMin = Math.max(rawEnd, startMin + 30)

    raw.push({
      s,
      startMin,
      endMin,
      startLabel: s.start_at ? fmtDateTime(st) : '',
      endLabel: fmtDateTime(dl),
    })
  }

  raw.sort((a, b) =>
    a.startMin - b.startMin || b.endMin - a.endMin || topPriority(a.s) - topPriority(b.s)
  )

  const colEnds: number[] = []
  const assignments: { r: Raw; col: number }[] = []

  for (const r of raw) {
    let col = 0
    while (colEnds[col] !== undefined && colEnds[col] > r.startMin) col++
    colEnds[col] = r.endMin
    assignments.push({ r, col })
  }

  return assignments.map(({ r, col }) => {
    const totalCols = assignments
      .filter(a => a.r.startMin < r.endMin && a.r.endMin > r.startMin)
      .reduce((m, a) => Math.max(m, a.col + 1), 1)
    return {
      s: r.s,
      top: (r.startMin / 60) * HOUR_PX,
      height: ((r.endMin - r.startMin) / 60) * HOUR_PX,
      col,
      totalCols,
      startLabel: r.startLabel,
      endLabel: r.endLabel,
    }
  })
}

// ── Shared event-bar renderer (month & week) ──────────────────────────────────

function EventBar({ ev, topPx, cols7, laneH = LANE_PX }: { ev: WeekEvent; topPx: number; cols7: number; laneH?: number }) {
  const span = ev.col1 - ev.col0 + 1
  const color = topColor(ev.s)
  const expanded = laneH >= WEEK_LANE_PX

  const timeLabel = !ev.s.is_all_day
    ? ev.s.start_at
      ? `${format(parseISO(ev.s.start_at), 'H:mm')} 〜 ${format(parseISO(ev.s.deadline), 'H:mm')}`
      : format(parseISO(ev.s.deadline), 'H:mm')
    : null

  return (
    <Link
      href={`/groups/${ev.s.group.id}/schedules/${ev.s.id}`}
      onClick={e => e.stopPropagation()}
      className="absolute z-10"
      style={{
        top: topPx,
        left: `calc(${(ev.col0 / cols7) * 100}% + 2px)`,
        width: `calc(${(span / cols7) * 100}% - 4px)`,
        height: laneH - 3,
      }}
    >
      <div
        className={cn(
          'flex h-full overflow-hidden px-1.5 text-xs transition-opacity hover:opacity-80',
          expanded ? 'flex-col justify-start gap-0.5 pt-1.5' : 'items-center',
          ev.before ? 'rounded-r rounded-l-none' : ev.after ? 'rounded-l rounded-r-none' : 'rounded',
        )}
        style={{
          backgroundColor: hexToRgba(color, 0.15),
          borderLeft: ev.before ? undefined : `3px solid ${color}`,
          color,
        }}
      >
        <p className="truncate font-semibold leading-tight">
          {ev.before && <span className="mr-0.5 opacity-50">‹</span>}
          {ev.s.title}
          {ev.after && <span className="ml-0.5 opacity-50">›</span>}
        </p>
        {expanded && timeLabel && (
          <p className="truncate opacity-75" style={{ fontSize: 10, lineHeight: '13px' }}>{timeLabel}</p>
        )}
        {expanded && ev.s.subject && (
          <p className="truncate opacity-70" style={{ fontSize: 10, lineHeight: '13px' }}>{ev.s.subject.name}</p>
        )}
        {expanded && (
          <p className="truncate opacity-60" style={{ fontSize: 10, lineHeight: '13px', paddingBottom: 3 }}>{ev.s.group.name}</p>
        )}
      </div>
    </Link>
  )
}

// ── FilterSidebar ─────────────────────────────────────────────────────────────

function FilterSidebar({
  groups, sel, onToggleAll, onToggle,
}: {
  groups: { id: string; name: string }[]
  sel: 'all' | Set<string>
  onToggleAll: () => void
  onToggle: (id: string) => void
}) {
  const allSel = sel === 'all'
  const isSel = (id: string) => allSel || (sel as Set<string>).has(id)
  return (
    <aside className="w-44 shrink-0">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">グループ</p>
      <ul className="space-y-0.5">
        <li>
          <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-zinc-100">
            <input type="checkbox" checked={allSel} onChange={onToggleAll} className="h-3.5 w-3.5 accent-brand-600" />
            <span className="text-sm font-medium text-zinc-700">全て</span>
          </label>
        </li>
        {groups.map(g => (
          <li key={g.id}>
            <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-zinc-100">
              <input type="checkbox" checked={isSel(g.id)} onChange={() => onToggle(g.id)} className="h-3.5 w-3.5 accent-brand-600" />
              <span className="truncate text-sm text-zinc-600">{g.name}</span>
            </label>
          </li>
        ))}
      </ul>
    </aside>
  )
}

// ── Month view ────────────────────────────────────────────────────────────────

function MonthView({
  currentDate, schedules, onDayClick,
}: {
  currentDate: Date
  schedules: UpcomingSchedule[]
  onDayClick: (d: Date) => void
}) {
  const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
  const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
  const allDays = eachDayOfInterval({ start, end })
  const weeks: Date[][] = []
  for (let i = 0; i < allDays.length; i += 7) weeks.push(allDays.slice(i, i + 7))

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200">
      <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50">
        {WEEK_DAYS.map(d => (
          <div key={d} className="py-2 text-center text-xs font-medium text-zinc-500">{d}</div>
        ))}
      </div>
      {weeks.map((week, wi) => {
        const layout = layoutWeek(schedules, week)
        const maxLane = layout.reduce((m, e) => Math.max(m, e.lane), -1)
        const rowH = DAY_NUM_PX + Math.max((maxLane + 1) * LANE_PX + 6, 44)
        return (
          <div key={wi} className="relative border-b border-zinc-100 last:border-b-0" style={{ height: rowH }}>
            <div className="absolute inset-0 grid grid-cols-7">
              {week.map((day, col) => (
                <div
                  key={col}
                  onClick={() => onDayClick(day)}
                  className={cn(
                    'cursor-pointer border-r border-zinc-100 px-1.5 pt-1 last:border-r-0 transition-colors hover:bg-zinc-50',
                    !isSameMonth(day, currentDate) && 'bg-zinc-50/70',
                  )}
                >
                  <span className={cn(
                    'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs',
                    isToday(day) ? 'bg-brand-600 font-semibold text-white'
                      : isSameMonth(day, currentDate) ? 'text-zinc-700' : 'text-zinc-300',
                  )}>
                    {format(day, 'd')}
                  </span>
                </div>
              ))}
            </div>
            {layout.map((ev, i) => (
              <EventBar key={`${ev.s.id}-${i}`} ev={ev} topPx={DAY_NUM_PX + ev.lane * LANE_PX + 2} cols7={7} />
            ))}
          </div>
        )
      })}
    </div>
  )
}

// ── Week view (horizontal bars, no time grid) ─────────────────────────────────

function WeekView({
  weekDays, schedules, onDayClick,
}: {
  weekDays: Date[]
  schedules: UpcomingSchedule[]
  onDayClick: (d: Date) => void
}) {
  const layout = layoutWeek(schedules, weekDays)
  const maxLane = layout.reduce((m, e) => Math.max(m, e.lane), -1)
  const bodyH = Math.max((maxLane + 1) * WEEK_LANE_PX + 20, 60)

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50">
        {weekDays.map(day => (
          <div
            key={day.toISOString()}
            onClick={() => onDayClick(day)}
            className={cn(
              'cursor-pointer border-r border-zinc-100 py-2.5 text-center last:border-r-0 hover:bg-zinc-100 transition-colors',
              isToday(day) && 'bg-brand-50',
            )}
          >
            <p className="text-xs font-medium text-zinc-500">{format(day, 'E', { locale: ja })}</p>
            <p className={cn(
              'mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold',
              isToday(day) ? 'bg-brand-600 text-white' : 'text-zinc-700',
            )}>
              {format(day, 'd')}
            </p>
          </div>
        ))}
      </div>

      {/* Event bar area */}
      <div className="relative" style={{ height: bodyH }}>
        <div className="pointer-events-none absolute inset-0 grid grid-cols-7">
          {weekDays.map((_, i) => (
            <div key={i} className="border-r border-zinc-100 last:border-r-0" />
          ))}
        </div>
        {layout.map((ev, i) => (
          <EventBar key={`${ev.s.id}-${i}`} ev={ev} topPx={ev.lane * WEEK_LANE_PX + 10} cols7={7} laneH={WEEK_LANE_PX} />
        ))}
      </div>
    </div>
  )
}

// ── Day view (time grid with overlap handling) ────────────────────────────────

function DayView({ day, schedules }: { day: Date; schedules: UpcomingSchedule[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!scrollRef.current) return
    const now = new Date()
    const targetHour = isToday(day) ? now.getHours() + now.getMinutes() / 60 : 8
    scrollRef.current.scrollTop = Math.max(0, (targetHour - 2) * HOUR_PX)
  }, [day])

  const allDayEvents = schedules.filter(s => {
    if (!s.is_all_day) return false
    const st = evStart(s)
    const dl = evEnd(s)
    return !isAfter(st, endOfDay(day)) && !isBefore(dl, startOfDay(day))
  })

  const timedEvents = layoutDay(schedules, day)

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200">
      {/* All-day section */}
      {allDayEvents.length > 0 && (
        <div className="flex border-b border-zinc-200">
          <div className="flex w-12 shrink-0 items-start justify-end border-r border-zinc-100 pr-1 pt-1.5">
            <span className="text-xs text-zinc-400">終日</span>
          </div>
          <div className="flex-1 space-y-0.5 p-1">
            {allDayEvents.map(s => (
              <Link key={s.id} href={`/groups/${s.group.id}/schedules/${s.id}`}>
                <div
                  className="truncate rounded px-1.5 py-0.5 text-xs transition-opacity hover:opacity-80"
                  style={{
                    backgroundColor: hexToRgba(topColor(s), 0.15),
                    borderLeft: `3px solid ${topColor(s)}`,
                    color: topColor(s),
                  }}
                >
                  {s.title}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Scrollable 24-hour grid */}
      <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: 600 }}>
        <div className="relative" style={{ height: HOUR_PX * 24 }}>
          {/* Hour lines */}
          {HOURS.map(h => (
            <div
              key={h}
              className="pointer-events-none absolute inset-x-0 border-t border-zinc-100"
              style={{ top: h * HOUR_PX }}
            >
              <span
                className="absolute left-0 w-11 pr-1.5 text-right text-xs leading-none text-zinc-400"
                style={{ top: -8 }}
              >
                {h > 0 ? `${h}:00` : ''}
              </span>
            </div>
          ))}

          {/* Event blocks */}
          <div className="absolute inset-y-0" style={{ left: 48, right: 0 }}>
            {timedEvents.map(({ s, top, height, col, totalCols, startLabel, endLabel }) => (
              <Link
                key={s.id}
                href={`/groups/${s.group.id}/schedules/${s.id}`}
                className="absolute z-10"
                style={{
                  top: top + 1,
                  height: Math.max(height - 2, 20),
                  left: `calc(${(col / totalCols) * 100}% + 1px)`,
                  width: `calc(${(1 / totalCols) * 100}% - 2px)`,
                }}
              >
                {(() => {
                  const color = topColor(s)
                  return (
                    <div
                      className="flex h-full flex-col overflow-hidden rounded px-1.5 py-1 text-xs transition-opacity hover:opacity-80"
                      style={{
                        backgroundColor: hexToRgba(color, 0.12),
                        borderLeft: `3px solid ${color}`,
                        borderTop: `1px solid ${hexToRgba(color, 0.3)}`,
                        borderRight: `1px solid ${hexToRgba(color, 0.3)}`,
                        borderBottom: `1px solid ${hexToRgba(color, 0.3)}`,
                        color,
                      }}
                    >
                      {startLabel && (
                        <p className="shrink-0 font-medium leading-tight opacity-70">{startLabel}</p>
                      )}
                      <p className="truncate font-medium leading-tight">{s.title}</p>
                      {height >= 52 && (
                        <p className="mt-auto shrink-0 leading-tight opacity-70">{endLabel}</p>
                      )}
                    </div>
                  )
                })()}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const [view, setView] = useState<View>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [sel, setSel] = useState<'all' | Set<string>>('all')
  const [filterOpen, setFilterOpen] = useState(false)

  const { data: schedules = [] } = useQuery({
    queryKey: ['upcoming-schedules'],
    queryFn: schedulesApi.upcoming,
  })

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: groupsApi.list,
  })

  const myGroups = useMemo(
    () => groups.filter(g => g.is_member).map(g => ({ id: g.id, name: g.name })),
    [groups],
  )

  const filtered = useMemo(
    () => sel === 'all' ? schedules : schedules.filter(s => (sel as Set<string>).has(s.group.id)),
    [schedules, sel],
  )

  const weekDays = useMemo(() => {
    const s = startOfWeek(currentDate, { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) => addDays(s, i))
  }, [currentDate])

  const navigate = (dir: 1 | -1) => {
    setCurrentDate(d => {
      if (view === 'month') return dir === 1 ? addMonths(d, 1) : subMonths(d, 1)
      if (view === 'week')  return dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1)
      return dir === 1 ? addDays(d, 1) : subDays(d, 1)
    })
  }

  const headerTitle = () => {
    if (view === 'month') return format(currentDate, 'yyyy年M月', { locale: ja })
    if (view === 'week') {
      const s = startOfWeek(currentDate, { weekStartsOn: 1 })
      const e = endOfWeek(currentDate, { weekStartsOn: 1 })
      return `${format(s, 'M月d日')} 〜 ${format(e, 'M月d日')}`
    }
    return format(currentDate, 'yyyy年M月d日', { locale: ja })
  }

  const handleToggleAll = () =>
    setSel(s => s === 'all' ? new Set<string>() : 'all')

  const handleToggle = (id: string) => {
    setSel(s => {
      if (s === 'all') {
        const next = new Set(myGroups.map(g => g.id).filter(gid => gid !== id))
        return next.size === 0 ? new Set<string>() : next
      }
      const next = new Set(s as Set<string>)
      next.has(id) ? next.delete(id) : next.add(id)
      return next.size === myGroups.length ? 'all' : next
    })
  }

  const viewLabel = { month: '月', week: '週', day: '日' } as const

  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="カレンダー" description="スケジュールをカレンダーで確認します。" />

      {/* Mobile filter drawer backdrop */}
      {filterOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setFilterOpen(false)}
        />
      )}

      {/* Mobile filter drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-60 overflow-y-auto bg-white p-5 shadow-xl transition-transform duration-200 lg:hidden',
          filterOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-zinc-700">グループ絞り込み</p>
          <button
            onClick={() => setFilterOpen(false)}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <FilterSidebar
          groups={myGroups}
          sel={sel}
          onToggleAll={handleToggleAll}
          onToggle={handleToggle}
        />
      </div>

      <div className="mt-6 flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden w-44 shrink-0 lg:block">
          <FilterSidebar
            groups={myGroups}
            sel={sel}
            onToggleAll={handleToggleAll}
            onToggle={handleToggle}
          />
        </aside>

        <div className="min-w-0 flex-1">
          {/* Controls */}
          <div className="mb-4 space-y-2">
            {/* Navigation row */}
            <div className="flex items-center gap-1">
              {/* Mobile filter button */}
              <button
                onClick={() => setFilterOpen(true)}
                className="rounded-lg border border-zinc-200 p-1.5 text-zinc-600 transition-colors hover:bg-zinc-100 lg:hidden"
              >
                <Filter className="h-4 w-4" />
              </button>

              <button
                onClick={() => navigate(-1)}
                className="rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-zinc-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="flex-1 text-center text-sm font-semibold text-zinc-800 sm:flex-none sm:min-w-48 sm:text-base">
                {headerTitle()}
              </span>
              <button
                onClick={() => navigate(1)}
                className="rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-zinc-100"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
              >
                今日
              </button>

              {/* View selector — desktop only */}
              <div className="ml-auto hidden overflow-hidden rounded-lg border border-zinc-200 sm:flex">
                {(['month', 'week', 'day'] as View[]).map(v => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={cn(
                      'px-4 py-1.5 text-sm font-medium transition-colors',
                      view === v ? 'bg-brand-600 text-white' : 'text-zinc-600 hover:bg-zinc-50',
                    )}
                  >
                    {viewLabel[v]}
                  </button>
                ))}
              </div>
            </div>

            {/* View selector — mobile only */}
            <div className="flex overflow-hidden rounded-lg border border-zinc-200 sm:hidden">
              {(['month', 'week', 'day'] as View[]).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    'flex-1 py-1.5 text-sm font-medium transition-colors',
                    view === v ? 'bg-brand-600 text-white' : 'text-zinc-600 hover:bg-zinc-50',
                  )}
                >
                  {viewLabel[v]}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar views */}
          <div className="overflow-x-auto">
            {view === 'month' && (
              <MonthView
                currentDate={currentDate}
                schedules={filtered}
                onDayClick={d => { setCurrentDate(d); setView('day') }}
              />
            )}
            {view === 'week' && (
              <WeekView
                weekDays={weekDays}
                schedules={filtered}
                onDayClick={d => { setCurrentDate(d); setView('day') }}
              />
            )}
            {view === 'day' && (
              <DayView day={currentDate} schedules={filtered} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

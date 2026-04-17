'use client'

import { useMemo, useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Plus, Trash2, ChevronLeft, ChevronRight, MapPin, Clock, ChevronDown } from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'
import type { Company, Trip, TripTimelineEntry } from '@/types/database'

type TripWithDetails = Trip & {
  companies: Pick<Company, 'id' | 'name'> | null
  trip_timeline_entries: TripTimelineEntry[] | null
}

type TimelineEntry = {
  id?: string
  tempId?: string
  trip_id?: string
  entry_date: string
  entry_time: string
  title: string
  location: string | null
  notes: string | null
  sort_order: number
  created_at?: string
}

type CompanyOption = Pick<Company, 'id' | 'name'>
type CalendarView = 'day' | 'week' | 'month'

interface TripManagerProps {
  companies: CompanyOption[]
  initialTrips: TripWithDetails[]
}

const HOUR_HEIGHT = 64
const HOURS = Array.from({ length: 24 }, (_, i) => i)
const WEEK_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const PALETTE = [
  { bg: 'bg-blue-50', border: 'border-l-blue-400', text: 'text-blue-900', sub: 'text-blue-600', dot: 'bg-blue-500', col: 'bg-blue-50/40', spanBg: 'bg-blue-100', spanText: 'text-blue-800', spanBorder: 'border-blue-200' },
  { bg: 'bg-violet-50', border: 'border-l-violet-400', text: 'text-violet-900', sub: 'text-violet-600', dot: 'bg-violet-500', col: 'bg-violet-50/40', spanBg: 'bg-violet-100', spanText: 'text-violet-800', spanBorder: 'border-violet-200' },
  { bg: 'bg-emerald-50', border: 'border-l-emerald-400', text: 'text-emerald-900', sub: 'text-emerald-600', dot: 'bg-emerald-500', col: 'bg-emerald-50/40', spanBg: 'bg-emerald-100', spanText: 'text-emerald-800', spanBorder: 'border-emerald-200' },
  { bg: 'bg-amber-50', border: 'border-l-amber-400', text: 'text-amber-900', sub: 'text-amber-600', dot: 'bg-amber-500', col: 'bg-amber-50/40', spanBg: 'bg-amber-100', spanText: 'text-amber-800', spanBorder: 'border-amber-200' },
  { bg: 'bg-rose-50', border: 'border-l-rose-400', text: 'text-rose-900', sub: 'text-rose-600', dot: 'bg-rose-500', col: 'bg-rose-50/40', spanBg: 'bg-rose-100', spanText: 'text-rose-800', spanBorder: 'border-rose-200' },
  { bg: 'bg-indigo-50', border: 'border-l-indigo-400', text: 'text-indigo-900', sub: 'text-indigo-600', dot: 'bg-indigo-500', col: 'bg-indigo-50/40', spanBg: 'bg-indigo-100', spanText: 'text-indigo-800', spanBorder: 'border-indigo-200' },
]

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return d
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function toKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function formatHour(h: number): string {
  if (h === 0) return '12 AM'
  if (h < 12) return `${h} AM`
  if (h === 12) return '12 PM'
  return `${h - 12} PM`
}

function buildMonthGrid(base: Date): Date[] {
  const first = new Date(base.getFullYear(), base.getMonth(), 1)
  const startDay = first.getDay()
  const offset = startDay === 0 ? -6 : 1 - startDay
  return Array.from({ length: 42 }, (_, i) => addDays(first, offset + i))
}

const makeNewEntry = (sort: number, date: string): TimelineEntry => ({
  tempId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  entry_date: date,
  entry_time: '09:00',
  title: '',
  location: null,
  notes: null,
  sort_order: sort,
  id: '',
})

export default function TripManager({ companies, initialTrips }: TripManagerProps) {
  const supabase = createClient()
  const scrollRef = useRef<HTMLDivElement>(null)

  const [trips, setTrips] = useState<TripWithDetails[]>(
    initialTrips.map((t) => ({ ...t, trip_timeline_entries: t.trip_timeline_entries ?? [] }))
  )
  const [view, setView] = useState<CalendarView>('week')
  const [currentDate, setCurrentDate] = useState(() => new Date())

  // Create modal
  const [createOpen, setCreateOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCompanyId, setNewCompanyId] = useState('')
  const [newDeparture, setNewDeparture] = useState(() => new Date().toISOString().slice(0, 10))
  const [newReturn, setNewReturn] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10)
  })
  const [newNotes, setNewNotes] = useState('')
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)
  const [addFirstEntry, setAddFirstEntry] = useState(false)
  const [firstEntryTitle, setFirstEntryTitle] = useState('')
  const [firstEntryTime, setFirstEntryTime] = useState('09:00')
  const [firstEntryLocation, setFirstEntryLocation] = useState('')

  // Edit modal
  const [editOpen, setEditOpen] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<TripWithDetails | null>(null)
  const [modalDep, setModalDep] = useState('')
  const [modalRet, setModalRet] = useState('')
  const [modalNotes, setModalNotes] = useState('')
  const [entries, setEntries] = useState<TimelineEntry[]>([])
  const [expandedEntries, setExpandedEntries] = useState<Set<number>>(new Set())
  const [deletedIds, setDeletedIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Quick-add
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [quickAddDate, setQuickAddDate] = useState('')
  const [quickAddTime, setQuickAddTime] = useState('')
  const [quickAddTitle, setQuickAddTitle] = useState('')
  const [quickAddTripId, setQuickAddTripId] = useState('')
  const [quickAddLocation, setQuickAddLocation] = useState('')
  const [quickAdding, setQuickAdding] = useState(false)
  const [quickAddError, setQuickAddError] = useState('')

  const todayKey = toKey(new Date())

  const colorMap = useMemo(() => {
    const m = new Map<string, number>()
    trips.forEach((t, i) => m.set(t.id, i))
    return m
  }, [trips])

  const activeTrip = useMemo(
    () => trips.find((t) => todayKey >= t.departure_date && todayKey <= t.return_date) ?? null,
    [trips, todayKey]
  )

  const eventsByDate = useMemo(() => {
    const m = new Map<string, Array<{ entry: TripTimelineEntry; trip: TripWithDetails; ci: number }>>()
    trips.forEach((trip) => {
      const ci = colorMap.get(trip.id) ?? 0
      trip.trip_timeline_entries?.forEach((entry) => {
        const key = entry.entry_date || trip.departure_date
        const list = m.get(key) ?? []
        list.push({ entry, trip, ci })
        m.set(key, list)
      })
    })
    m.forEach((list) => list.sort((a, b) => a.entry.entry_time.localeCompare(b.entry.entry_time)))
    return m
  }, [trips, colorMap])

  const weekDays = useMemo(() => {
    const start = getWeekStart(currentDate)
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }, [currentDate])

  const monthGrid = useMemo(() => buildMonthGrid(currentDate), [currentDate])

  const navLabel = useMemo(() => {
    if (view === 'day')
      return currentDate.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    if (view === 'week') {
      const s = getWeekStart(currentDate)
      const e = addDays(s, 6)
      return `${s.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', year: 'numeric' })}`
    }
    return currentDate.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })
  }, [view, currentDate])

  useEffect(() => {
    if ((view === 'week' || view === 'day') && scrollRef.current) {
      scrollRef.current.scrollTop = 7 * HOUR_HEIGHT - 16
    }
  }, [view])

  function navigate(dir: 'prev' | 'next') {
    const d = new Date(currentDate)
    const n = dir === 'next' ? 1 : -1
    if (view === 'day') d.setDate(d.getDate() + n)
    else if (view === 'week') d.setDate(d.getDate() + n * 7)
    else d.setMonth(d.getMonth() + n)
    setCurrentDate(d)
  }

  function openCreate() {
    setCreateError('')
    setNewTitle('')
    setNewCompanyId('')
    const now = new Date()
    setNewDeparture(now.toISOString().slice(0, 10))
    const late = new Date(now); late.setDate(late.getDate() + 1)
    setNewReturn(late.toISOString().slice(0, 10))
    setNewNotes('')
    setAddFirstEntry(false)
    setFirstEntryTitle('')
    setFirstEntryTime('09:00')
    setFirstEntryLocation('')
    setCreateOpen(true)
  }

  async function handleCreate() {
    setCreateError('')
    if (!newTitle.trim()) return setCreateError('Trip title is required.')
    if (newReturn < newDeparture) return setCreateError('Return must be on or after departure.')
    setCreating(true)
    const { data, error } = await supabase
      .from('trips')
      .insert({ title: newTitle, company_id: newCompanyId || null, departure_date: newDeparture, return_date: newReturn, notes: newNotes || null })
      .select('*, companies(id, name), trip_timeline_entries(*)')
      .single()
    if (error || !data) { setCreating(false); return setCreateError(error?.message ?? 'Unable to create trip.') }
    if (addFirstEntry && firstEntryTitle.trim()) {
      await supabase.from('trip_timeline_entries').insert({
        trip_id: data.id, entry_date: newDeparture, entry_time: firstEntryTime,
        title: firstEntryTitle, location: firstEntryLocation || null, notes: null, sort_order: 0,
      })
      const { data: fresh } = await supabase.from('trips').select('*, companies(id, name), trip_timeline_entries(*)').eq('id', data.id).single()
      setTrips((s) => [{ ...(fresh ?? data), trip_timeline_entries: fresh?.trip_timeline_entries ?? [] }, ...s])
    } else {
      setTrips((s) => [{ ...data, trip_timeline_entries: [] }, ...s])
    }
    setCreating(false)
    setCreateOpen(false)
  }

  function openEdit(trip: TripWithDetails) {
    setSelectedTrip(trip)
    setModalDep(trip.departure_date)
    setModalRet(trip.return_date)
    setModalNotes(trip.notes ?? '')
    setEntries((trip.trip_timeline_entries ?? []).map((e) => ({ ...e })))
    setExpandedEntries(new Set())
    setDeletedIds([])
    setSaveError('')
    setEditOpen(true)
  }

  function closeEdit() { setEditOpen(false); setSelectedTrip(null); setSaveError('') }

  function changeEntry(i: number, field: keyof TimelineEntry, val: string) {
    setEntries((curr) => curr.map((e, idx) => idx === i ? { ...e, [field]: val } : e))
  }

  function toggleExpandEntry(i: number) {
    setExpandedEntries(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  function addEntry() {
    setEntries((curr) => [...curr, { ...makeNewEntry(curr.length, selectedTrip?.departure_date ?? todayKey), id: '' }])
  }

  function removeEntry(i: number) {
    setEntries((curr) => {
      const e = curr[i]
      if (e?.id) setDeletedIds((ids) => [...ids, e.id!])
      return curr.filter((_, idx) => idx !== i)
    })
  }

  async function handleSave() {
    if (!selectedTrip) return
    setSaveError('')
    setSaving(true)
    const { error: te } = await supabase.from('trips').update({ departure_date: modalDep, return_date: modalRet, notes: modalNotes || null }).eq('id', selectedTrip.id)
    if (te) { setSaving(false); setSaveError(te.message); return }
    if (deletedIds.length > 0) await supabase.from('trip_timeline_entries').delete().in('id', deletedIds)
    await Promise.all(entries.map((e, i) => {
      const p = { trip_id: selectedTrip.id, entry_date: e.entry_date, entry_time: e.entry_time, title: e.title, location: e.location || null, notes: e.notes || null, sort_order: i }
      return e.id
        ? supabase.from('trip_timeline_entries').update(p).eq('id', e.id)
        : supabase.from('trip_timeline_entries').insert(p)
    }))
    const { data: fresh, error: re } = await supabase.from('trips').select('*, companies(id, name), trip_timeline_entries(*)').eq('id', selectedTrip.id).single()
    setSaving(false)
    if (re || !fresh) { setSaveError(re?.message ?? 'Could not reload trip.'); return }
    setTrips((s) => s.map((t) => t.id === fresh.id ? { ...fresh, trip_timeline_entries: fresh.trip_timeline_entries ?? [] } : t))
    closeEdit()
  }

  async function handleDelete(tripId: string) {
    setDeleteError('')
    setDeleting(true)
    const { error } = await supabase.from('trips').delete().eq('id', tripId)
    setDeleting(false)
    if (error) { setDeleteError(error.message); return }
    setTrips((s) => s.filter((t) => t.id !== tripId))
    if (selectedTrip?.id === tripId) closeEdit()
  }

  function handleTimeSlotClick(day: Date, hour: number) {
    if (trips.length === 0) { openCreate(); return }
    const key = toKey(day)
    const spanningTrip = trips.find(t => key >= t.departure_date && key <= t.return_date)
    setQuickAddDate(key)
    setQuickAddTime(`${String(Math.min(hour, 23)).padStart(2, '0')}:00`)
    setQuickAddTitle('')
    setQuickAddLocation('')
    setQuickAddError('')
    setQuickAddTripId(spanningTrip?.id ?? trips[0].id)
    setQuickAddOpen(true)
  }

  async function handleQuickAdd() {
    if (!quickAddTitle.trim()) { setQuickAddError('Title is required.'); return }
    setQuickAdding(true)
    setQuickAddError('')
    const { data, error } = await supabase
      .from('trip_timeline_entries')
      .insert({ trip_id: quickAddTripId, entry_date: quickAddDate, entry_time: quickAddTime, title: quickAddTitle, location: quickAddLocation || null, notes: null, sort_order: 0 })
      .select()
      .single()
    setQuickAdding(false)
    if (error || !data) { setQuickAddError(error?.message ?? 'Could not save entry.'); return }
    setTrips(prev => prev.map(t =>
      t.id === quickAddTripId
        ? { ...t, trip_timeline_entries: [...(t.trip_timeline_entries ?? []), data] }
        : t
    ))
    setQuickAddOpen(false)
  }

  // ── Render helpers ──────────────────────────────────────────────────────────

  function EventBlock({ entry, trip, ci }: { entry: TripTimelineEntry; ci: number; trip: TripWithDetails }) {
    const [h, m] = entry.entry_time.split(':').map(Number)
    const topPx = (h + m / 60) * HOUR_HEIGHT
    const pal = PALETTE[ci % PALETTE.length]
    return (
      <button
        type="button"
        data-event="true"
        onClick={() => openEdit(trip)}
        className={cn(
          'absolute left-1 right-1 rounded-lg border-l-4 px-2 py-1.5 text-left text-xs cursor-pointer transition-shadow hover:shadow-md overflow-hidden z-10',
          pal.bg, pal.border, pal.text
        )}
        style={{ top: topPx + 1, height: HOUR_HEIGHT - 4, minHeight: 44 }}
      >
        <p className="font-semibold truncate leading-tight">{entry.title}</p>
        <div className={cn('flex items-center gap-1 mt-0.5', pal.sub)}>
          <Clock className="w-3 h-3 shrink-0" />
          <span className="truncate text-[10px]">{entry.entry_time}</span>
        </div>
        {entry.location && (
          <div className={cn('flex items-center gap-1 mt-0.5', pal.sub)}>
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate text-[10px]">{entry.location}</span>
          </div>
        )}
      </button>
    )
  }

  function TimeColumn() {
    return (
      <div className="relative select-none" style={{ height: 24 * HOUR_HEIGHT }}>
        {HOURS.map((h) => (
          <div
            key={h}
            className="absolute w-full cursor-pointer transition-colors duration-200 hover:bg-slate-50"
            style={{ top: h * HOUR_HEIGHT }}
          >
            {h > 0 && (
              <span className="absolute -top-2.5 right-2 text-[10px] font-medium text-slate-400 whitespace-nowrap">
                {formatHour(h)}
              </span>
            )}
          </div>
        ))}
      </div>
    )
  }

  function NowIndicator() {
    const now = new Date()
    const top = (now.getHours() + now.getMinutes() / 60) * HOUR_HEIGHT
    return (
      <div className="absolute left-0 right-0 z-20 flex items-center pointer-events-none" style={{ top }}>
        <div className="h-2 w-2 rounded-full bg-[#84cc16] -ml-1 shrink-0" />
        <div className="flex-1 border-t border-[#84cc16]" />
      </div>
    )
  }

  function TripSpanRow() {
    const hasSpans = weekDays.some(day => trips.some(t => { const k = toKey(day); return k >= t.departure_date && k <= t.return_date }))
    if (!hasSpans) return null
    return (
      <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-slate-100 bg-slate-50/40 shrink-0">
        <div className="flex items-center justify-end pr-2 py-1">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">Trips</span>
        </div>
        {weekDays.map((day) => {
          const key = toKey(day)
          const dayTrips = trips.filter(t => key >= t.departure_date && key <= t.return_date)
          return (
            <div key={key} className="border-l border-slate-100 py-0.5 px-0.5 min-h-8 space-y-0.5">
              {dayTrips.map(t => {
                const ci = colorMap.get(t.id) ?? 0
                const pal = PALETTE[ci % PALETTE.length]
                const isStart = key === t.departure_date
                const isEnd = key === t.return_date
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => openEdit(t)}
                    className={cn(
                      'w-full text-[10px] font-semibold px-2 py-1 rounded text-left truncate leading-tight transition-opacity hover:opacity-80 border',
                      pal.spanBg, pal.spanText, pal.spanBorder
                    )}
                  >
                    {isStart ? `↗ ${t.title}` : isEnd ? `↙ ${t.title}` : t.title}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    )
  }

  // ── Views ───────────────────────────────────────────────────────────────────

  function WeekView() {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-slate-100 bg-white shrink-0">
          <div />
          {weekDays.map((day, i) => {
            const key = toKey(day)
            const isToday = key === todayKey
            return (
              <div key={key} className={cn('py-3 text-center border-l border-slate-100', isToday && 'bg-amber-50/50')}>
                <p className={cn('text-[11px] uppercase tracking-wide font-semibold', isToday ? 'text-amber-600' : 'text-slate-400')}>
                  {WEEK_LABELS[i]}
                </p>
                <p
                  className={cn(
                    'mt-1 mx-auto inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold cursor-pointer transition-colors',
                    isToday ? 'bg-amber-500 text-white' : 'text-slate-800 hover:bg-slate-100'
                  )}
                  onClick={() => { setCurrentDate(day); setView('day') }}
                >
                  {day.getDate()}
                </p>
              </div>
            )
          })}
        </div>

        <TripSpanRow />

        <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
          <div className="grid grid-cols-[64px_repeat(7,1fr)]">
            <TimeColumn />
            {weekDays.map((day) => {
              const key = toKey(day)
              const isToday = key === todayKey
              const dayEvents = eventsByDate.get(key) ?? []
              const spanning = trips.find((t) => key >= t.departure_date && key <= t.return_date)
              const spanCI = spanning ? (colorMap.get(spanning.id) ?? 0) : -1
              const spanPal = spanCI >= 0 ? PALETTE[spanCI % PALETTE.length] : null
              return (
                <div
                  key={key}
                  className={cn(
                    'relative border-l border-slate-100 cursor-crosshair',
                    isToday ? 'bg-amber-50/20' : spanPal ? spanPal.col : 'bg-white'
                  )}
                  style={{ height: 24 * HOUR_HEIGHT }}
                  onClick={(e) => {
                    if ((e.target as Element).closest('[data-event]')) return
                    const hour = Math.floor(e.nativeEvent.offsetY / HOUR_HEIGHT)
                    handleTimeSlotClick(day, hour)
                  }}
                >
                  {HOURS.map((h) => (
                    <button
                      key={`slot-${h}`}
                      type="button"
                      className="absolute left-0 right-0 border-t border-slate-100/80 bg-transparent transition-colors duration-200 hover:bg-slate-50 cursor-pointer z-0"
                      style={{ top: h * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTimeSlotClick(day, h)
                      }}
                    />
                  ))}
                  {isToday && <NowIndicator />}
                  {dayEvents.map(({ entry, trip, ci }) => (
                    <EventBlock key={entry.id || `${entry.entry_date}-${entry.entry_time}`} entry={entry} trip={trip} ci={ci} />
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  function DayView() {
    const key = toKey(currentDate)
    const isToday = key === todayKey
    const dayEvents = eventsByDate.get(key) ?? []
    const spanning = trips.find((t) => key >= t.departure_date && key <= t.return_date)
    const spanCI = spanning ? (colorMap.get(spanning.id) ?? 0) : -1
    const spanPal = spanCI >= 0 ? PALETTE[spanCI % PALETTE.length] : null

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="grid grid-cols-[64px_1fr] border-b border-slate-100 bg-white shrink-0">
          <div />
          <div className={cn('py-3 text-center border-l border-slate-100', isToday && 'bg-amber-50/50')}>
            <p className={cn('text-[11px] uppercase tracking-wide font-semibold', isToday ? 'text-amber-600' : 'text-slate-400')}>
              {currentDate.toLocaleDateString('en-ZA', { weekday: 'short' })}
            </p>
            <p className={cn('mt-1 mx-auto inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold', isToday ? 'bg-amber-500 text-white' : 'text-slate-800')}>
              {currentDate.getDate()}
            </p>
          </div>
        </div>
        {spanning && spanPal && (
          <div className="grid grid-cols-[64px_1fr] border-b border-slate-100 bg-slate-50/40 shrink-0">
            <div className="flex items-center justify-end pr-2 py-1">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">Trip</span>
            </div>
            <div className="border-l border-slate-100 py-0.5 px-0.5">
              <button
                type="button"
                onClick={() => openEdit(spanning)}
                className={cn('w-full text-[10px] font-semibold px-2 py-1 rounded text-left truncate border', spanPal.spanBg, spanPal.spanText, spanPal.spanBorder)}
              >
                {key === spanning.departure_date ? '↗' : key === spanning.return_date ? '↙' : '·'} {spanning.title}
              </button>
            </div>
          </div>
        )}
        <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
          <div className="grid grid-cols-[64px_1fr]">
            <TimeColumn />
            <div
              className={cn('relative border-l border-slate-100 cursor-crosshair', isToday ? 'bg-amber-50/10' : spanPal ? spanPal.col : 'bg-white')}
              style={{ height: 24 * HOUR_HEIGHT }}
              onClick={(e) => {
                if ((e.target as Element).closest('[data-event]')) return
                const hour = Math.floor(e.nativeEvent.offsetY / HOUR_HEIGHT)
                handleTimeSlotClick(currentDate, hour)
              }}
            >
              {HOURS.map((h) => (
                <button
                  key={`slot-${h}`}
                  type="button"
                  className="absolute left-0 right-0 border-t border-slate-100/80 bg-transparent transition-colors duration-200 hover:bg-slate-50 cursor-pointer z-0"
                  style={{ top: h * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTimeSlotClick(currentDate, h)
                  }}
                />
              ))}
              {isToday && <NowIndicator />}
              {dayEvents.map(({ entry, trip, ci }) => (
                <EventBlock key={entry.id || `${entry.entry_date}-${entry.entry_time}`} entry={entry} trip={trip} ci={ci} />
              ))}
              {dayEvents.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-sm text-slate-300 font-medium">Click to add an entry</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  function MonthView() {
    return (
      <div className="p-4">
        <p className="mb-4 text-sm text-slate-500">Select a day to open the daily schedule and add entries for that date.</p>
        <div className="grid grid-cols-7 gap-px mb-2">
          {MONTH_LABELS.map((d) => (
            <div key={d} className="py-1 text-center text-[11px] uppercase font-semibold text-slate-400">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {monthGrid.map((day) => {
            const key = toKey(day)
            const inMonth = day.getMonth() === currentDate.getMonth()
            const isToday = key === todayKey
            const dayEvents = eventsByDate.get(key) ?? []
            const spanTrips = inMonth ? trips.filter(t => key >= t.departure_date && key <= t.return_date) : []

            return (
              <button
                key={key}
                type="button"
                onClick={() => { setCurrentDate(day); setView('day') }}
                className={cn(
                  'min-h-22 rounded-xl border p-2 text-left transition-all duration-150',
                  !inMonth ? 'border-slate-100 bg-slate-50/40 text-slate-300 cursor-pointer' : 'border-slate-200/60 bg-white text-slate-700 hover:border-slate-300 hover:shadow-sm cursor-pointer',
                  isToday && 'border-amber-300 bg-amber-50/30 hover:border-amber-400',
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    'text-sm font-semibold leading-none',
                    isToday ? 'inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white text-xs' : '',
                    !isToday && !inMonth ? 'text-slate-300' : !isToday ? 'text-slate-800' : ''
                  )}>
                    {day.getDate()}
                  </span>
                  {dayEvents.length > 0 && inMonth && (
                    <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 rounded-full px-1.5 py-0.5">
                      {dayEvents.length}
                    </span>
                  )}
                </div>
                <div className="space-y-0.5">
                  {spanTrips.slice(0, 2).map(t => {
                    const ci = colorMap.get(t.id) ?? 0
                    const pal = PALETTE[ci % PALETTE.length]
                    const isStart = key === t.departure_date
                    const isEnd = key === t.return_date
                    return (
                      <div key={t.id} className={cn(
                        'text-[9px] font-medium px-1.5 py-0.5 truncate leading-tight rounded border',
                        pal.spanBg, pal.spanText, pal.spanBorder
                      )}>
                        {isStart ? `↗ ${t.title}` : isEnd ? `↙ ${t.title}` : `· ${t.title}`}
                      </div>
                    )
                  })}
                  {dayEvents.slice(0, 1).map(({ entry, ci }) => {
                    const pal = PALETTE[ci % PALETTE.length]
                    return (
                      <div key={entry.id} className={cn('text-[9px] px-1.5 py-0.5 truncate rounded', pal.bg, pal.text)}>
                        {entry.entry_time} {entry.title}
                      </div>
                    )
                  })}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const VIEWS: { key: CalendarView; label: string }[] = [
    { key: 'day', label: 'Day' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
  ]

  // ── Main render ─────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04),0_6px_20px_rgba(15,23,42,0.06)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-base font-semibold text-slate-900 shrink-0">Trip calendar</h2>
          {activeTrip && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 min-w-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="truncate">{activeTrip.title}</span>
            </span>
          )}
        </div>
        <Button onClick={openCreate} size="sm" className="inline-flex items-center gap-1.5 shrink-0">
          <Plus className="w-3.5 h-3.5" />
          New Trip
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 border-b border-slate-100 bg-slate-50/30">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentDate(new Date())}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Today
          </button>
          <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-white">
            <button type="button" onClick={() => navigate('prev')} className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-50 transition-colors border-r border-slate-200 cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => navigate('next')} className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <span className="text-sm font-semibold text-slate-800">{navLabel}</span>
        </div>
        <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-white">
          {VIEWS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium transition-colors border-r border-slate-200 last:border-r-0 cursor-pointer',
                view === key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar body */}
      <div className={cn(view === 'week' || view === 'day' ? 'h-150 flex flex-col overflow-hidden' : '')}>
        {view === 'week' && <WeekView />}
        {view === 'day' && <DayView />}
        {view === 'month' && <MonthView />}
      </div>

      {trips.length > 0 ? (
        <div className="border-t border-slate-100 px-6 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">All Trips</p>
          <div className="space-y-1.5">
            {trips.map((trip, i) => {
              const pal = PALETTE[i % PALETTE.length]
              const isActive = todayKey >= trip.departure_date && todayKey <= trip.return_date
              return (
                <div
                  key={trip.id}
                  className={cn(
                    'group flex items-center justify-between gap-4 rounded-xl border px-4 py-3 transition-all duration-150 cursor-pointer hover:shadow-sm',
                    isActive ? 'border-emerald-200 bg-emerald-50/30 hover:border-emerald-300' : 'border-slate-100 bg-white hover:border-slate-200'
                  )}
                  onClick={() => openEdit(trip)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn('h-2.5 w-2.5 shrink-0 rounded-full', pal.dot)} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{trip.title}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {formatDate(trip.departure_date)} → {formatDate(trip.return_date)}
                        {trip.companies?.name ? ` · ${trip.companies.name}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isActive && (
                      <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">Active</span>
                    )}
                    <span className="text-[10px] text-slate-400 tabular-nums">
                      {trip.trip_timeline_entries?.length ?? 0} event{trip.trip_timeline_entries?.length === 1 ? '' : 's'}
                    </span>
                    <button
                      type="button"
                      aria-label="Delete trip"
                      className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all p-1 rounded cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); handleDelete(trip.id) }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          {deleteError && <p className="mt-2 text-sm text-rose-600">{deleteError}</p>}
        </div>
      ) : (
        <div className="px-6 py-14 text-center">
          <MapPin className="w-8 h-8 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">No trips yet</p>
          <p className="text-xs text-slate-400 mt-1">Click "New Trip" to get started.</p>
        </div>
      )}

      {/* Create modal */}
      <Modal open={createOpen} onClose={() => { setCreateOpen(false); setCreateError('') }} title="New Trip" size="lg">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Trip title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Business review in Durban" required />
            <Select
              label="Company"
              value={newCompanyId}
              onChange={(e) => setNewCompanyId(e.target.value)}
              options={[{ value: '', label: 'Unassigned' }, ...companies.map((c) => ({ value: c.id, label: c.name }))]}
            />
            <Input label="Departure" type="date" value={newDeparture} onChange={(e) => setNewDeparture(e.target.value)} />
            <Input label="Return" type="date" value={newReturn} min={newDeparture} onChange={(e) => setNewReturn(e.target.value)} />
          </div>
          <Textarea label="Notes" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Trip summary or reminders" />

          <div className="rounded-xl border border-slate-100 bg-slate-50/60">
            <button
              type="button"
              className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-slate-700 cursor-pointer"
              onClick={() => setAddFirstEntry(!addFirstEntry)}
            >
              <span>Add first timeline entry</span>
              <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform duration-150', addFirstEntry && 'rotate-180')} />
            </button>
            {addFirstEntry && (
              <div className="px-4 pb-4 grid gap-3 sm:grid-cols-[1fr_120px] border-t border-slate-100 pt-3">
                <Input label="Activity" value={firstEntryTitle} onChange={(e) => setFirstEntryTitle(e.target.value)} placeholder="Client meeting at HQ" />
                <Input label="Time" type="time" value={firstEntryTime} onChange={(e) => setFirstEntryTime(e.target.value)} />
                <Input label="Location (optional)" value={firstEntryLocation} onChange={(e) => setFirstEntryLocation(e.target.value)} placeholder="14 Main Street" className="sm:col-span-2" />
              </div>
            )}
          </div>

          {createError && <p className="text-sm text-rose-600">{createError}</p>}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => { setCreateOpen(false); setCreateError('') }}>Cancel</Button>
            <Button loading={creating} onClick={handleCreate}>Create trip</Button>
          </div>
        </div>
      </Modal>

      {/* Edit / timeline modal */}
      <Modal open={editOpen} onClose={closeEdit} title={selectedTrip?.title ?? 'Trip'} size="xl">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Departure" type="date" value={modalDep} onChange={(e) => setModalDep(e.target.value)} />
            <Input label="Return" type="date" value={modalRet} min={modalDep} onChange={(e) => setModalRet(e.target.value)} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Timeline</p>
              <p className="text-xs text-slate-500 mt-0.5">Click a calendar slot or add below.</p>
            </div>
            <Button variant="secondary" size="sm" onClick={addEntry}>
              <Plus className="w-4 h-4" /> Add entry
            </Button>
          </div>

          <div className="space-y-2">
            {entries.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-5 text-center text-sm text-slate-500">
                No entries yet — add one or click a time slot on the calendar.
              </div>
            ) : entries.map((entry, i) => (
              <div key={entry.id || entry.tempId || i} className="rounded-xl border border-slate-100 bg-white">
                <div className="flex items-center gap-2 p-3">
                  <div className="grid gap-2 flex-1 sm:grid-cols-[100px_1fr]">
                    <Input type="time" value={entry.entry_time} onChange={(e) => changeEntry(i, 'entry_time', e.target.value)} />
                    <Input value={entry.title} onChange={(e) => changeEntry(i, 'title', e.target.value)} placeholder="Meeting, inspection, handover..." />
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleExpandEntry(i)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded cursor-pointer shrink-0"
                    title="Show details"
                  >
                    <ChevronDown className={cn('w-4 h-4 transition-transform duration-150', expandedEntries.has(i) && 'rotate-180')} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeEntry(i)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 rounded cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {expandedEntries.has(i) && (
                  <div className="px-3 pb-3 pt-0 grid gap-3 sm:grid-cols-2 border-t border-slate-50">
                    <div className="pt-3">
                      <Input
                        label="Date"
                        type="date"
                        value={entry.entry_date}
                        min={selectedTrip?.departure_date}
                        max={selectedTrip?.return_date}
                        onChange={(e) => changeEntry(i, 'entry_date', e.target.value)}
                      />
                    </div>
                    <div className="pt-3">
                      <Input label="Location" value={entry.location ?? ''} onChange={(e) => changeEntry(i, 'location', e.target.value)} placeholder="Street, city..." />
                    </div>
                    <div className="sm:col-span-2">
                      <Textarea label="Notes" value={entry.notes ?? ''} onChange={(e) => changeEntry(i, 'notes', e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Textarea label="Trip notes" value={modalNotes} onChange={(e) => setModalNotes(e.target.value)} placeholder="Overall planning notes" />
          {saveError && <p className="text-sm text-rose-600">{saveError}</p>}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="danger" size="sm" loading={deleting} onClick={() => selectedTrip && handleDelete(selectedTrip.id)} className="sm:mr-auto">
              Delete trip
            </Button>
            <Button variant="secondary" onClick={closeEdit}>Cancel</Button>
            <Button loading={saving} onClick={handleSave}>Save changes</Button>
          </div>
        </div>
      </Modal>

      {/* Quick-add modal */}
      <Modal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} title="Add Entry" size="md">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Date" type="date" value={quickAddDate} onChange={(e) => setQuickAddDate(e.target.value)} />
            <Input label="Time" type="time" value={quickAddTime} onChange={(e) => setQuickAddTime(e.target.value)} />
          </div>
          <Input label="Activity" value={quickAddTitle} onChange={(e) => setQuickAddTitle(e.target.value)} placeholder="Meeting, inspection, handover..." required />
          <Input label="Location (optional)" value={quickAddLocation} onChange={(e) => setQuickAddLocation(e.target.value)} placeholder="Street, city..." />
          {trips.length > 1 && (
            <Select
              label="Trip"
              value={quickAddTripId}
              onChange={(e) => setQuickAddTripId(e.target.value)}
              options={trips.map(t => ({ value: t.id, label: `${t.title} (${formatDate(t.departure_date)} → ${formatDate(t.return_date)})` }))}
            />
          )}
          {quickAddError && <p className="text-sm text-rose-600">{quickAddError}</p>}
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setQuickAddOpen(false)}>Cancel</Button>
            <Button loading={quickAdding} onClick={handleQuickAdd}>Add entry</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

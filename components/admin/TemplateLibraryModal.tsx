'use client'

import { useEffect, useState, useCallback } from 'react'

interface ChoreTemplate {
  id: string
  name: string
  description: string | null
  category: string
  ageMin: number
  ageMax: number | null
  defaultPoints: number
  durationMins: number | null
  scheduleType: string
  timeOfDay: string
  requiresPhoto: boolean
  icon: string | null
  tags: string[]
  isGlobal: boolean
}

interface Props {
  open: boolean
  onClose: () => void
  onSelectTemplate: (t: ChoreTemplate) => void
  childAgeMin?: number
  childAgeMax?: number
}

const CATEGORIES = [
  { value: 'all',       label: 'ALL' },
  { value: 'bedroom',   label: 'BEDROOM' },
  { value: 'hygiene',   label: 'BATHROOM' },
  { value: 'kitchen',   label: 'KITCHEN' },
  { value: 'household', label: 'HOUSEHOLD' },
  { value: 'outside',   label: 'OUTDOOR' },
  { value: 'school',    label: 'SCHOOL' },
  { value: 'pet',       label: 'PET' },
  { value: 'other',     label: 'OTHER' },
]

const FREQS = [
  { value: 'any',    label: 'ANY' },
  { value: 'daily',  label: 'DAILY' },
  { value: 'weekly', label: 'WEEKLY' },
]

const AGE_GROUPS = [
  { value: 'all',   label: 'ALL AGES' },
  { value: '4-6',   label: '4–6' },
  { value: '7-9',   label: '7–9' },
  { value: '10-12', label: '10–12' },
  { value: '13-99', label: '13+' },
]

const CATEGORY_ICON: Record<string, string> = {
  bedroom:   '🛏️',
  hygiene:   '🪥',
  kitchen:   '🍳',
  household: '🧹',
  outside:   '🌿',
  school:    '📚',
  pet:       '🐾',
  other:     '📋',
}

export function TemplateLibraryModal({ open, onClose, onSelectTemplate }: Props) {
  const [templates, setTemplates] = useState<ChoreTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState('all')
  const [freq, setFreq] = useState('any')
  const [ageGroup, setAgeGroup] = useState('all')
  const [search, setSearch] = useState('')

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (category !== 'all') params.set('category', category)
    if (freq !== 'any') params.set('freq', freq)
    if (ageGroup !== 'all') params.set('ageGroup', ageGroup)
    if (search) params.set('search', search)

    const res = await fetch(`/api/admin/chore-templates?${params}`)
    if (res.ok) {
      const data = await res.json()
      setTemplates(data)
    }
    setLoading(false)
  }, [category, freq, ageGroup, search])

  useEffect(() => {
    if (open) fetchTemplates()
  }, [open, fetchTemplates])

  if (!open) return null

  const pill = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
      active
        ? 'bg-[#3dff7a]/20 border-[#3dff7a] text-[#3dff7a]'
        : 'bg-transparent border-[#1a3018] text-[#4a7a40] hover:border-[#3dff7a]/50'
    }`

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        flexDirection: 'column',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          margin: 'auto',
          width: '100%',
          maxWidth: 720,
          maxHeight: '90vh',
          background: '#060e06',
          border: '1px solid #1a3018',
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #1a3018',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{
              fontFamily: "'Bungee', sans-serif",
              color: '#3dff7a',
              fontSize: 18,
              margin: 0,
              letterSpacing: 1,
            }}>
              MISSION LIBRARY
            </h2>
            <p style={{ color: '#4a7a40', fontSize: 11, margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: 1 }}>
              Choose a template to pre-fill the mission form
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: 8,
              background: '#1a3018', border: '1px solid #2a4a28',
              color: '#3dff7a', fontSize: 18, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* Filters */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #0d1810', flexShrink: 0, background: '#060e06' }}>
          {/* Search */}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search missions..."
            style={{
              width: '100%',
              background: '#0d1810',
              border: '1px solid #1a3018',
              borderRadius: 8,
              padding: '8px 12px',
              color: '#e8f5e8',
              fontSize: 13,
              outline: 'none',
              marginBottom: 10,
              boxSizing: 'border-box',
            }}
          />

          {/* Category pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {CATEGORIES.map((c) => (
              <button key={c.value} className={pill(category === c.value)} onClick={() => setCategory(c.value)}>
                {CATEGORY_ICON[c.value] ?? ''} {c.label}
              </button>
            ))}
          </div>

          {/* Freq + Age pills */}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {FREQS.map((f) => (
                <button key={f.value} className={pill(freq === f.value)} onClick={() => setFreq(f.value)}>
                  {f.label}
                </button>
              ))}
            </div>
            <div style={{ width: 1, background: '#1a3018' }} />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {AGE_GROUPS.map((a) => (
                <button key={a.value} className={pill(ageGroup === a.value)} onClick={() => setAgeGroup(a.value)}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Template grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#4a7a40', fontFamily: "'Bungee', sans-serif" }}>
              LOADING...
            </div>
          ) : templates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#4a7a40' }}>
              <p style={{ fontSize: 24, margin: '0 0 8px' }}>🔍</p>
              <p style={{ fontSize: 13 }}>No templates match your filters.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {templates.map((t) => (
                <div
                  key={t.id}
                  style={{
                    background: '#0d1810',
                    border: '1px solid #1a3018',
                    borderRadius: 12,
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#3dff7a' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#1a3018' }}
                  onClick={() => { onSelectTemplate(t); onClose() }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: '#1a3018',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20, flexShrink: 0,
                    }}>
                      {CATEGORY_ICON[t.category] ?? '📋'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 700,
                        fontSize: 14,
                        color: '#e8f5e8',
                        margin: '0 0 2px',
                        lineHeight: 1.2,
                      }}>
                        {t.name}
                      </p>
                      {t.description && (
                        <p style={{ color: '#4a7a40', fontSize: 11, margin: 0, lineHeight: 1.3 }}>
                          {t.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{
                      background: '#0a1a08', border: '1px solid #1a3018',
                      borderRadius: 99, padding: '2px 8px',
                      fontSize: 10, color: '#3dff7a', fontWeight: 700,
                    }}>
                      {t.defaultPoints} PTS
                    </span>
                    <span style={{
                      background: '#0a1a08', border: '1px solid #1a3018',
                      borderRadius: 99, padding: '2px 8px',
                      fontSize: 10, color: '#60b0ff', fontWeight: 700,
                      textTransform: 'uppercase',
                    }}>
                      {t.scheduleType}
                    </span>
                    <span style={{
                      background: '#0a1a08', border: '1px solid #1a3018',
                      borderRadius: 99, padding: '2px 8px',
                      fontSize: 10, color: '#f5c842', fontWeight: 700,
                    }}>
                      Age {t.ageMin}{t.ageMax ? `–${t.ageMax}` : '+'}
                    </span>
                    {t.durationMins && (
                      <span style={{
                        background: '#0a1a08', border: '1px solid #1a3018',
                        borderRadius: 99, padding: '2px 8px',
                        fontSize: 10, color: '#f29d26', fontWeight: 700,
                      }}>
                        ~{t.durationMins}min
                      </span>
                    )}
                  </div>

                  <button
                    style={{
                      width: '100%',
                      padding: '8px 0',
                      background: '#3dff7a',
                      border: 'none',
                      borderRadius: 8,
                      fontFamily: "'Bungee', sans-serif",
                      fontSize: 11,
                      letterSpacing: 1,
                      color: '#060e06',
                      cursor: 'pointer',
                    }}
                    onClick={(e) => { e.stopPropagation(); onSelectTemplate(t); onClose() }}
                  >
                    + ADD MISSION
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

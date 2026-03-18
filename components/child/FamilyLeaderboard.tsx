'use client'

import { useEffect, useState, useCallback } from 'react'
import { DetailedCharacter } from '@/components/child/DetailedCharacter'

interface Member {
  id: string
  name: string
  level: number
  childProfile: {
    hairStyle?: string | null
    hairColor?: string | null
    skinTone?: string | null
    eyeColor?: string | null
    gender?: string | null
    eyeStyle?: string | null
    freckles?: boolean | null
    jacketColor?: string | null
    pantsColor?: string | null
    goggleColor?: string | null
    sigItem?: string | null
  } | null
  weekPoints: number
  weekChores: number
}

interface Props {
  initial: Member[]
  currentUserId: string
}

function rankBadge(rank: number): { label: string; color: string } {
  if (rank === 1) return { label: '🥇', color: '#f5c842' }
  if (rank === 2) return { label: '🥈', color: '#94a3b8' }
  if (rank === 3) return { label: '🥉', color: '#cd7f32' }
  return { label: `#${rank}`, color: '#3dff7a' }
}

export function FamilyLeaderboard({ initial, currentUserId }: Props) {
  const [members, setMembers] = useState<Member[]>(initial)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch('/api/child/leaderboard')
      if (!res.ok) return
      const data: Member[] = await res.json()
      setMembers(data)
    } catch {
      // silently fail — keep existing data
    }
  }, [])

  useEffect(() => {
    const id = setInterval(fetchLeaderboard, 30_000)
    return () => clearInterval(id)
  }, [fetchLeaderboard])

  const sorted = [...members].sort((a, b) => b.weekPoints - a.weekPoints)
  const maxPoints = sorted.length > 0 ? Math.max(sorted[0].weekPoints, 1) : 1

  return (
    <>
      <section>
        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <h2
            style={{
              fontFamily: "'Bungee', sans-serif",
              color: '#ff6b00',
              fontSize: 13,
              letterSpacing: 2,
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            FAMILY LEADERBOARD
          </h2>
          <div style={{ flex: 1, height: 1, background: '#1a3018' }} />
        </div>

        <div
          style={{
            background: '#0d1810',
            border: '1px solid #1a3018',
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          {sorted.map((member, idx) => {
            const rank = idx + 1
            const isSelf = member.id === currentUserId
            const { label: rankLabel, color: rankColor } = rankBadge(rank)
            const barPct = (member.weekPoints / maxPoints) * 100

            return (
              <div
                key={member.id}
                onClick={() => {
                  if (!isSelf) setSelectedMember(member)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderBottom: idx < sorted.length - 1 ? '1px solid #1a3018' : 'none',
                  borderLeft: isSelf ? '3px solid #3dff7a' : '3px solid transparent',
                  background: isSelf ? 'rgba(61,255,122,0.05)' : 'transparent',
                  cursor: isSelf ? 'default' : 'pointer',
                }}
              >
                {/* Rank badge */}
                <div
                  style={{
                    width: 28,
                    textAlign: 'center',
                    fontFamily: rank <= 3 ? undefined : "'Bungee', sans-serif",
                    fontSize: rank <= 3 ? 18 : 12,
                    color: rankColor,
                    flexShrink: 0,
                  }}
                >
                  {rankLabel}
                </div>

                {/* Avatar */}
                <div style={{ flexShrink: 0 }}>
                  <DetailedCharacter
                    gender={member.childProfile?.gender ?? undefined}
                    skinTone={member.childProfile?.skinTone ?? undefined}
                    hairStyle={member.childProfile?.hairStyle ?? undefined}
                    hairColor={member.childProfile?.hairColor ?? undefined}
                    eyeColor={member.childProfile?.eyeColor ?? undefined}
                    eyeStyle={(member.childProfile?.eyeStyle as any) ?? undefined}
                    freckles={member.childProfile?.freckles ?? false}
                    jacketColor={member.childProfile?.jacketColor ?? undefined}
                    pantsColor={member.childProfile?.pantsColor ?? undefined}
                    goggleColor={member.childProfile?.goggleColor ?? undefined}
                    sigItem={(member.childProfile?.sigItem as any) ?? undefined}
                    width={36}
                  />
                </div>

                {/* Name + chores */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: 600,
                      color: isSelf ? '#3dff7a' : '#e8f5e8',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {member.name}
                    {isSelf && (
                      <span style={{ color: '#4a6a4a', fontSize: 11, marginLeft: 6 }}>(YOU)</span>
                    )}
                  </p>
                  <p style={{ margin: 0, color: '#4a6a4a', fontSize: 10, marginTop: 1 }}>
                    {member.weekChores} chore{member.weekChores !== 1 ? 's' : ''} this week
                  </p>
                  {/* Mini progress bar */}
                  <div
                    style={{
                      height: 3,
                      background: '#1a3018',
                      borderRadius: 99,
                      overflow: 'hidden',
                      marginTop: 4,
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.round(barPct)}%`,
                        background: isSelf ? '#3dff7a' : rankColor,
                        borderRadius: 99,
                      }}
                    />
                  </div>
                </div>

                {/* Points */}
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <span
                    style={{
                      fontFamily: "'Bungee', sans-serif",
                      color: '#f5c842',
                      fontSize: 16,
                    }}
                  >
                    {member.weekPoints}
                  </span>
                  <span style={{ color: '#4a6a4a', fontSize: 10, display: 'block' }}>pts</span>
                </div>
              </div>
            )
          })}

          {sorted.length === 0 && (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: '#4a6a4a', fontSize: 13 }}>
              No family members yet
            </div>
          )}
        </div>
      </section>

      {/* Bottom sheet overlay */}
      {selectedMember && (
        <div
          onClick={() => setSelectedMember(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0d1810',
              border: '1px solid #1a3018',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: '24px 24px 40px',
              width: '100%',
              maxWidth: 480,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            {/* Handle */}
            <div
              style={{ width: 36, height: 4, background: '#1a3018', borderRadius: 99, marginBottom: 8 }}
            />

            <DetailedCharacter
              gender={selectedMember.childProfile?.gender ?? undefined}
              skinTone={selectedMember.childProfile?.skinTone ?? undefined}
              hairStyle={selectedMember.childProfile?.hairStyle ?? undefined}
              hairColor={selectedMember.childProfile?.hairColor ?? undefined}
              eyeColor={selectedMember.childProfile?.eyeColor ?? undefined}
              eyeStyle={(selectedMember.childProfile?.eyeStyle as any) ?? undefined}
              freckles={selectedMember.childProfile?.freckles ?? false}
              jacketColor={selectedMember.childProfile?.jacketColor ?? undefined}
              pantsColor={selectedMember.childProfile?.pantsColor ?? undefined}
              goggleColor={selectedMember.childProfile?.goggleColor ?? undefined}
              sigItem={(selectedMember.childProfile?.sigItem as any) ?? undefined}
              width={120}
            />

            <p
              style={{
                fontFamily: "'Bungee', sans-serif",
                color: '#e8f5e8',
                fontSize: 20,
                margin: 0,
                textAlign: 'center',
              }}
            >
              {selectedMember.name}
            </p>

            <p style={{ color: '#4a6a4a', fontSize: 12, margin: 0 }}>
              Level {selectedMember.level} · {selectedMember.weekPoints} pts this week
            </p>

            <button
              onClick={() => setSelectedMember(null)}
              style={{
                marginTop: 8,
                background: '#1a3018',
                border: '1px solid #2a4a2a',
                borderRadius: 8,
                color: '#3dff7a',
                fontFamily: "'Bungee', sans-serif",
                fontSize: 12,
                letterSpacing: 1,
                padding: '8px 24px',
                cursor: 'pointer',
              }}
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </>
  )
}

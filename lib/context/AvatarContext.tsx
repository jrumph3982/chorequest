'use client'

import { createContext, useContext, useState, useCallback } from 'react'

const LS_KEY = 'chq-avatar-extended'

export type SigItem = 'bat' | 'wrench' | 'broom'
export type EyeStyleT = 'round' | 'almond' | 'wide' | 'squint'

export interface AvatarState {
  gender:      string
  hairStyle:   string
  hairColor:   string
  skinTone:    string
  eyeColor:    string
  eyeStyle:    EyeStyleT
  freckles:    boolean
  jacketColor: string
  pantsColor:  string
  goggleColor: string
  sigItem:     SigItem
}

const EXTENDED_DEFAULTS = {
  eyeStyle:    'round' as EyeStyleT,
  freckles:    false,
  jacketColor: '#2a4a2a',
  pantsColor:  '#2a3a4a',
  goggleColor: '#f97316',
  sigItem:     'bat' as SigItem,
}

export interface AvatarInitialProfile {
  gender?:      string | null
  hairStyle?:   string | null
  hairColor?:   string | null
  skinTone?:    string | null
  eyeColor?:    string | null
  eyeStyle?:    string | null
  freckles?:    boolean | null
  jacketColor?: string | null
  pantsColor?:  string | null
  goggleColor?: string | null
  sigItem?:     string | null
}

interface AvatarCtx {
  avatar:   AvatarState
  setField: <K extends keyof AvatarState>(key: K, value: AvatarState[K]) => void
}

const Ctx = createContext<AvatarCtx | null>(null)

export function AvatarProvider({
  children,
  initialProfile,
}: {
  children:       React.ReactNode
  initialProfile: AvatarInitialProfile
}) {
  const [avatar, setAvatar] = useState<AvatarState>(() => {
    // Start with defaults, then apply localStorage (client-side fast restore),
    // then DB values override everything (DB is source of truth)
    const ext = { ...EXTENDED_DEFAULTS }
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LS_KEY)
        if (saved) Object.assign(ext, JSON.parse(saved))
      } catch {}
    }
    return {
      gender:    initialProfile.gender    ?? 'boy',
      hairStyle: initialProfile.hairStyle ?? 'Short',
      hairColor: initialProfile.hairColor ?? 'Brown',
      skinTone:  initialProfile.skinTone  ?? 'Medium-Light',
      eyeColor:  initialProfile.eyeColor  ?? 'Brown',
      // Extended — DB wins over localStorage
      eyeStyle:    (initialProfile.eyeStyle  as EyeStyleT | null) ?? ext.eyeStyle,
      freckles:    initialProfile.freckles   ?? ext.freckles,
      jacketColor: initialProfile.jacketColor ?? ext.jacketColor,
      pantsColor:  initialProfile.pantsColor  ?? ext.pantsColor,
      goggleColor: initialProfile.goggleColor ?? ext.goggleColor,
      sigItem:     (initialProfile.sigItem as SigItem | null) ?? ext.sigItem,
    }
  })

  const setField = useCallback(<K extends keyof AvatarState>(key: K, value: AvatarState[K]) => {
    setAvatar(prev => {
      const next = { ...prev, [key]: value }
      // Persist extended fields to localStorage for fast restore
      try {
        localStorage.setItem(LS_KEY, JSON.stringify({
          eyeStyle:    next.eyeStyle,
          freckles:    next.freckles,
          jacketColor: next.jacketColor,
          pantsColor:  next.pantsColor,
          goggleColor: next.goggleColor,
          sigItem:     next.sigItem,
        }))
      } catch {}
      return next
    })
  }, [])

  return <Ctx.Provider value={{ avatar, setField }}>{children}</Ctx.Provider>
}

export function useAvatar(): AvatarCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAvatar must be used within AvatarProvider')
  return ctx
}

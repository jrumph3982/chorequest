'use client'

import { useAvatar } from '@/lib/context/AvatarContext'
import { DetailedCharacter } from '@/components/child/DetailedCharacter'

interface GearOverlaySlots {
  head?: string | null
  belt?: string | null
  backpack?: string | null
}

interface Props {
  gear?: GearOverlaySlots
}

export function LoadoutAvatarClient({ gear }: Props) {
  const { avatar } = useAvatar()
  return (
    <DetailedCharacter
      gender={avatar.gender}
      skinTone={avatar.skinTone}
      hairColor={avatar.hairColor}
      hairStyle={avatar.hairStyle}
      eyeColor={avatar.eyeColor}
      eyeStyle={avatar.eyeStyle}
      freckles={avatar.freckles}
      jacketColor={avatar.jacketColor}
      pantsColor={avatar.pantsColor}
      goggleColor={avatar.goggleColor}
      sigItem={avatar.sigItem}
      width={140}
      gear={gear}
    />
  )
}

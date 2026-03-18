import { requireAdult } from '@/lib/auth/guards'
import { getOrCreateSettings } from '@/lib/game/settings'
import { GameSettingsForm } from '@/components/admin/game-settings-form'
import { redirect } from 'next/navigation'

export default async function AdminSettingsPage() {
  const guard = await requireAdult()
  if (!guard.ok) redirect('/login')

  const settings = await getOrCreateSettings(guard.householdId)

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
        <p className="text-sm text-slate-400 mt-0.5">Configure game rules and reward rates</p>
      </div>

      <GameSettingsForm initial={settings} />
    </div>
  )
}

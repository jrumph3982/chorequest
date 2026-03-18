import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { calcBaseHealth } from '@/lib/game/score'

function ZombieBounce({ delay, size, color }: { delay: number; size: string; color: string }) {
  return (
    <div
      className="flex flex-col items-center"
      style={{ animationDelay: `${delay}s`, animation: 'bounce 2s infinite ease-in-out' }}
    >
      <span className={`${size} ${color} drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]`}>🧟</span>
      <div className="h-8 w-6 bg-green-800/40 rounded-full blur-sm -mt-2" />
    </div>
  )
}

export default async function NightRaidPage() {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== 'child') redirect('/child-login')

  const lastNight = await prisma.dailyBaseDamage.findFirst({
    where: { childUserId: session.userId },
    orderBy: { date: 'desc' },
  })

  const baseState = await prisma.baseState.findUnique({
    where: { childUserId: session.userId },
  })

  const child = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { level: true, xp: true },
  })

  const baseHealth = baseState
    ? calcBaseHealth(baseState.doorDamage, baseState.barricadeDamage, baseState.fenceDamage, baseState.lightDamage)
    : 100

  const survived = !lastNight || lastNight.attackResult !== 'overrun'
  const barelySurvived = lastNight?.attackResult === 'barely_survived'
  const totalDamage = lastNight
    ? lastNight.doorDamage + lastNight.barricadeDamage + lastNight.fenceDamage + lastNight.lightDamage
    : 0

  const components = baseState
    ? [
        { label: 'Door',      damage: baseState.doorDamage      },
        { label: 'Barricade', damage: baseState.barricadeDamage  },
        { label: 'Fence',     damage: baseState.fenceDamage     },
        { label: 'Lights',    damage: baseState.lightDamage     },
      ]
    : []

  if (!lastNight) redirect('/play/base')

  // Results view (previous night's result)
  if (!barelySurvived && survived) {
    return (
      <div className="flex flex-col bg-[#221b10] text-slate-100">
        {/* Header */}
        <div className="flex items-center p-6 pb-4 justify-between sticky top-0 z-10 bg-[#221b10]/80 backdrop-blur-md">
          <div className="flex w-12 h-12 items-center justify-center rounded-xl bg-[#f29d26]/20 text-[#f29d26]">
            🛡️
          </div>
          <div className="flex-1 text-center">
            <p className="text-[#f29d26] text-xs font-extrabold uppercase tracking-widest">Mission Complete</p>
            <h2 className="text-xl font-extrabold leading-tight tracking-tight">Night Survived!</h2>
          </div>
          <Link
            href="/play/base"
            className="flex w-10 h-10 items-center justify-center rounded-full bg-slate-800 text-slate-400"
          >
            ✕
          </Link>
        </div>

        {/* Victory panel */}
        <div className="px-4 py-2">
          <div
            className="relative w-full rounded-xl overflow-hidden border-2 border-[#f29d26]/30 flex items-center justify-center"
            style={{ background: 'linear-gradient(180deg, rgba(242,157,38,0.1) 0%, #221b10 100%)', height: 200 }}
          >
            <div className="absolute -right-2 -top-2 opacity-10 text-9xl">🎁</div>
            <div className="absolute top-4 right-4 bg-[#f29d26] text-slate-900 px-3 py-1 rounded-full text-sm font-black italic rotate-3"
              style={{ boxShadow: '0 0 20px rgba(242,157,38,0.4)' }}>
              VICTORY!
            </div>
            <div className="text-8xl">🏆</div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-4 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
              <p className="text-slate-400 text-xs font-bold uppercase mb-1">Base Integrity</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-black text-[#f29d26]">{baseHealth}%</span>
                <span className="text-green-400 text-sm mb-1">↑</span>
              </div>
              <div className="mt-2 h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-[#f29d26] rounded-full" style={{ width: `${baseHealth}%` }} />
              </div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
              <p className="text-slate-400 text-xs font-bold uppercase mb-1">Damage Taken</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-black text-purple-400">{totalDamage}</span>
                <span className="text-xs font-medium text-slate-400 mb-1">HP Lost</span>
              </div>
            </div>
          </div>

          {/* Fortifications status */}
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <p className="text-slate-400 text-xs font-bold uppercase mb-3">Fortifications</p>
            <div className="space-y-2">
              {components.map((c) => (
                <div key={c.label} className="flex items-center gap-3">
                  <span className={c.damage === 0 ? 'text-green-400 text-lg' : 'text-[#f29d26] text-lg'}>
                    {c.damage === 0 ? '✓' : '⚠️'}
                  </span>
                  <span className="text-sm font-semibold">{c.label}</span>
                  <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${
                    c.damage === 0
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-[#f29d26]/20 text-[#f29d26]'
                  }`}>
                    {c.damage === 0 ? 'INTACT' : `${c.damage}% DMG`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Rewards panel */}
          <div
            className="p-5 rounded-2xl border-2 border-[#f29d26]/30 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(242,157,38,0.08) 0%, rgba(34,27,16,0) 100%)' }}
          >
            <div className="absolute -right-4 -top-4 opacity-10 text-8xl">🎁</div>
            <h3 className="font-black text-lg mb-4 flex items-center gap-2 text-slate-100">
              ✨ Morning Loot
            </h3>
            <div className="flex justify-around items-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-[#f29d26]/20 flex items-center justify-center border-2 border-[#f29d26]"
                  style={{ boxShadow: '0 0 20px rgba(242,157,38,0.4)' }}>
                  <span className="text-2xl">⭐</span>
                </div>
                <p className="text-xs font-black uppercase text-[#f29d26]">
                  +{lastNight?.missedChores === 0 ? 50 : 25} XP
                </p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-yellow-400/20 flex items-center justify-center border-2 border-yellow-400"
                  style={{ boxShadow: '0 0 15px rgba(250,204,21,0.3)' }}>
                  <span className="text-2xl">🔩</span>
                </div>
                <p className="text-xs font-black uppercase text-yellow-400">+10 Scrap</p>
              </div>
              {baseState && baseState.survivalStreak > 0 && (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-full bg-blue-400/20 flex items-center justify-center border-2 border-blue-400"
                    style={{ boxShadow: '0 0 15px rgba(96,165,250,0.3)' }}>
                    <span className="text-2xl">🌙</span>
                  </div>
                  <p className="text-xs font-black uppercase text-blue-400">
                    {baseState.survivalStreak} Night Streak
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-4 flex flex-col gap-3 mt-auto">
          <Link
            href="/play"
            className="w-full py-4 rounded-xl font-black text-lg uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 text-slate-900"
            style={{ background: '#4ade80', boxShadow: '0 0 20px rgba(74,222,128,0.4)' }}
          >
            Claim Rewards →
          </Link>
          <Link
            href="/play/base"
            className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wide border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-100 text-center transition-colors"
          >
            View Base Stats
          </Link>
        </div>
      </div>
    )
  }

  // Survival scene (during / overrun)
  return (
    <div className="relative flex flex-col w-full overflow-hidden bg-[#221b10]">
      {/* Header */}
      <div className="flex items-center p-4 pb-2 justify-between z-10 border-b border-[#f29d26]/10 bg-[#221b10]">
        <Link href="/play/base" className="flex w-12 h-12 shrink-0 items-center justify-center text-slate-100">
          ←
        </Link>
        <h2 className="text-slate-100 text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center uppercase tracking-wider">
          Night Raid Event
        </h2>
        <div className="flex w-12 items-center justify-end">
          <span className="text-[#f29d26] text-2xl">🛡️</span>
        </div>
      </div>

      {/* Scene */}
      <div className="relative overflow-hidden" style={{ height: 320 }}>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-[#221b10]">
          <div className="absolute inset-0 bg-gradient-to-t from-[#221b10] via-transparent to-slate-900/60" />

          {/* Zombie row */}
          <div className="absolute inset-x-0 bottom-36 flex justify-around px-6">
            <ZombieBounce delay={0.2} size="text-6xl" color="text-green-500" />
            <ZombieBounce delay={0.5} size="text-7xl" color="text-green-400" />
            <ZombieBounce delay={0}   size="text-5xl" color="text-green-600" />
          </div>

          {/* Content overlay */}
          <div className="absolute inset-0 flex flex-col justify-end p-6">
            <div className="text-center mb-6">
              <span className="inline-block px-4 py-1 rounded-full bg-[#f29d26]/20 text-[#f29d26] text-xs font-bold uppercase tracking-widest mb-2 border border-[#f29d26]/30">
                {lastNight.attackResult === 'overrun' ? 'Base Overrun!' : 'Wave Incoming'}
              </span>
              <h1 className="text-slate-100 tracking-tight text-3xl font-extrabold leading-tight drop-shadow-lg uppercase">
                THE ZOMBIE SIEGE
              </h1>
            </div>

            {/* Defense status */}
            <div className="bg-slate-900/80 backdrop-blur-md rounded-xl p-4 border border-slate-700/50 mb-4 shadow-xl">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-[#f29d26] text-[10px] font-bold uppercase tracking-wider">Security Level</p>
                  <p className="text-white text-lg font-bold">
                    {lastNight.attackResult === 'overrun' ? 'COMPROMISED' : 'HOUSE SECURE'}
                  </p>
                </div>
                <p className="text-[#f29d26] text-sm font-bold">{baseHealth}%</p>
              </div>
              <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    baseHealth > 70 ? 'bg-[#f29d26]' : baseHealth > 40 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${baseHealth}%`, boxShadow: '0 0 15px rgba(242,157,38,0.5)' }}
                />
              </div>
            </div>

            {/* Victory/defeat message */}
            <div className="flex flex-col gap-3 text-center pb-4">
              {lastNight.missedChores > 0 && (
                <p className="text-[#f29d26]/90 text-sm font-semibold italic">
                  &quot;{lastNight.missedChores} chores missed — zombies breached!&quot;
                </p>
              )}
              <h1 className={`tracking-tighter text-4xl font-black leading-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] ${
                lastNight.attackResult === 'overrun' ? 'text-red-400' : 'text-white animate-pulse'
              }`}>
                {lastNight.attackResult === 'overrun' ? 'BASE OVERRUN!' : 'YOU SURVIVED THE NIGHT!'}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Claim button */}
      <div className="bg-[#221b10] px-6 py-4 border-t border-slate-800">
        <Link
          href="/play"
          className="w-full bg-[#f29d26] hover:bg-[#f29d26]/90 text-[#221b10] font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          ✨ CLAIM REWARDS
        </Link>
      </div>
    </div>
  )
}

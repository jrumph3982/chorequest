export interface ThemeColors {
  primary: string
  secondary: string
  danger: string
  gold: string
  bg: string
  bgPanel: string
  bgCard: string
  border: string
  text: string
  textMuted: string
}

export interface ThemeLanguage {
  currency: string
  currencyIcon: string
  points: string
  pointsShort: string
  chores: string
  choresSingle: string
  base: string
  basePage: string
  homeGreeting: string
  threats: string
  threatSingle: string
  upgrade: string
  repair: string
  attack: string
  health: string
  nightly: string
  nightlyPlural: string
  wave: string
  rival: string
  rivalPlural: string
  season: string
  winText: string
  loseText: string
  dailyEvent: string
  streakLabel: string
  leaderboard: string
  challengeTitle: string
  shopName: string
  characterName: string
  levelTitle: string
  missionComplete: string
  perfectEvent: string
  nightlyReport: string
  xpName: string
  navBase: string
  navLoadout: string
  threatLow: string
  threatMed: string
  threatHigh: string
}

export interface ThemeConfig {
  id: string
  name: string
  tagline: string
  icon: string
  colors: ThemeColors
  language: ThemeLanguage
  features: string[]
}

export const THEMES: Record<string, ThemeConfig> = {
  zombie: {
    id: 'zombie',
    name: 'Zombie Survival',
    tagline: 'Defend the base. Complete your chores.',
    icon: '🧟',
    colors: {
      primary:   '#3dff7a',
      secondary: '#ff6b00',
      danger:    '#ff3030',
      gold:      '#f5c842',
      bg:        '#060a06',
      bgPanel:   '#0d1610',
      bgCard:    '#0d1810',
      border:    '#1a3018',
      text:      '#c8e0c0',
      textMuted: '#4a7a40',
    },
    language: {
      currency:       'Scraps',
      currencyIcon:   '🔩',
      points:         'Survival Points',
      pointsShort:    'pts',
      chores:         'Missions',
      choresSingle:   'Mission',
      base:           'Base',
      basePage:       'BASE',
      homeGreeting:   'Survivor Status',
      threats:        'Zombies',
      threatSingle:   'Zombie',
      upgrade:        'Fortify',
      repair:         'Repair',
      attack:         'Attack',
      health:         'Base Integrity',
      nightly:        'Raid',
      nightlyPlural:  'Raids',
      wave:           'Wave',
      rival:          'Zombie',
      rivalPlural:    'Zombies',
      season:         'Invasion',
      winText:        'SURVIVED THE NIGHT!',
      loseText:       'BASE OVERRUN!',
      dailyEvent:     "Tonight's Raid",
      streakLabel:    'Day Streak',
      leaderboard:    'Survivor Rankings',
      challengeTitle: 'Battle Challenge',
      shopName:       'Gear Shop',
      characterName:  'Survivor',
      levelTitle:     'Survivor',
      missionComplete:'MISSION COMPLETE!',
      perfectEvent:   'PERFECT DEFENSE!',
      nightlyReport:  'Raid Report',
      xpName:         'XP',
      navBase:        'Base',
      navLoadout:     'Loadout',
      threatLow:      'LOW THREAT',
      threatMed:      'MED THREAT',
      threatHigh:     'HIGH THREAT',
    },
    features: [
      '🏚️ Board windows',
      '🔩 Earn scraps',
      '🧟 Repel zombies',
      '⚔️ Upgrade defenses',
    ],
  },

  castle: {
    id: 'castle',
    name: 'Castle Defense',
    tagline: 'Protect the kingdom. Complete your quests.',
    icon: '🏰',
    colors: {
      primary:   '#60b0ff',
      secondary: '#c8a820',
      danger:    '#cc2020',
      gold:      '#f5c842',
      bg:        '#08080e',
      bgPanel:   '#0e0e1a',
      bgCard:    '#10101e',
      border:    '#2a2a4a',
      text:      '#d0d0f0',
      textMuted: '#5a5a8a',
    },
    language: {
      currency:       'Gold Coins',
      currencyIcon:   '🪙',
      points:         'Honor Points',
      pointsShort:    'honor',
      chores:         'Quests',
      choresSingle:   'Quest',
      base:           'Kingdom',
      basePage:       'KINGDOM',
      homeGreeting:   'Kingdom Status',
      threats:        'Invaders',
      threatSingle:   'Invader',
      upgrade:        'Fortify',
      repair:         'Rebuild',
      attack:         'Strike',
      health:         'Kingdom Strength',
      nightly:        'Siege',
      nightlyPlural:  'Sieges',
      wave:           'Battalion',
      rival:          'Invader',
      rivalPlural:    'Invaders',
      season:         'Campaign',
      winText:        'THE KINGDOM STANDS!',
      loseText:       'THE CASTLE HAS FALLEN!',
      dailyEvent:     "Tonight's Siege",
      streakLabel:    'Day Honor Streak',
      leaderboard:    'Knights of the Realm',
      challengeTitle: 'Royal Tournament',
      shopName:       'Royal Armory',
      characterName:  'Knight',
      levelTitle:     'Knight',
      missionComplete:'QUEST COMPLETE!',
      perfectEvent:   'FLAWLESS DEFENSE!',
      nightlyReport:  'Battle Report',
      xpName:         'Honor XP',
      navBase:        'Kingdom',
      navLoadout:     'Armory',
      threatLow:      'SCOUTS SPOTTED',
      threatMed:      'ARMY ADVANCING',
      threatHigh:     'SIEGE!',
    },
    features: [
      '🏰 Fortify walls',
      '🪙 Earn gold coins',
      '⚔️ Defeat invaders',
      '🛡️ Upgrade castle',
    ],
  },

  racing: {
    id: 'racing',
    name: 'Race to Victory',
    tagline: 'Win the championship. Complete your chores.',
    icon: '🏎️',
    colors: {
      primary:   '#ff3030',
      secondary: '#f5c842',
      danger:    '#ff6b00',
      gold:      '#f5c842',
      bg:        '#080808',
      bgPanel:   '#101010',
      bgCard:    '#141414',
      border:    '#2a2a2a',
      text:      '#f0f0f0',
      textMuted: '#6a6a6a',
    },
    language: {
      currency:       'Parts',
      currencyIcon:   '🔧',
      points:         'Championship Points',
      pointsShort:    'pts',
      chores:         'Pit Tasks',
      choresSingle:   'Pit Task',
      base:           'Garage',
      basePage:       'GARAGE',
      homeGreeting:   'Race Team Status',
      threats:        'Rival Cars',
      threatSingle:   'Rival',
      upgrade:        'Upgrade',
      repair:         'Repair',
      attack:         'Overtake',
      health:         'Car Performance',
      nightly:        'Race',
      nightlyPlural:  'Races',
      wave:           'Lap',
      rival:          'Rival Driver',
      rivalPlural:    'Rival Drivers',
      season:         'Championship',
      winText:        'CHECKERED FLAG!',
      loseText:       'RACE ABANDONED!',
      dailyEvent:     "Tonight's Race",
      streakLabel:    'Day Win Streak',
      leaderboard:    'Championship Standings',
      challengeTitle: 'Head-to-Head Race',
      shopName:       'Parts Shop',
      characterName:  'Driver',
      levelTitle:     'Driver',
      missionComplete:'PIT TASKS COMPLETE!',
      perfectEvent:   'POLE POSITION!',
      nightlyReport:  'Race Report',
      xpName:         'Race XP',
      navBase:        'Garage',
      navLoadout:     'Parts',
      threatLow:      'CLEAR TRACK',
      threatMed:      'RIVALS CLOSE',
      threatHigh:     'UNDER ATTACK',
    },
    features: [
      '🔧 Upgrade car',
      '🏆 Earn parts',
      '🏁 Beat rivals',
      '🏎️ Climb standings',
    ],
  },
}

export function getTheme(themeId?: string | null): ThemeConfig {
  return THEMES[themeId ?? 'zombie'] ?? THEMES.zombie
}

export const THEME_IDS = ['zombie', 'castle', 'racing'] as const
export type ThemeId = typeof THEME_IDS[number]

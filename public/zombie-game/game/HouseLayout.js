// ─── World & House Dimensions ─────────────────────────────────────────────────
export const WORLD  = { width: 1800, height: 1200 };
export const HOUSE  = { x: 100, y: 100, width: 1600, height: 1000, wallThick: 30 };

// ─── Rooms (interior, inside walls) ──────────────────────────────────────────
export const ROOMS = [
  { id: 'living',  label: 'Living Room', x: 130, y: 130, w: 700, h: 480, floor: '#1a2e14', floorAlt: '#1c3216', tileSize: 60 },
  { id: 'kitchen', label: 'Kitchen',     x: 130, y: 640, w: 700, h: 430, floor: '#141e1a', floorAlt: '#162220', tileSize: 20 },
  { id: 'bedroom', label: 'Bedroom',     x: 860, y: 130, w: 810, h: 480, floor: '#161210', floorAlt: '#181412', tileSize: 0  },
  { id: 'study',   label: 'Study',       x: 860, y: 640, w: 810, h: 430, floor: '#12161a', floorAlt: '#14181c', tileSize: 0  },
];

// ─── Interior Walls ────────────────────────────────────────────────────────────
export const INTERIOR_WALLS = [
  { x: 830, y: 100, w: 30, h: 1000 },   // vertical divider
  { x: 100, y: 610, w: 730, h: 30 },    // horizontal left
  { x: 860, y: 610, w: 840, h: 30 },    // horizontal right
];

// ─── Interior Door Openings (gaps in interior walls, passable) ────────────────
// isDoor:true tells the collision system to use a reduced inset so the player
// can actually pass through the narrow wall gap (wall thickness = 30px).
export const INTERIOR_DOORS = [
  { x: 830, y: 270, w: 30, h: 110, isDoor: true },   // Living ↔ Bedroom
  { x: 830, y: 740, w: 30, h: 110, isDoor: true },   // Kitchen ↔ Study
  { x: 310, y: 610, w: 110, h: 30, isDoor: true },   // Living ↔ Kitchen
  { x: 1130, y: 610, w: 110, h: 30, isDoor: true },  // Bedroom ↔ Study
];

// Walkable rects = rooms + interior door openings (used for collision)
export const WALKABLE = [...ROOMS, ...INTERIOR_DOORS];

// ─── Furniture ─────────────────────────────────────────────────────────────────
export const FURNITURE = [
  // Living Room
  { type: 'sofa',    x: 200, y: 220, w: 200, h: 70, color: '#2a3a4a' },
  { type: 'table',   x: 480, y: 380, w: 130, h: 80, color: '#2a1a10' },
  { type: 'shelf',   x: 145, y: 145, w: 60,  h: 140, color: '#1e2a18' },
  { type: 'cabinet', x: 730, y: 200, w: 65,  h: 90,  color: '#1e2a18' },
  // Kitchen
  { type: 'counter', x: 145, y: 660, w: 220, h: 55, color: '#1a2a2a' },
  { type: 'counter', x: 145, y: 980, w: 620, h: 55, color: '#1a2a2a' },
  { type: 'table',   x: 540, y: 760, w: 130, h: 90, color: '#2a1a10' },
  { type: 'fridge',  x: 750, y: 660, w: 55,  h: 90, color: '#2a3030' },
  // Bedroom
  { type: 'bed',     x: 980, y: 160, w: 190, h: 140, color: '#1a1a2a' },
  { type: 'shelf',   x: 1430, y: 155, w: 55, h: 110, color: '#1e2a18' },
  { type: 'desk',    x: 1400, y: 440, w: 160, h: 75, color: '#2a1a10' },
  // Study
  { type: 'desk',    x: 940,  y: 680, w: 160, h: 75, color: '#2a1a10' },
  { type: 'shelf',   x: 1390, y: 655, w: 55, h: 150, color: '#1e2a18' },
  { type: 'cabinet', x: 1200, y: 985, w: 110, h: 55, color: '#1e2a18' },
];

// ─── Material Spawn Zones (near furniture) ────────────────────────────────────
export const MAT_ZONES = [
  { x: 200, y: 350, r: 70 },
  { x: 560, y: 430, r: 60 },
  { x: 200, y: 720, r: 70 },
  { x: 600, y: 820, r: 65 },
  { x: 1050, y: 300, r: 75 },
  { x: 1480, y: 280, r: 65 },
  { x: 980,  y: 760, r: 70 },
  { x: 1420, y: 750, r: 65 },
];

// ─── Exterior Structures (attacked by zombies) ─────────────────────────────────
// x,y = center of structure.  facing = direction zombies come FROM
export const STRUCTURE_DEFS = [
  // Top wall (y≈115)
  { id:'win_tl',     type:'window', facing:'top',    cx:420,  cy:115,  sw:80,  sh:30 },
  { id:'win_tr',     type:'window', facing:'top',    cx:1220, cy:115,  sw:80,  sh:30 },
  { id:'door_front', type:'door',   facing:'top',    cx:800,  cy:115,  sw:60,  sh:30 },
  // Bottom wall (y≈1085)
  { id:'win_bl',     type:'window', facing:'bottom', cx:420,  cy:1085, sw:80,  sh:30 },
  { id:'win_br',     type:'window', facing:'bottom', cx:1220, cy:1085, sw:80,  sh:30 },
  { id:'door_back',  type:'door',   facing:'bottom', cx:800,  cy:1085, sw:60,  sh:30 },
  // Left wall (x≈115)
  { id:'win_ll',     type:'window', facing:'left',   cx:115,  cy:380,  sw:30,  sh:80 },
  { id:'win_lb',     type:'window', facing:'left',   cx:115,  cy:840,  sw:30,  sh:80 },
  // Right wall (x≈1685)
  { id:'win_rl',     type:'window', facing:'right',  cx:1685, cy:380,  sw:30,  sh:80 },
  { id:'win_rb',     type:'window', facing:'right',  cx:1685, cy:840,  sw:30,  sh:80 },
];

// ─── Zombie Spawn Points (outside house) ──────────────────────────────────────
export const ZOMBIE_SPAWNS = [
  { x:420,  y:30  }, { x:800,  y:30  }, { x:1220, y:30  },
  { x:420,  y:1170}, { x:800,  y:1170}, { x:1220, y:1170},
  { x:30,   y:380 }, { x:30,   y:840 },
  { x:1770, y:380 }, { x:1770, y:840 },
];

export const PLAYER_START = { x: 480, y: 360 };
export const SURVIVAL_TIME = 180; // seconds

export interface FielderPosition {
  id: number; // 1 to 11
  name: string; // Player name
  roleName: string; // Cricket fielding position name (e.g., Keeper, Bowler, Slip, Point, etc.)
  x: number; // Percentage 0 - 100 on field X axis
  y: number; // Percentage 0 - 100 on field Y axis
  isKeeper?: boolean;
  isBowler?: boolean;
  jerseyNumber?: number | string;
}

export interface FieldPositionSetup {
  presetName: string; // e.g. "Standard (Powerplay)", "Attacking Slips", "Death Overs", "Custom"
  bowlingTeamName?: string;
  fielders: FielderPosition[];
  updatedAt?: number;
}

// 30-yard ellipse constants (center = 50%, 50%)
export const INNER_CIRCLE_RX = 25; // 25% radius X
export const INNER_CIRCLE_RY = 31; // 31% radius Y
export const BOUNDARY_RADIUS = 46; // 46% radius of cricket ground

// Helper to determine if a fielder is inside the 30-yard ring
export function isFielderInsideRing(x: number, y: number): boolean {
  const dx = (x - 50) / INNER_CIRCLE_RX;
  const dy = (y - 50) / INNER_CIRCLE_RY;
  return dx * dx + dy * dy <= 1.0;
}

// Default 11 Fielder Positions matching the user's reference images
export const DEFAULT_FIELD_POSITIONS: FielderPosition[] = [
  { id: 1, name: 'Wicket Keeper', roleName: 'Wicket Keeper', x: 50, y: 31, isKeeper: true, jerseyNumber: 'WK' },
  { id: 2, name: 'Bowler', roleName: 'Bowler', x: 50, y: 64, isBowler: true, jerseyNumber: 'B' },
  { id: 3, name: 'First Slip', roleName: 'First Slip', x: 38, y: 34, jerseyNumber: 3 },
  { id: 4, name: 'Fly Slip / Gully', roleName: 'Fly Slip', x: 62, y: 38, jerseyNumber: 4 },
  { id: 5, name: 'Backward Point', roleName: 'Backward Point', x: 26, y: 47, jerseyNumber: 5 },
  { id: 6, name: 'Cover / Extra Cover', roleName: 'Extra Cover', x: 27, y: 59, jerseyNumber: 6 },
  { id: 7, name: 'Mid-Off', roleName: 'Mid-Off', x: 42, y: 65, jerseyNumber: 7 },
  { id: 8, name: 'Mid-On', roleName: 'Mid-On', x: 62, y: 65, jerseyNumber: 8 },
  { id: 9, name: 'Mid-Wicket', roleName: 'Mid-Wicket', x: 70, y: 53, jerseyNumber: 9 },
  { id: 10, name: 'Deep Fine Leg', roleName: 'Deep Fine Leg', x: 20, y: 79, jerseyNumber: 10 },
  { id: 11, name: 'Deep Mid-Wicket', roleName: 'Deep Mid-Wicket', x: 68, y: 82, jerseyNumber: 11 }
];

export const FIELDING_PRESETS: { name: string; description: string; getPositions: () => FielderPosition[] }[] = [
  {
    name: 'Powerplay (2 Deep)',
    description: 'Standard T20/ODI Powerplay setup with 9 inside the circle & 2 boundary catchers',
    getPositions: () => [
      { id: 1, name: 'Wicket Keeper', roleName: 'Wicket Keeper', x: 50, y: 31, isKeeper: true, jerseyNumber: 'WK' },
      { id: 2, name: 'Bowler', roleName: 'Bowler', x: 50, y: 64, isBowler: true, jerseyNumber: 'B' },
      { id: 3, name: 'First Slip', roleName: 'First Slip', x: 38, y: 34, jerseyNumber: 3 },
      { id: 4, name: 'Fly Slip / Gully', roleName: 'Fly Slip', x: 62, y: 38, jerseyNumber: 4 },
      { id: 5, name: 'Backward Point', roleName: 'Backward Point', x: 26, y: 47, jerseyNumber: 5 },
      { id: 6, name: 'Cover', roleName: 'Cover', x: 27, y: 59, jerseyNumber: 6 },
      { id: 7, name: 'Mid-Off', roleName: 'Mid-Off', x: 42, y: 65, jerseyNumber: 7 },
      { id: 8, name: 'Mid-On', roleName: 'Mid-On', x: 62, y: 65, jerseyNumber: 8 },
      { id: 9, name: 'Mid-Wicket', roleName: 'Mid-Wicket', x: 70, y: 53, jerseyNumber: 9 },
      { id: 10, name: 'Deep Fine Leg', roleName: 'Deep Fine Leg', x: 20, y: 79, jerseyNumber: 10 },
      { id: 11, name: 'Deep Mid-Wicket', roleName: 'Deep Mid-Wicket', x: 68, y: 82, jerseyNumber: 11 }
    ]
  },
  {
    name: 'Attacking Cordon (3 Slips)',
    description: 'Early breakthrough setup with 3 slips, gully, and tight ring',
    getPositions: () => [
      { id: 1, name: 'Wicket Keeper', roleName: 'Wicket Keeper', x: 50, y: 31, isKeeper: true, jerseyNumber: 'WK' },
      { id: 2, name: 'Bowler', roleName: 'Bowler', x: 50, y: 64, isBowler: true, jerseyNumber: 'B' },
      { id: 3, name: 'First Slip', roleName: 'First Slip', x: 42, y: 32, jerseyNumber: 3 },
      { id: 4, name: 'Second Slip', roleName: 'Second Slip', x: 36, y: 34, jerseyNumber: 4 },
      { id: 5, name: 'Third Slip', roleName: 'Third Slip', x: 30, y: 36, jerseyNumber: 5 },
      { id: 6, name: 'Gully', roleName: 'Gully', x: 26, y: 42, jerseyNumber: 6 },
      { id: 7, name: 'Point', roleName: 'Point', x: 26, y: 52, jerseyNumber: 7 },
      { id: 8, name: 'Cover', roleName: 'Cover', x: 32, y: 62, jerseyNumber: 8 },
      { id: 9, name: 'Mid-Off', roleName: 'Mid-Off', x: 44, y: 66, jerseyNumber: 9 },
      { id: 10, name: 'Mid-On', roleName: 'Mid-On', x: 60, y: 66, jerseyNumber: 10 },
      { id: 11, name: 'Fine Leg', roleName: 'Fine Leg', x: 68, y: 35, jerseyNumber: 11 }
    ]
  },
  {
    name: 'Death Overs (5 Deep)',
    description: 'Defensive boundary protection with deep cover, long-off, long-on, deep mid-wicket, and fine leg',
    getPositions: () => [
      { id: 1, name: 'Wicket Keeper', roleName: 'Wicket Keeper', x: 50, y: 31, isKeeper: true, jerseyNumber: 'WK' },
      { id: 2, name: 'Bowler', roleName: 'Bowler', x: 50, y: 64, isBowler: true, jerseyNumber: 'B' },
      { id: 3, name: 'Short Third Man', roleName: 'Short Third', x: 36, y: 38, jerseyNumber: 3 },
      { id: 4, name: 'Point', roleName: 'Point', x: 27, y: 48, jerseyNumber: 4 },
      { id: 5, name: 'Deep Point / Cover', roleName: 'Deep Cover', x: 12, y: 58, jerseyNumber: 5 },
      { id: 6, name: 'Extra Cover', roleName: 'Extra Cover', x: 34, y: 60, jerseyNumber: 6 },
      { id: 7, name: 'Long-Off', roleName: 'Long-Off', x: 38, y: 88, jerseyNumber: 7 },
      { id: 8, name: 'Long-On', roleName: 'Long-On', x: 62, y: 88, jerseyNumber: 8 },
      { id: 9, name: 'Deep Mid-Wicket', roleName: 'Deep Mid-Wicket', x: 86, y: 60, jerseyNumber: 9 },
      { id: 10, name: 'Deep Square Leg', roleName: 'Deep Square Leg', x: 80, y: 40, jerseyNumber: 10 },
      { id: 11, name: 'Deep Fine Leg', roleName: 'Deep Fine Leg', x: 65, y: 20, jerseyNumber: 11 }
    ]
  },
  {
    name: 'Spin Web (Ring & Pad)',
    description: 'Tight catching circle with short leg, silly point, and deep boundaries',
    getPositions: () => [
      { id: 1, name: 'Wicket Keeper', roleName: 'Wicket Keeper', x: 50, y: 31, isKeeper: true, jerseyNumber: 'WK' },
      { id: 2, name: 'Bowler', roleName: 'Bowler', x: 50, y: 64, isBowler: true, jerseyNumber: 'B' },
      { id: 3, name: 'Slip', roleName: 'Slip', x: 40, y: 33, jerseyNumber: 3 },
      { id: 4, name: 'Silly Point', roleName: 'Silly Point', x: 42, y: 45, jerseyNumber: 4 },
      { id: 5, name: 'Short Leg', roleName: 'Short Leg', x: 58, y: 45, jerseyNumber: 5 },
      { id: 6, name: 'Cover', roleName: 'Cover', x: 28, y: 55, jerseyNumber: 6 },
      { id: 7, name: 'Mid-Off', roleName: 'Mid-Off', x: 42, y: 65, jerseyNumber: 7 },
      { id: 8, name: 'Mid-On', roleName: 'Mid-On', x: 60, y: 65, jerseyNumber: 8 },
      { id: 9, name: 'Deep Mid-Wicket', roleName: 'Deep Mid-Wicket', x: 82, y: 68, jerseyNumber: 9 },
      { id: 10, name: 'Long-On', roleName: 'Long-On', x: 62, y: 88, jerseyNumber: 10 },
      { id: 11, name: 'Deep Point', roleName: 'Deep Point', x: 15, y: 45, jerseyNumber: 11 }
    ]
  }
];

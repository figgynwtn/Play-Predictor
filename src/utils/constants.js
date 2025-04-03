export const MAX_QUARTER_TIME = 15 * 60; // 15 minutes in seconds
export const DEFENSIVE_PLAY_TYPES = ['zone', 'man', 'blitz', 'cover2', 'cover3'];
export const DEFENSIVE_FORMATIONS = ['4-3', '3-4', 'Nickel', 'Dime'];
export const SITUATION_PRESETS = [
  { label: "1st & 10", down: 1, ydstogo: 10, yardline: 65 },
  { label: "3rd & Long", down: 3, ydstogo: 8, yardline: 45 },
  { label: "Goal Line", down: 1, ydstogo: 3, yardline: 5 },
  { label: "2 Minute Drill", timeLeft: 120, noHuddle: true },
  { label: "4th Down", down: 4, ydstogo: 2, yardline: 50 }
];
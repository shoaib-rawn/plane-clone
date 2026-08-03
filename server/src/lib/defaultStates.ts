// server/src/lib/defaultStates.ts
// Imported by the project service. This is the ONLY place these values live.
export const DEFAULT_STATES = [
  { name: 'Backlog', group: 'backlog', colour: '#9CA3AF', position: 1 },
  { name: 'Todo', group: 'unstarted', colour: '#3D4EDB', position: 2 },
  { name: 'In Progress', group: 'started', colour: '#D97706', position: 3 },
  { name: 'Done', group: 'completed', colour: '#0E8A5F', position: 4 },
  { name: 'Cancelled', group: 'cancelled', colour: '#C53030', position: 5 },
] as const;

export const PRIORITY_ORDER = ['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NONE'] as const;

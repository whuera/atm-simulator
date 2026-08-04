import { create } from 'zustand'

// ─────────────────────────────────────────────────────────────────────────
// Mini transaction console — logs the NDC-style messages sent to / received
// from the simulated authorizer switch, so the operator can see the
// terminal "talking" to the host in real time (Eclipse Console style).
// ─────────────────────────────────────────────────────────────────────────

export type ConsoleLineKind = 'info' | 'tx' | 'rx' | 'wait' | 'ok' | 'err'

export interface ConsoleLine {
  id: string
  ts: string
  kind: ConsoleLineKind
  text: string
}

interface ConsoleStore {
  lines: ConsoleLine[]
  append: (kind: ConsoleLineKind, text: string) => void
  clear: () => void
}

const MAX_LINES = 500

function nowStamp(): string {
  const d = new Date()
  const p = (n: number) => n.toString().padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

export const useConsoleStore = create<ConsoleStore>((set) => ({
  lines: [],

  append: (kind, text) =>
    set(s => {
      const next = [
        ...s.lines,
        { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ts: nowStamp(), kind, text },
      ]
      return { lines: next.length > MAX_LINES ? next.slice(next.length - MAX_LINES) : next }
    }),

  clear: () => set({ lines: [] }),
}))

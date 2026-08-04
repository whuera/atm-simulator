'use client'

import { useEffect, useRef } from 'react'
import { useConsoleStore, type ConsoleLine } from '@/store/consoleStore'

// ─────────────────────────────────────────────────────────────────────────
// NDCConsole — mini "Console view" (Eclipse IDE style) that shows the NDC
// messages the terminal exchanges with the simulated authorizer switch.
// Purely informational for the operator: proves the transaction was sent
// and lets them watch the authorization round trip happen.
// ─────────────────────────────────────────────────────────────────────────

function lineClass(kind: ConsoleLine['kind']): string {
  switch (kind) {
    case 'tx': return 'tx'
    case 'rx': return 'rx'
    case 'wait': return 'wait'
    case 'ok': return 'ok'
    case 'err': return 'err'
    default: return 'info'
  }
}

export default function NDCConsole() {
  const { lines, clear } = useConsoleStore()
  const bodyRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to the bottom as new lines arrive.
  useEffect(() => {
    const el = bodyRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines.length])

  return (
    <div className="ndc-console">
      {/* Title bar — mirrors Eclipse's Console view header */}
      <div className="ndc-console-header">
        <span style={{ fontSize: 12 }}>🖥</span>
        <span>Console — Switch Autorizador (NDC)</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 9, opacity: 0.55 }}>{lines.length} líneas</span>
        <button
          onClick={clear}
          title="Limpiar consola"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 2,
            color: '#CCCCCC',
            fontSize: 10,
            padding: '2px 7px',
            cursor: 'pointer',
            fontFamily: '"Segoe UI",Arial,sans-serif',
          }}
        >
          🗑 Limpiar
        </button>
      </div>

      {/* Scrollable log body */}
      <div className="ndc-console-body" ref={bodyRef}>
        {lines.length === 0 && (
          <div className="ndc-console-empty">
            Esperando actividad transaccional… los mensajes NDC enviados al switch aparecerán aquí.
          </div>
        )}
        {lines.map(l => (
          <div key={l.id} className={`ndc-console-line ${lineClass(l.kind)}`}>
            <span style={{ opacity: 0.5 }}>[{l.ts}]</span> {l.text}
          </div>
        ))}
      </div>
    </div>
  )
}

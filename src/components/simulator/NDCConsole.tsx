'use client'

import { useEffect, useRef } from 'react'
import { useConsoleStore, type ConsoleLine } from '@/store/consoleStore'

// ─────────────────────────────────────────────────────────────────────────
// NDCConsole — bottom-docked "Console view" (Eclipse IDE style) that shows
// the NDC messages the terminal exchanges with the simulated authorizer
// switch. Purely informational for the operator: proves the transaction
// was sent and lets them watch the authorization round trip happen.
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
    <div className="ndc-console-dock">
      {/* Tab strip — mirrors Eclipse's bottom Console / Problems / Tasks tabs */}
      <div className="editor-tabstrip">
        <div className="editor-tab active">
          <span style={{ fontSize: 12 }}>🖥</span>
          <span>Console</span>
        </div>
        <div className="editor-tab" style={{ opacity: 0.5, cursor: 'default' }}>
          <span style={{ fontSize: 12 }}>⚠</span>
          <span>Problems</span>
        </div>
        <div className="editor-tab" style={{ opacity: 0.5, cursor: 'default' }}>
          <span style={{ fontSize: 12 }}>☑</span>
          <span>Tasks</span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{
          alignSelf: 'center',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          paddingRight: 8,
        }}>
          <span style={{ fontSize: 10, color: '#777777', fontFamily: '"Segoe UI",Arial,sans-serif' }}>
            {lines.length} líneas
          </span>
          <button
            onClick={clear}
            title="Limpiar consola"
            style={{
              background: '#FFFFFF',
              border: '1px solid #C8C8C8',
              borderRadius: 2,
              color: '#555555',
              fontSize: 10,
              padding: '1px 7px',
              cursor: 'pointer',
              fontFamily: '"Segoe UI",Arial,sans-serif',
            }}
          >
            🗑 Limpiar
          </button>
        </div>
      </div>

      {/* Dark console output — NDC request/response log */}
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

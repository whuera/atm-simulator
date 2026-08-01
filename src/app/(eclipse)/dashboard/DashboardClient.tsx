'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import type { Simulator, SessionUser } from '@/lib/db/types'

interface Props {
  session: SessionUser
  simulators: Simulator[]
}

const FLOW_LABELS: Record<string, string> = {
  deposit: 'Depósito',
  withdraw: 'Retiro',
  payment: 'Pago',
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export default function DashboardClient({ session, simulators }: Props) {
  const router = useRouter()
  const [now, setNow] = useState<Date | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    setNow(new Date())
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      router.push('/login')
    }
  }

  return (
    <div className="eclipse-window">
      {/* Title bar */}
      <div className="eclipse-titlebar">
        <span>🏧</span>
        <span>ATM Simulator Platform</span>
        <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: '10px' }}>
          {session.username}@atm-simulator
        </span>
      </div>

      {/* Menu bar */}
      <div className="eclipse-menubar">
        <span className="eclipse-menu-item">Panel</span>
        <span className="eclipse-menu-item">Simuladores</span>
        <span className="eclipse-menu-item">Cuenta</span>
        <span className="eclipse-menu-item">Ayuda</span>
      </div>

      {/* Toolbar */}
      <div className="eclipse-toolbar">
        <button
          className="toolbar-btn"
          onClick={() => router.push('/dashboard')}
          title="Inicio"
        >
          🏠 Inicio
        </button>
        <button
          className="toolbar-btn"
          onClick={() => router.push('/dashboard')}
          title="Actualizar"
        >
          ↻ Actualizar
        </button>
        <div className="toolbar-sep" />
        {session.role === 'admin' && (
          <button
            className="toolbar-btn"
            onClick={() => router.push('/admin')}
            title="Panel de Administración"
          >
            ⚙ Admin
          </button>
        )}
        <div className="toolbar-sep" />
        <button
          className="toolbar-btn"
          onClick={handleLogout}
          disabled={loggingOut}
          title="Cerrar sesión"
          style={{ marginLeft: 'auto' }}
        >
          {loggingOut ? '...' : '⏻ Salir'}
        </button>
      </div>

      {/* Workbench */}
      <div className="eclipse-workbench">
        {/* Left sidebar */}
        <div className="eclipse-sidebar">
          <div className="view-header">Navegador</div>
          <div className="tree-group">
            <div className="tree-item active">
              🏠 Dashboard
            </div>
            <div
              className="tree-item"
              onClick={() => router.push('/transactions')}
            >
              📊 Mis Transacciones
            </div>
            {session.role === 'admin' && (
              <div
                className="tree-item"
                onClick={() => router.push('/admin')}
              >
                ⚙ Administración
              </div>
            )}
          </div>
        </div>

        {/* Editor area */}
        <div className="eclipse-editor-area">
          {/* Tab strip */}
          <div className="editor-tabstrip">
            <div className="editor-tab active">
              🏧 Mis Simuladores
            </div>
          </div>

          {/* Content */}
          <div className="eclipse-editor-content">
            {simulators.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  padding: '32px',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <span style={{ fontSize: '48px' }}>🏧</span>
                <div
                  className="alert alert-err"
                  style={{ maxWidth: '420px', textAlign: 'center' }}
                >
                  No tiene simuladores asignados. Contacte al administrador.
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: '16px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '16px',
                  alignContent: 'start',
                }}
              >
                {simulators.map((sim) => (
                  <SimulatorCard key={sim.id} sim={sim} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="eclipse-statusbar">
        <div className="statusbar-segment">
          Conectado como: {session.displayName} ({session.role === 'admin' ? 'administrador' : 'usuario'})
        </div>
        <div className="statusbar-segment" style={{ marginLeft: 'auto' }}>
          {now ? formatDateTime(now) : ''}
        </div>
      </div>
    </div>
  )
}

function SimulatorCard({ sim }: { sim: Simulator }) {
  return (
    <div
      className="mdi-window"
      style={{ borderLeft: `4px solid ${sim.themeColors.primary}` }}
    >
      {/* MDI title */}
      <div
        className="mdi-title"
        style={{ background: sim.themeColors.primary, color: '#FFFFFF' }}
      >
        <span>{sim.logoEmoji}</span>
        <span>{sim.bankName}</span>
      </div>

      {/* MDI toolbar */}
      <div className="mdi-toolbar">
        <span
          style={{
            fontSize: '10px',
            color: '#555',
            padding: '0 4px',
          }}
        >
          {sim.enabledFlows.length} flujo{sim.enabledFlows.length !== 1 ? 's' : ''} habilitado{sim.enabledFlows.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* MDI body */}
      <div className="mdi-body">
        <p
          style={{
            fontSize: '12px',
            color: '#444',
            marginBottom: '10px',
            lineHeight: '1.5',
          }}
        >
          {sim.description}
        </p>

        {/* Flow badges */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {sim.enabledFlows.map((flow) => (
            <span key={flow} className="badge badge-ok">
              {FLOW_LABELS[flow] ?? flow}
            </span>
          ))}
        </div>

        {/* Open simulator button */}
        <Link href={`/simulator/${sim.id}`} style={{ textDecoration: 'none' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', fontSize: '12px', height: '28px' }}
          >
            ▶ Abrir Simulador
          </button>
        </Link>
      </div>

      {/* MDI status */}
      <div className="mdi-status">
        {sim.enabledFlows.length} flujo{sim.enabledFlows.length !== 1 ? 's' : ''} habilitado{sim.enabledFlows.length !== 1 ? 's' : ''}
        &nbsp;|&nbsp;
        {sim.enabledFlows.map((f) => FLOW_LABELS[f] ?? f).join(', ')}
      </div>
    </div>
  )
}

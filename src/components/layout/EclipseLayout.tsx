'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

/* ============================================================
   Types
   ============================================================ */
export interface SidebarItem {
  id: string
  label: string
  icon: string
  href: string
  active?: boolean
  group?: string
}

export interface EclipseLayoutProps {
  session: {
    id: string
    username: string
    role: 'admin' | 'user'
    displayName: string
  }
  activeTab: string
  sidebarItems: SidebarItem[]
  children: React.ReactNode
  statusRight?: string
}

/* ============================================================
   Helper: group sidebar items by their `group` key
   ============================================================ */
function groupItems(items: SidebarItem[]): Map<string | undefined, SidebarItem[]> {
  const map = new Map<string | undefined, SidebarItem[]>()
  for (const item of items) {
    const key = item.group
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }
  return map
}

/* ============================================================
   Menubar items (decorative for MVP)
   ============================================================ */
const MENU_ITEMS = ['Panel', 'Simuladores', 'Cuenta', 'Ayuda']

/* ============================================================
   EclipseLayout component
   ============================================================ */
export default function EclipseLayout({
  session,
  activeTab,
  sidebarItems,
  children,
  statusRight,
}: EclipseLayoutProps) {
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)

  /* Live clock in status bar */
  useEffect(() => {
    function tick() {
      const now = new Date()
      const h = now.getHours().toString().padStart(2, '0')
      const m = now.getMinutes().toString().padStart(2, '0')
      const s = now.getSeconds().toString().padStart(2, '0')
      setCurrentTime(`${h}:${m}:${s}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  /* Logout handler */
  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Ignore network errors — redirect anyway
    }
    router.push('/login')
  }

  /* Role badge colors */
  const roleBadgeStyle =
    session.role === 'admin'
      ? { background: '#E05C00', color: '#fff' }
      : { background: '#0451A5', color: '#fff' }

  const grouped = groupItems(sidebarItems)

  return (
    <div className="eclipse-window">

      {/* ── Titlebar ─────────────────────────────────────────── */}
      <div className="eclipse-titlebar">
        {/* Left: app icon + name */}
        <span style={{ fontSize: '14px', flexShrink: 0 }}>🏧</span>
        <span style={{ fontWeight: 600, letterSpacing: '0.2px', flexShrink: 0 }}>
          ATM Simulator Platform
        </span>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Right: user info + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span style={{ color: '#AAAAAA', fontSize: '11px' }}>
            {session.displayName}
          </span>
          <span style={{
            ...roleBadgeStyle,
            padding: '1px 6px',
            borderRadius: '2px',
            fontSize: '10px',
            fontWeight: 'bold',
            letterSpacing: '0.3px',
            textTransform: 'uppercase' as const,
          }}>
            {session.role}
          </span>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '2px',
              color: '#CCCCCC',
              fontSize: '10px',
              padding: '2px 8px',
              cursor: loggingOut ? 'default' : 'pointer',
              fontFamily: '"Segoe UI", Arial, sans-serif',
              opacity: loggingOut ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              height: '20px',
            }}
            title="Cerrar sesión"
          >
            <span>&#x2717;</span>
            <span>{loggingOut ? 'Saliendo...' : 'Salir'}</span>
          </button>
        </div>
      </div>

      {/* ── Menubar ──────────────────────────────────────────── */}
      <div className="eclipse-menubar">
        {MENU_ITEMS.map(item => (
          <div key={item} className="eclipse-menu-item">
            {item}
          </div>
        ))}
      </div>

      {/* ── Toolbar ──────────────────────────────────────────── */}
      <div className="eclipse-toolbar">
        {/* Back */}
        <button
          className="toolbar-btn"
          onClick={() => router.back()}
          title="Atrás"
          aria-label="Navegar atrás"
        >
          <span style={{ fontSize: '12px' }}>&#x2190;</span>
        </button>

        {/* Home */}
        <button
          className="toolbar-btn"
          onClick={() => router.push(session.role === 'admin' ? '/admin' : '/dashboard')}
          title="Inicio"
          aria-label="Ir al inicio"
        >
          <span style={{ fontSize: '12px' }}>&#x2302;</span>
        </button>

        <div className="toolbar-sep" />

        {/* Refresh */}
        <button
          className="toolbar-btn"
          onClick={() => router.refresh()}
          title="Actualizar"
          aria-label="Actualizar página"
        >
          <span style={{ fontSize: '12px' }}>&#x21BB;</span>
        </button>

        <div className="toolbar-sep" />

        {/* Active tab label */}
        <span style={{
          fontSize: '11px',
          color: '#555555',
          paddingLeft: '4px',
          fontStyle: 'italic',
        }}>
          {activeTab}
        </span>
      </div>

      {/* ── Workbench ─────────────────────────────────────────── */}
      <div className="eclipse-workbench">

        {/* Sidebar */}
        <div className="eclipse-sidebar">
          <div className="view-header">
            <span>&#x1F4C2;</span>
            <span>Navegador</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            {Array.from(grouped.entries()).map(([groupName, items]) => (
              <div key={groupName ?? '__ungrouped__'} className="tree-group">
                {/* Group label */}
                {groupName && (
                  <div style={{
                    padding: '4px 8px 2px',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#777777',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    borderTop: '1px solid #E4E4E4',
                    marginTop: '2px',
                    userSelect: 'none',
                  }}>
                    {groupName}
                  </div>
                )}

                {/* Items */}
                {items.map(item => (
                  <Link
                    key={item.id}
                    href={item.href}
                    style={{ textDecoration: 'none', display: 'block' }}
                  >
                    <div className={`tree-item${item.active ? ' active' : ''}`}>
                      <span style={{ fontSize: '13px', flexShrink: 0 }}>{item.icon}</span>
                      <span style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {item.label}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Editor Area */}
        <div className="eclipse-editor-area">
          {/* Tab strip */}
          <div className="editor-tabstrip">
            <div className="editor-tab active">
              <span style={{ fontSize: '12px' }}>&#x1F4C4;</span>
              <span>{activeTab}</span>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="eclipse-editor-content">
            {children}
          </div>
        </div>

      </div>

      {/* ── Status bar ────────────────────────────────────────── */}
      <div className="eclipse-statusbar">
        {/* Left: connection info */}
        <div className="statusbar-segment">
          <span style={{
            display: 'inline-block',
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: '#28c940',
            boxShadow: '0 0 4px #28c940',
            marginRight: '5px',
            flexShrink: 0,
          }} />
          Conectado como: {session.username} ({session.role})
        </div>

        {/* Optional right text from parent */}
        {statusRight && (
          <div className="statusbar-segment">
            {statusRight}
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Current time */}
        <div className="statusbar-segment" style={{ borderRight: 'none', borderLeft: '1px solid #C8C8C8' }}>
          <span style={{ marginRight: '4px', opacity: 0.6 }}>&#x23F0;</span>
          {currentTime || '--:--:--'}
        </div>
      </div>

    </div>
  )
}

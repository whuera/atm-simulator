'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import type { Simulator, Assignment, Transaction, SessionUser, User } from '@/lib/db/types'

// ---- Types ----------------------------------------------------------------

type UserRow = Omit<User, 'passwordHash'> & { passwordHash: string }

interface Props {
  session: SessionUser
  initialUsers: UserRow[]
  initialSimulators: Simulator[]
  initialAssignments: Assignment[]
  recentTransactions: Transaction[]
}

type ActiveView = 'resumen' | 'usuarios' | 'simuladores' | 'asignaciones' | 'transacciones'

type FlowKey = 'deposit' | 'withdraw' | 'payment'

const FLOW_LABELS: Record<FlowKey, string> = {
  deposit: 'Depósito',
  withdraw: 'Retiro',
  payment: 'Pago',
}

const ALL_FLOWS: FlowKey[] = ['deposit', 'withdraw', 'payment']

// ---- Helpers ---------------------------------------------------------------

function formatDateTime(ts: string): string {
  return new Date(ts).toLocaleString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

function useClock(): string {
  const [display, setDisplay] = useState('')
  useEffect(() => {
    function tick() {
      setDisplay(
        new Date().toLocaleString('es-EC', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      )
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])
  return display
}

// ---- Empty form states -----------------------------------------------------

const EMPTY_USER_FORM = {
  username: '',
  displayName: '',
  password: '',
  role: 'user' as 'admin' | 'user',
}

const EMPTY_SIM_FORM = {
  bankName: '',
  logoEmoji: '🏦',
  description: '',
  enabledFlows: [] as FlowKey[],
  primaryColor: '#0451A5',
}

// ===========================================================================
//  ROOT COMPONENT
// ===========================================================================

export default function AdminDashboardClient({
  session,
  initialUsers,
  initialSimulators,
  initialAssignments,
  recentTransactions,
}: Props) {
  const router = useRouter()
  const clock = useClock()

  const [activeView, setActiveView] = useState<ActiveView>('resumen')
  const [users, setUsers] = useState<UserRow[]>(initialUsers)
  const [simulators, setSimulators] = useState<Simulator[]>(initialSimulators)
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments)
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      router.push('/login')
    }
  }

  // Summary counts
  const totalUsers = users.length
  const totalSimulators = simulators.length
  const activeAssignments = assignments.length
  const totalTransactions = recentTransactions.length

  return (
    <div className="eclipse-window">
      {/* ---- Title bar ---- */}
      <div className="eclipse-titlebar">
        <span>🏧</span>
        <span>ATM Simulator Platform — Panel de Administración</span>
        <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: '10px' }}>
          {session.username}@admin
        </span>
      </div>

      {/* ---- Menu bar ---- */}
      <div className="eclipse-menubar">
        <span className="eclipse-menu-item">Panel</span>
        <span className="eclipse-menu-item">Simuladores</span>
        <span className="eclipse-menu-item">Usuarios</span>
        <span className="eclipse-menu-item">Ayuda</span>
      </div>

      {/* ---- Toolbar ---- */}
      <div className="eclipse-toolbar">
        <button
          className="toolbar-btn"
          onClick={() => router.push('/dashboard')}
          title="Ir al Dashboard de usuario"
        >
          🏠 Dashboard
        </button>
        <button
          className="toolbar-btn"
          onClick={() => setActiveView('resumen')}
          title="Resumen"
        >
          📊 Resumen
        </button>
        <div className="toolbar-sep" />
        <button
          className="toolbar-btn"
          onClick={() => setActiveView('usuarios')}
          title="Gestión de usuarios"
        >
          👥 Usuarios
        </button>
        <button
          className="toolbar-btn"
          onClick={() => setActiveView('simuladores')}
          title="Gestión de simuladores"
        >
          🏧 Simuladores
        </button>
        <button
          className="toolbar-btn"
          onClick={() => setActiveView('asignaciones')}
          title="Gestión de asignaciones"
        >
          🔗 Asignaciones
        </button>
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

      {/* ---- Workbench ---- */}
      <div className="eclipse-workbench">
        {/* Left sidebar */}
        <div className="eclipse-sidebar">
          <div className="view-header">Navegación</div>

          {/* PANEL group */}
          <div className="tree-group">
            <div
              style={{
                padding: '4px 8px 2px',
                fontSize: '10px',
                fontWeight: 700,
                color: '#777',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                userSelect: 'none',
              }}
            >
              Panel
            </div>
            <div
              className={`tree-item${activeView === 'resumen' ? ' active' : ''}`}
              onClick={() => setActiveView('resumen')}
            >
              📊 Resumen
            </div>
            <div
              className={`tree-item${activeView === 'transacciones' ? ' active' : ''}`}
              onClick={() => setActiveView('transacciones')}
            >
              📋 Transacciones
            </div>
          </div>

          {/* GESTIÓN group */}
          <div className="tree-group" style={{ marginTop: '8px' }}>
            <div
              style={{
                padding: '4px 8px 2px',
                fontSize: '10px',
                fontWeight: 700,
                color: '#777',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                userSelect: 'none',
              }}
            >
              Gestión
            </div>
            <div
              className={`tree-item${activeView === 'usuarios' ? ' active' : ''}`}
              onClick={() => setActiveView('usuarios')}
            >
              👥 Usuarios
            </div>
            <div
              className={`tree-item${activeView === 'simuladores' ? ' active' : ''}`}
              onClick={() => setActiveView('simuladores')}
            >
              🏧 Simuladores
            </div>
            <div
              className={`tree-item${activeView === 'asignaciones' ? ' active' : ''}`}
              onClick={() => setActiveView('asignaciones')}
            >
              🔗 Asignaciones
            </div>
          </div>
        </div>

        {/* Editor area */}
        <div className="eclipse-editor-area">
          {/* Tab strip */}
          <div className="editor-tabstrip">
            {(
              [
                { key: 'resumen', label: '📊 Resumen' },
                { key: 'transacciones', label: '📋 Transacciones' },
                { key: 'usuarios', label: '👥 Usuarios' },
                { key: 'simuladores', label: '🏧 Simuladores' },
                { key: 'asignaciones', label: '🔗 Asignaciones' },
              ] as { key: ActiveView; label: string }[]
            ).map((tab) => (
              <div
                key={tab.key}
                className={`editor-tab${activeView === tab.key ? ' active' : ''}`}
                onClick={() => setActiveView(tab.key)}
              >
                {tab.label}
              </div>
            ))}
          </div>

          {/* View content */}
          <div className="eclipse-editor-content">
            {activeView === 'resumen' && (
              <ResumenView
                totalUsers={totalUsers}
                totalSimulators={totalSimulators}
                activeAssignments={activeAssignments}
                totalTransactions={totalTransactions}
                recentTransactions={recentTransactions}
                users={users}
                simulators={simulators}
              />
            )}
            {activeView === 'usuarios' && (
              <UsuariosView
                users={users}
                setUsers={setUsers}
              />
            )}
            {activeView === 'simuladores' && (
              <SimuladoresView
                simulators={simulators}
                setSimulators={setSimulators}
              />
            )}
            {activeView === 'asignaciones' && (
              <AsignacionesView
                users={users}
                simulators={simulators}
                assignments={assignments}
                setAssignments={setAssignments}
              />
            )}
            {activeView === 'transacciones' && (
              <TransaccionesView
                transactions={recentTransactions}
                users={users}
                simulators={simulators}
              />
            )}
          </div>
        </div>
      </div>

      {/* ---- Status bar ---- */}
      <div className="eclipse-statusbar">
        <div className="statusbar-segment">
          Sesión admin: {session.displayName}
        </div>
        <div className="statusbar-segment">
          Vista: {activeView}
        </div>
        <div className="statusbar-segment" style={{ marginLeft: 'auto' }}>
          {clock}
        </div>
      </div>
    </div>
  )
}

// ===========================================================================
//  RESUMEN VIEW
// ===========================================================================

interface ResumenViewProps {
  totalUsers: number
  totalSimulators: number
  activeAssignments: number
  totalTransactions: number
  recentTransactions: Transaction[]
  users: UserRow[]
  simulators: Simulator[]
}

function ResumenView({
  totalUsers,
  totalSimulators,
  activeAssignments,
  totalTransactions,
  recentTransactions,
  users,
  simulators,
}: ResumenViewProps) {
  const stats = [
    { label: 'Total Usuarios', value: totalUsers, emoji: '👥' },
    { label: 'Total Simuladores', value: totalSimulators, emoji: '🏧' },
    { label: 'Asignaciones Activas', value: activeAssignments, emoji: '🔗' },
    { label: 'Transacciones Totales', value: totalTransactions, emoji: '📋' },
  ]

  function getUserName(userId: string): string {
    return users.find((u) => u.id === userId)?.displayName ?? userId
  }

  function getSimulatorName(simId: string): string {
    return simulators.find((s) => s.id === simId)?.bankName ?? simId
  }

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Stats grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
        }}
      >
        {stats.map((stat) => (
          <div key={stat.label} className="mdi-window">
            <div className="mdi-title">
              {stat.emoji} {stat.label}
            </div>
            <div
              className="mdi-body"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px 8px',
              }}
            >
              <span
                style={{
                  fontSize: '36px',
                  fontWeight: 700,
                  color: '#0451A5',
                  fontFamily: 'Consolas, monospace',
                }}
              >
                {stat.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent transactions */}
      <div className="mdi-window">
        <div className="mdi-title">📋 Transacciones Recientes (últimas 5)</div>
        <div className="mdi-body" style={{ padding: 0 }}>
          <table className="grid-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Simulador</th>
                <th>Tipo</th>
                <th>Monto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.slice(0, 5).map((tx) => (
                <tr key={tx.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(tx.timestamp)}</td>
                  <td>{getUserName(tx.userId)}</td>
                  <td>{getSimulatorName(tx.simulatorId)}</td>
                  <td>{FLOW_LABELS[tx.type] ?? tx.type}</td>
                  <td style={{ fontFamily: 'Consolas, monospace', textAlign: 'right' }}>
                    {formatAmount(tx.amount)}
                  </td>
                  <td>
                    <span className={`badge ${tx.status === 'success' ? 'badge-ok' : 'badge-err'}`}>
                      {tx.status === 'success' ? 'Exitosa' : 'Cancelada'}
                    </span>
                  </td>
                </tr>
              ))}
              {recentTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#777', padding: '16px' }}>
                    Sin transacciones registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ===========================================================================
//  USUARIOS VIEW
// ===========================================================================

interface UsuariosViewProps {
  users: UserRow[]
  setUsers: React.Dispatch<React.SetStateAction<UserRow[]>>
}

interface UserFormState {
  username: string
  displayName: string
  password: string
  role: 'admin' | 'user'
}

function UsuariosView({ users, setUsers }: UsuariosViewProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<UserFormState>(EMPTY_USER_FORM)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_USER_FORM)
    setError('')
    setSuccess('')
    setShowForm(true)
  }

  function openEdit(user: UserRow) {
    setEditingId(user.id)
    setForm({
      username: user.username,
      displayName: user.displayName,
      password: '',
      role: user.role,
    })
    setError('')
    setSuccess('')
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_USER_FORM)
    setError('')
    setSuccess('')
  }

  async function handleSubmit() {
    setError('')
    setSuccess('')
    if (!form.displayName.trim()) {
      setError('El nombre es requerido.')
      return
    }
    if (!editingId && !form.username.trim()) {
      setError('El usuario es requerido.')
      return
    }
    if (!editingId && !form.password.trim()) {
      setError('La contraseña es requerida para usuarios nuevos.')
      return
    }
    setLoading(true)
    try {
      if (editingId) {
        // Update
        const body: Record<string, string> = {
          displayName: form.displayName,
          role: form.role,
        }
        if (form.password.trim()) body.password = form.password
        const res = await fetch(`/api/users/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const data = await res.json() as { error?: string }
          setError(data.error ?? 'Error al actualizar usuario.')
          return
        }
        const updated = await res.json() as UserRow
        setUsers((prev) => prev.map((u) => (u.id === editingId ? { ...updated, passwordHash: '' } : u)))
        setSuccess('Usuario actualizado correctamente.')
        cancelForm()
      } else {
        // Create
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: form.username,
            displayName: form.displayName,
            password: form.password,
            role: form.role,
          }),
        })
        if (!res.ok) {
          const data = await res.json() as { error?: string }
          setError(data.error ?? 'Error al crear usuario.')
          return
        }
        const created = await res.json() as UserRow
        setUsers((prev) => [...prev, { ...created, passwordHash: '' }])
        setSuccess('Usuario creado correctamente.')
        cancelForm()
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(user: UserRow) {
    if (!confirm(`¿Eliminar al usuario "${user.displayName}" (${user.username})? Esta acción no se puede deshacer.`)) return
    const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json() as { error?: string }
      alert(data.error ?? 'Error al eliminar usuario.')
      return
    }
    setUsers((prev) => prev.filter((u) => u.id !== user.id))
    setSuccess('Usuario eliminado.')
  }

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>
          + Nuevo Usuario
        </button>
        {showForm && (
          <button className="btn btn-sm" onClick={cancelForm}>
            Cancelar
          </button>
        )}
      </div>

      {/* Feedback */}
      {error && <div className="alert alert-err">{error}</div>}
      {success && <div className="alert alert-ok">{success}</div>}

      {/* Inline form */}
      {showForm && (
        <div className="fieldset-group">
          <span className="fieldset-legend">
            {editingId ? 'Editar Usuario' : 'Nuevo Usuario'}
          </span>

          {!editingId && (
            <div className="form-row">
              <label className="form-label req">Usuario</label>
              <input
                className="form-input med"
                type="text"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                placeholder="nombre.usuario"
                autoComplete="off"
              />
            </div>
          )}

          <div className="form-row">
            <label className="form-label req">Nombre completo</label>
            <input
              className="form-input long"
              type="text"
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              placeholder="Nombre Apellido"
            />
          </div>

          <div className="form-row">
            <label className="form-label" style={{ color: editingId ? '#777' : undefined }}>
              {editingId ? 'Nueva contraseña' : 'Contraseña *'}
            </label>
            <input
              className="form-input med"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder={editingId ? 'Dejar vacío para no cambiar' : 'Contraseña'}
              autoComplete="new-password"
            />
          </div>

          <div className="form-row">
            <label className="form-label req">Rol</label>
            <select
              className="form-select"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as 'admin' | 'user' }))}
            >
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div className="form-row" style={{ marginBottom: 0, marginTop: '4px' }}>
            <div style={{ minWidth: '100px' }} />
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear usuario'}
            </button>
            <button className="btn btn-sm" onClick={cancelForm} disabled={loading}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Users table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="grid-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Creado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td style={{ fontFamily: 'Consolas, monospace' }}>{user.username}</td>
                <td>{user.displayName}</td>
                <td>
                  <span className={`badge ${user.role === 'admin' ? 'badge-warn' : 'badge-ok'}`}>
                    {user.role === 'admin' ? 'Admin' : 'Usuario'}
                  </span>
                </td>
                <td style={{ whiteSpace: 'nowrap', color: '#555' }}>
                  {formatDateTime(user.createdAt)}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      className="btn btn-sm"
                      onClick={() => openEdit(user)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(user)}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: '#777', padding: '16px' }}>
                  No hay usuarios registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ===========================================================================
//  SIMULADORES VIEW
// ===========================================================================

interface SimuladoresViewProps {
  simulators: Simulator[]
  setSimulators: React.Dispatch<React.SetStateAction<Simulator[]>>
}

interface SimFormState {
  bankName: string
  logoEmoji: string
  description: string
  enabledFlows: FlowKey[]
  primaryColor: string
}

function SimuladoresView({ simulators, setSimulators }: SimuladoresViewProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<SimFormState>(EMPTY_SIM_FORM)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_SIM_FORM)
    setError('')
    setSuccess('')
    setShowForm(true)
  }

  function openEdit(sim: Simulator) {
    setEditingId(sim.id)
    setForm({
      bankName: sim.bankName,
      logoEmoji: sim.logoEmoji,
      description: sim.description,
      enabledFlows: [...sim.enabledFlows],
      primaryColor: sim.themeColors.primary,
    })
    setError('')
    setSuccess('')
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_SIM_FORM)
    setError('')
    setSuccess('')
  }

  function toggleFlow(flow: FlowKey) {
    setForm((f) => ({
      ...f,
      enabledFlows: f.enabledFlows.includes(flow)
        ? f.enabledFlows.filter((x) => x !== flow)
        : [...f.enabledFlows, flow],
    }))
  }

  async function handleSubmit() {
    setError('')
    setSuccess('')
    if (!form.bankName.trim()) {
      setError('El nombre del banco es requerido.')
      return
    }
    if (form.enabledFlows.length === 0) {
      setError('Debe habilitar al menos un flujo.')
      return
    }
    setLoading(true)
    const payload = {
      bankName: form.bankName,
      logoEmoji: form.logoEmoji || '🏦',
      description: form.description,
      enabledFlows: form.enabledFlows,
      themeColors: {
        primary: form.primaryColor,
        secondary: '#666666',
        screenBg: '#001800',
        screenText: '#00FF41',
      },
    }
    try {
      if (editingId) {
        const res = await fetch(`/api/simulators/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const data = await res.json() as { error?: string }
          setError(data.error ?? 'Error al actualizar simulador.')
          return
        }
        const updated = await res.json() as Simulator
        setSimulators((prev) => prev.map((s) => (s.id === editingId ? updated : s)))
        setSuccess('Simulador actualizado correctamente.')
        cancelForm()
      } else {
        const res = await fetch('/api/simulators', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const data = await res.json() as { error?: string }
          setError(data.error ?? 'Error al crear simulador.')
          return
        }
        const created = await res.json() as Simulator
        setSimulators((prev) => [...prev, created])
        setSuccess('Simulador creado correctamente.')
        cancelForm()
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(sim: Simulator) {
    if (!confirm(`¿Eliminar el simulador "${sim.bankName}"? Se eliminarán también sus asignaciones.`)) return
    const res = await fetch(`/api/simulators/${sim.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json() as { error?: string }
      alert(data.error ?? 'Error al eliminar simulador.')
      return
    }
    setSimulators((prev) => prev.filter((s) => s.id !== sim.id))
    setSuccess('Simulador eliminado.')
  }

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>
          + Nuevo Simulador
        </button>
        {showForm && (
          <button className="btn btn-sm" onClick={cancelForm}>
            Cancelar
          </button>
        )}
      </div>

      {/* Feedback */}
      {error && <div className="alert alert-err">{error}</div>}
      {success && <div className="alert alert-ok">{success}</div>}

      {/* Inline form */}
      {showForm && (
        <div className="fieldset-group">
          <span className="fieldset-legend">
            {editingId ? 'Editar Simulador' : 'Nuevo Simulador'}
          </span>

          <div className="form-row">
            <label className="form-label req">Nombre del banco</label>
            <input
              className="form-input long"
              type="text"
              value={form.bankName}
              onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
              placeholder="Banco Ejemplo S.A."
            />
          </div>

          <div className="form-row">
            <label className="form-label">Emoji logo</label>
            <input
              className="form-input"
              style={{ width: '60px', textAlign: 'center', fontSize: '18px' }}
              type="text"
              value={form.logoEmoji}
              onChange={(e) => setForm((f) => ({ ...f, logoEmoji: e.target.value }))}
              placeholder="🏦"
              maxLength={4}
            />
            <span style={{ fontSize: '11px', color: '#777' }}>Un solo emoji</span>
          </div>

          <div className="form-row" style={{ alignItems: 'flex-start' }}>
            <label className="form-label" style={{ paddingTop: '2px' }}>Descripción</label>
            <textarea
              className="form-input long"
              style={{ height: '60px', resize: 'vertical', padding: '4px 6px' }}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Descripción del simulador ATM..."
            />
          </div>

          <div className="form-row">
            <label className="form-label req">Flujos habilitados</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {ALL_FLOWS.map((flow) => (
                <label key={flow} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.enabledFlows.includes(flow)}
                    onChange={() => toggleFlow(flow)}
                  />
                  {FLOW_LABELS[flow]}
                </label>
              ))}
            </div>
          </div>

          <div className="form-row">
            <label className="form-label">Color primario</label>
            <input
              type="color"
              value={form.primaryColor}
              onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
              style={{ width: '40px', height: '22px', border: '1px solid #C8C8C8', cursor: 'pointer', padding: '0' }}
            />
            <input
              className="form-input"
              style={{ width: '90px', fontFamily: 'Consolas, monospace' }}
              type="text"
              value={form.primaryColor}
              onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
              placeholder="#0451A5"
            />
          </div>

          <div className="form-row" style={{ marginBottom: 0, marginTop: '4px' }}>
            <div style={{ minWidth: '100px' }} />
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear simulador'}
            </button>
            <button className="btn btn-sm" onClick={cancelForm} disabled={loading}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Simulators table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="grid-table">
          <thead>
            <tr>
              <th>Logo</th>
              <th>Nombre del banco</th>
              <th>Flujos habilitados</th>
              <th>Color</th>
              <th>Creado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {simulators.map((sim) => (
              <tr key={sim.id}>
                <td style={{ textAlign: 'center', fontSize: '20px' }}>{sim.logoEmoji}</td>
                <td>{sim.bankName}</td>
                <td>
                  <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                    {sim.enabledFlows.map((flow) => (
                      <span key={flow} className="badge badge-ok">
                        {FLOW_LABELS[flow] ?? flow}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        background: sim.themeColors.primary,
                        border: '1px solid #C8C8C8',
                        borderRadius: '2px',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontFamily: 'Consolas, monospace', fontSize: '11px', color: '#555' }}>
                      {sim.themeColors.primary}
                    </span>
                  </div>
                </td>
                <td style={{ whiteSpace: 'nowrap', color: '#555' }}>
                  {formatDateTime(sim.createdAt)}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn btn-sm" onClick={() => openEdit(sim)}>
                      Editar
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(sim)}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {simulators.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#777', padding: '16px' }}>
                  No hay simuladores registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ===========================================================================
//  ASIGNACIONES VIEW
// ===========================================================================

interface AsignacionesViewProps {
  users: UserRow[]
  simulators: Simulator[]
  assignments: Assignment[]
  setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>
}

function AsignacionesView({
  users,
  simulators,
  assignments,
  setAssignments,
}: AsignacionesViewProps) {
  const [saving, setSaving] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ userId: string; ok: boolean } | null>(null)

  function isAssigned(userId: string, simulatorId: string): boolean {
    return assignments.some((a) => a.userId === userId && a.simulatorId === simulatorId)
  }

  const handleToggle = useCallback(
    async (userId: string, simulatorId: string, checked: boolean) => {
      const currentSimIds = assignments
        .filter((a) => a.userId === userId)
        .map((a) => a.simulatorId)

      const newSimIds = checked
        ? [...currentSimIds, simulatorId]
        : currentSimIds.filter((id) => id !== simulatorId)

      setSaving(userId)
      setFeedback(null)
      try {
        const res = await fetch('/api/assignments', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, simulatorIds: newSimIds }),
        })
        if (!res.ok) {
          setFeedback({ userId, ok: false })
          return
        }
        setAssignments((prev) => {
          const without = prev.filter((a) => a.userId !== userId)
          const added = newSimIds.map((simId) => ({ userId, simulatorId: simId }))
          return [...without, ...added]
        })
        setFeedback({ userId, ok: true })
      } finally {
        setSaving(null)
      }
    },
    [assignments, setAssignments]
  )

  if (users.length === 0 || simulators.length === 0) {
    return (
      <div style={{ padding: '16px' }}>
        <div className="alert alert-err">
          Se necesitan usuarios y simuladores para gestionar asignaciones.
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '12px' }}>
      <p style={{ fontSize: '11px', color: '#555', marginBottom: '10px' }}>
        Marque los simuladores que desea asignar a cada usuario. Los cambios se guardan automáticamente.
      </p>

      {feedback && (
        <div className={`alert ${feedback.ok ? 'alert-ok' : 'alert-err'}`} style={{ marginBottom: '8px' }}>
          {feedback.ok ? 'Asignación actualizada.' : 'Error al actualizar asignación.'}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table className="grid-table">
          <thead>
            <tr>
              <th style={{ minWidth: '160px' }}>Usuario</th>
              {simulators.map((sim) => (
                <th key={sim.id} style={{ textAlign: 'center', minWidth: '100px' }}>
                  <div>{sim.logoEmoji}</div>
                  <div style={{ fontWeight: 600, fontSize: '10px' }}>{sim.bankName}</div>
                </th>
              ))}
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{user.displayName}</div>
                  <div style={{ fontSize: '10px', color: '#777', fontFamily: 'Consolas, monospace' }}>
                    {user.username}
                  </div>
                </td>
                {simulators.map((sim) => (
                  <td key={sim.id} style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={isAssigned(user.id, sim.id)}
                      disabled={saving === user.id}
                      onChange={(e) => handleToggle(user.id, sim.id, e.target.checked)}
                      style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                      aria-label={`Asignar ${sim.bankName} a ${user.displayName}`}
                    />
                  </td>
                ))}
                <td>
                  {saving === user.id ? (
                    <span style={{ fontSize: '11px', color: '#0451A5' }}>Guardando...</span>
                  ) : (
                    <span style={{ fontSize: '11px', color: '#777' }}>
                      {assignments.filter((a) => a.userId === user.id).length} asignado(s)
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ===========================================================================
//  TRANSACCIONES VIEW
// ===========================================================================

interface TransaccionesViewProps {
  transactions: Transaction[]
  users: UserRow[]
  simulators: Simulator[]
}

function TransaccionesView({ transactions, users, simulators }: TransaccionesViewProps) {
  function getUserName(userId: string): string {
    return users.find((u) => u.id === userId)?.displayName ?? userId
  }
  function getSimulatorName(simId: string): string {
    const sim = simulators.find((s) => s.id === simId)
    return sim ? `${sim.logoEmoji} ${sim.bankName}` : simId
  }

  return (
    <div style={{ padding: '12px' }}>
      <div style={{ overflowX: 'auto' }}>
        <table className="grid-table">
          <thead>
            <tr>
              <th>Fecha / Hora</th>
              <th>Usuario</th>
              <th>Simulador</th>
              <th>Tipo</th>
              <th style={{ textAlign: 'right' }}>Monto</th>
              <th>Servicio</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td style={{ whiteSpace: 'nowrap', fontFamily: 'Consolas, monospace', fontSize: '11px' }}>
                  {formatDateTime(tx.timestamp)}
                </td>
                <td>{getUserName(tx.userId)}</td>
                <td>{getSimulatorName(tx.simulatorId)}</td>
                <td>
                  <span className="badge badge-ok">
                    {FLOW_LABELS[tx.type] ?? tx.type}
                  </span>
                </td>
                <td style={{ fontFamily: 'Consolas, monospace', textAlign: 'right' }}>
                  {formatAmount(tx.amount)}
                </td>
                <td style={{ color: '#555', fontSize: '11px' }}>
                  {tx.serviceName ?? '—'}
                </td>
                <td>
                  <span className={`badge ${tx.status === 'success' ? 'badge-ok' : 'badge-err'}`}>
                    {tx.status === 'success' ? 'Exitosa' : 'Cancelada'}
                  </span>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: '#777', padding: '24px' }}>
                  Sin transacciones registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: '8px', fontSize: '11px', color: '#777' }}>
        Mostrando {transactions.length} transacción{transactions.length !== 1 ? 'es' : ''}
      </div>
    </div>
  )
}

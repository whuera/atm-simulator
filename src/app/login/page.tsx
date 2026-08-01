'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error al iniciar sesión')
        return
      }
      if (data.user.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-bg">
      <div className="login-dialog">

        {/* Titlebar */}
        <div className="login-titlebar">
          <span style={{ fontSize: '14px' }}>🏧</span>
          <span style={{ flex: 1 }}>ATM Simulator Platform — Inicio de sesión</span>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#28c940' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f57' }} />
          </div>
        </div>

        {/* Banner */}
        <div className="login-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
            <span style={{ fontSize: '28px', flexShrink: 0 }}>🏧</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#FFFFFF' }}>
                ATM Simulator Platform
              </div>
              <div style={{ fontSize: '11px', color: '#AAAAAA' }}>
                Sistema de entrenamiento para cajeros automáticos
              </div>
            </div>
            <div style={{ flexShrink: 0 }}>
              <span style={{
                background: '#E05C00',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: '2px',
                fontSize: '10px',
                fontWeight: 'bold',
                letterSpacing: '0.3px',
              }}>
                v1.0.0 MVP
              </span>
            </div>
          </div>
        </div>

        {/* Body / Form */}
        <form className="login-body" onSubmit={handleSubmit}>
          {error && (
            <div className="alert-err" style={{
              padding: '6px 10px',
              borderRadius: '2px',
              fontSize: '11px',
              marginBottom: '2px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          <div className="login-field">
            <label htmlFor="login-username">Usuario</label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
              placeholder="nombre.usuario"
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="login-password">Contraseña</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>

          <div style={{
            fontSize: '10px',
            color: '#888888',
            marginTop: '2px',
            textAlign: 'center',
            lineHeight: '1.5',
          }}>
            Usuarios de prueba: admin / admin123 &middot; maria.garcia / user123
          </div>
        </form>

        {/* Footer */}
        <div className="login-footer">
          ATM Simulator Platform &copy; 2024 — Uso interno / Entrenamiento
        </div>

      </div>
    </div>
  )
}

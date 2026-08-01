'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SessionUser, Transaction } from '@/lib/db/types'

interface Props {
  session: SessionUser
}

const TYPE_LABEL: Record<string, string> = {
  deposit: 'Depósito',
  withdraw: 'Retiro',
  payment: 'Pago',
}

const STATUS_LABEL: Record<string, string> = {
  success: 'Exitosa',
  cancelled: 'Cancelada',
}

function formatMoney(n: number) {
  return '$' + n.toLocaleString('es-CL')
}

export default function TransactionsClient({ session }: Props) {
  const router = useRouter()
  const [txs, setTxs] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/transactions')
      .then(r => r.json())
      .then((data: Transaction[]) => {
        setTxs(data.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="eclipse-shell">
      {/* Title bar */}
      <div className="eclipse-titlebar">
        <span>ATM Simulator Platform</span>
        <span style={{ fontSize: 10, opacity: 0.6, marginLeft: 8 }}>— Mis Transacciones</span>
      </div>

      {/* Menu bar */}
      <div className="eclipse-menubar">
        <span className="menu-item">Archivo</span>
        <span className="menu-item">Ver</span>
        <span className="menu-item">Ventana</span>
        <span className="menu-item">Ayuda</span>
      </div>

      {/* Toolbar */}
      <div className="eclipse-toolbar">
        <button
          className="toolbar-btn"
          onClick={() => router.push('/dashboard')}
          title="Volver al Dashboard"
        >
          ◀ Dashboard
        </button>
        <div className="toolbar-separator" />
        <button
          className="toolbar-btn"
          onClick={() => { setLoading(true); fetch('/api/transactions').then(r => r.json()).then((d: Transaction[]) => { setTxs(d.sort((a, b) => a.timestamp < b.timestamp ? 1 : -1)); setLoading(false) }) }}
          title="Recargar"
        >
          ↺ Actualizar
        </button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: '#666', fontFamily: '"Segoe UI",Arial,sans-serif' }}>
          {session.displayName}
        </span>
        <button className="toolbar-btn" onClick={handleLogout} title="Cerrar sesión">
          ⏻ Salir
        </button>
      </div>

      {/* Workbench */}
      <div className="eclipse-workbench">
        {/* Sidebar */}
        <div className="eclipse-sidebar">
          <div className="view-header">Navegador</div>
          <div className="tree-group">
            <div className="tree-item" onClick={() => router.push('/dashboard')}>
              🏠 Dashboard
            </div>
            <div className="tree-item active">
              📊 Mis Transacciones
            </div>
            {session.role === 'admin' && (
              <div className="tree-item" onClick={() => router.push('/admin')}>
                ⚙ Administración
              </div>
            )}
          </div>
        </div>

        {/* Editor area */}
        <div className="eclipse-editor-area">
          <div className="editor-tabstrip">
            <div className="editor-tab active">📊 Mis Transacciones</div>
          </div>

          <div className="editor-content">
            <div className="mdi-window" style={{ maxWidth: 860 }}>
              <div className="mdi-titlebar">
                <span>Historial de Transacciones</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.6 }}>
                  {!loading && `${txs.length} registro${txs.length !== 1 ? 's' : ''}`}
                </span>
              </div>
              <div className="mdi-content">
                {loading ? (
                  <div style={{ padding: 24, color: '#888', fontFamily: '"Segoe UI",Arial,sans-serif', fontSize: 12 }}>
                    Cargando...
                  </div>
                ) : txs.length === 0 ? (
                  <div style={{ padding: 24, color: '#888', fontFamily: '"Segoe UI",Arial,sans-serif', fontSize: 12 }}>
                    No hay transacciones registradas aún.
                  </div>
                ) : (
                  <table className="grid-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Monto</th>
                        <th>Servicio</th>
                        <th>Tarjeta</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {txs.map(tx => (
                        <tr key={tx.id}>
                          <td style={{ whiteSpace: 'nowrap', fontFamily: 'Consolas,monospace', fontSize: 11 }}>
                            {tx.timestamp}
                          </td>
                          <td>{TYPE_LABEL[tx.type] ?? tx.type}</td>
                          <td style={{ fontFamily: 'Consolas,monospace', textAlign: 'right' }}>
                            {formatMoney(tx.amount)}
                          </td>
                          <td style={{ color: tx.serviceName ? '#333' : '#aaa' }}>
                            {tx.serviceName ?? '—'}
                          </td>
                          <td style={{ fontFamily: 'Consolas,monospace' }}>
                            {tx.cardNumber ? `**** ${tx.cardNumber}` : '—'}
                          </td>
                          <td>
                            <span style={{
                              padding: '1px 6px', borderRadius: 2, fontSize: 10, fontWeight: 'bold',
                              background: tx.status === 'success' ? '#E6F4EA' : '#FBE9E7',
                              color: tx.status === 'success' ? '#1A7A1A' : '#C01515',
                              border: `1px solid ${tx.status === 'success' ? '#A8D5A2' : '#F4A0A0'}`,
                            }}>
                              {STATUS_LABEL[tx.status] ?? tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="eclipse-statusbar">
        <span>📊 Transacciones</span>
        <span style={{ marginLeft: 'auto' }}>ATM Simulator Platform</span>
      </div>
    </div>
  )
}

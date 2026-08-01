'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { useATMStore, type CardData, type ATMState } from '@/store/atmStore'
import type { Simulator } from '@/lib/db/types'
import type { SessionUser } from '@/lib/db/types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface SimulatorClientProps {
  simulator: Simulator
  session: SessionUser
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function formatMoney(n: number): string {
  return '$' + n.toLocaleString('es-CL')
}

function maskCardNumber(num: string): string {
  return '****' + num.slice(-4)
}

// ─────────────────────────────────────────────────────────────────────────────
// Clock hook
// ─────────────────────────────────────────────────────────────────────────────
function useClock() {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return now
}

// ─────────────────────────────────────────────────────────────────────────────
// Blink hook
// ─────────────────────────────────────────────────────────────────────────────
function useBlink(interval = 600) {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const t = setInterval(() => setVisible((v) => !v), interval)
    return () => clearInterval(t)
  }, [interval])
  return visible
}

// ─────────────────────────────────────────────────────────────────────────────
// Card Insert Modal
// ─────────────────────────────────────────────────────────────────────────────
interface CardInsertModalProps {
  onInsert: (card: CardData) => void
  onClose: () => void
}

function CardInsertModal({ onInsert, onClose }: CardInsertModalProps) {
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [error, setError] = useState('')

  function formatCardNumber(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 16)
    return digits.replace(/(.{4})/g, '$1 ').trim()
  }

  function handleCardNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCardNumber(formatCardNumber(e.target.value))
  }

  function handleExpiryChange(e: React.ChangeEvent<HTMLInputElement>) {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4)
    if (val.length >= 3) val = val.slice(0, 2) + '/' + val.slice(2)
    setExpiry(val)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const digits = cardNumber.replace(/\s/g, '')
    if (digits.length !== 16) {
      setError('El número de tarjeta debe tener 16 dígitos.')
      return
    }
    if (!cardName.trim()) {
      setError('El nombre del titular es obligatorio.')
      return
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      setError('La fecha de vencimiento debe tener el formato MM/AA.')
      return
    }
    if (!/^\d{3}$/.test(cvv)) {
      setError('El CVV debe tener 3 dígitos.')
      return
    }
    setError('')
    onInsert({ cardNumber: digits, cardName: cardName.trim(), expiry, cvv })
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        className="mdi-window"
        style={{ width: 360 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title bar */}
        <div className="mdi-title">
          <span>💳</span>
          <span>Insertar Tarjeta</span>
          <button
            onClick={onClose}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: '#CCCCCC',
              cursor: 'pointer',
              fontSize: 14,
              lineHeight: 1,
              padding: '0 2px',
            }}
            title="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="mdi-body" style={{ padding: '14px 16px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="form-row" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 3 }}>
              <label className="form-label" style={{ textAlign: 'left', minWidth: 'unset' }}>
                Número de tarjeta
              </label>
              <input
                className="form-input long mono"
                type="text"
                placeholder="XXXX XXXX XXXX XXXX"
                value={cardNumber}
                onChange={handleCardNumberChange}
                maxLength={19}
                autoFocus
                style={{ width: '100%', letterSpacing: '0.1em' }}
              />
            </div>

            <div className="form-row" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 3 }}>
              <label className="form-label" style={{ textAlign: 'left', minWidth: 'unset' }}>
                Nombre del titular
              </label>
              <input
                className="form-input"
                type="text"
                placeholder="NOMBRE APELLIDO"
                value={cardName}
                onChange={(e) => setCardName(e.target.value.toUpperCase())}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <label className="form-label" style={{ textAlign: 'left', minWidth: 'unset' }}>
                  Vencimiento
                </label>
                <input
                  className="form-input mono"
                  type="text"
                  placeholder="MM/AA"
                  value={expiry}
                  onChange={handleExpiryChange}
                  maxLength={5}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <label className="form-label" style={{ textAlign: 'left', minWidth: 'unset' }}>
                  CVV
                </label>
                <input
                  className="form-input mono"
                  type="password"
                  placeholder="•••"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  maxLength={3}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {error && (
              <div className="alert alert-err" style={{ fontSize: 11 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <button type="button" className="btn" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Insertar tarjeta
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ATM Screen Content — renders per-state UI
// ─────────────────────────────────────────────────────────────────────────────
interface ScreenContentProps {
  atmState: ATMState
  screenBg: string
  screenText: string
  simulator: Simulator
}

function ATMScreenContent({ atmState, screenBg, screenText, simulator }: ScreenContentProps) {
  const {
    card,
    pin,
    amount,
    customAmount,
    selectedService,
    lastTransaction,
    isProcessing,
  } = useATMStore()

  const now = useClock()
  const blink = useBlink(600)
  const spinChars = ['|', '/', '—', '\\']
  const [spinIdx, setSpinIdx] = useState(0)

  useEffect(() => {
    if (!isProcessing) return
    const t = setInterval(() => setSpinIdx((i) => (i + 1) % 4), 200)
    return () => clearInterval(t)
  }, [isProcessing])

  const textStyle: React.CSSProperties = { color: screenText }
  const dimTextStyle: React.CSSProperties = { color: screenText, opacity: 0.55 }
  const headerStyle: React.CSSProperties = {
    ...textStyle,
    fontSize: 11,
    fontFamily: 'Consolas, "Courier New", monospace',
    padding: '6px 8px 5px',
    borderBottom: `1px solid ${screenText}22`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  }
  const bodyStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '10px 12px',
    gap: 6,
    fontFamily: 'Consolas, "Courier New", monospace',
    overflow: 'hidden',
  }

  // ── IDLE ──────────────────────────────────────────────────────────────────
  if (atmState === 'IDLE') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={headerStyle}>
          <span style={textStyle}>
            {simulator.logoEmoji} {simulator.bankName}
          </span>
          <span style={dimTextStyle}>
            {now
              ? now.toLocaleString('es-CL', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })
              : '--'}
          </span>
        </div>
        <div
          style={{
            ...bodyStyle,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              ...textStyle,
              fontSize: 28,
              fontFamily: 'Consolas, "Courier New", monospace',
              letterSpacing: '0.05em',
            }}
          >
            Bienvenido
          </div>
          <div style={{ ...dimTextStyle, fontSize: 12, textAlign: 'center' }}>
            Inserte su tarjeta para continuar
          </div>
          <div
            style={{
              ...textStyle,
              fontSize: 18,
              marginTop: 8,
              opacity: blink ? 1 : 0,
              transition: 'opacity 0.1s',
            }}
          >
            ▶
          </div>
        </div>
      </div>
    )
  }

  // ── INSERTING_CARD ────────────────────────────────────────────────────────
  if (atmState === 'INSERTING_CARD') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={headerStyle}>
          <span style={textStyle}>Leyendo tarjeta...</span>
        </div>
        <div style={{ ...bodyStyle, alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ ...textStyle, fontSize: 22 }} className="atm-spinner">
            {spinChars[spinIdx]}
          </div>
          <div style={{ ...dimTextStyle, fontSize: 11, marginTop: 8 }}>
            Por favor espere
          </div>
        </div>
      </div>
    )
  }

  // ── EJECTING ─────────────────────────────────────────────────────────────
  if (atmState === 'EJECTING') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={headerStyle}>
          <span style={textStyle}>Expulsando tarjeta...</span>
        </div>
        <div style={{ ...bodyStyle, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <div style={{ ...textStyle, fontSize: 16 }}>💳</div>
          <div
            style={{
              ...textStyle,
              fontSize: 13,
              opacity: blink ? 1 : 0.3,
            }}
          >
            Retire su tarjeta
          </div>
        </div>
      </div>
    )
  }

  // ── PIN_ENTRY ─────────────────────────────────────────────────────────────
  if (atmState === 'PIN_ENTRY') {
    const dots = Array.from({ length: 8 }, (_, i) => i < pin.length)
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={headerStyle}>
          <span style={textStyle}>Por favor ingrese su PIN</span>
        </div>
        <div style={{ ...bodyStyle, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ ...dimTextStyle, fontSize: 11 }}>Ingrese PIN:</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {dots.map((filled, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: filled ? screenText : 'transparent',
                  border: `1.5px solid ${screenText}`,
                  opacity: filled ? 1 : 0.4,
                  transition: 'background 0.1s',
                }}
              />
            ))}
          </div>
          <div
            style={{
              ...dimTextStyle,
              fontSize: 10,
              textAlign: 'center',
              lineHeight: 1.6,
              maxWidth: 200,
            }}
          >
            ENTER para confirmar{'\n'}C para borrar | CANCEL para cancelar
          </div>
          {pin.length < 4 && (
            <div style={{ ...dimTextStyle, fontSize: 10 }}>
              Mínimo 4 dígitos ({pin.length}/8)
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── MAIN_MENU ─────────────────────────────────────────────────────────────
  if (atmState === 'MAIN_MENU') {
    const cardLast4 = card ? maskCardNumber(card.cardNumber) : '****'
    const options = ['Depósito', 'Retiro', 'Pago de Servicios', 'Salir']
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={headerStyle}>
          <span style={textStyle}>Seleccione una operación</span>
          <span style={{ ...dimTextStyle, fontSize: 10 }}>Tarjeta: {cardLast4}</span>
        </div>
        <div style={{ ...bodyStyle, justifyContent: 'space-around' }}>
          {options.map((label, i) => (
            <div
              key={i}
              style={{
                ...textStyle,
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                paddingLeft: 4,
                height: 28,
              }}
            >
              <span style={{ ...dimTextStyle, fontSize: 10 }}>F{i + 1}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── WITHDRAW (preset selection) ───────────────────────────────────────────
  if (atmState === 'WITHDRAW') {
    const presets = [10000, 20000, 50000, 100000]
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={headerStyle}>
          <span style={textStyle}>Retiro — Seleccione monto</span>
        </div>
        <div style={{ flex: 1, display: 'flex' }}>
          {/* Left column — preset amounts */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-around',
              padding: '6px 8px',
              fontFamily: 'Consolas, "Courier New", monospace',
            }}
          >
            {presets.map((p, i) => (
              <div key={i} style={{ ...textStyle, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, height: 28 }}>
                <span style={{ ...dimTextStyle, fontSize: 10 }}>F{i + 1}</span>
                <span>{formatMoney(p)}</span>
              </div>
            ))}
          </div>
          {/* Right column */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '6px 8px',
              fontFamily: 'Consolas, "Courier New", monospace',
            }}
          >
            <div style={{ ...textStyle, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, height: 28 }}>
              <span>Otro monto</span>
              <span style={{ ...dimTextStyle, fontSize: 10 }}>F1</span>
            </div>
            <div style={{ ...dimTextStyle, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, height: 28 }}>
              <span>—</span>
            </div>
            <div style={{ ...dimTextStyle, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, height: 28 }}>
              <span>—</span>
            </div>
            <div style={{ ...textStyle, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, height: 28 }}>
              <span>Cancelar</span>
              <span style={{ ...dimTextStyle, fontSize: 10 }}>F4</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── WITHDRAW_AMOUNT ───────────────────────────────────────────────────────
  if (atmState === 'WITHDRAW_AMOUNT') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={headerStyle}>
          <span style={textStyle}>Retiro — Ingrese monto</span>
        </div>
        <div style={{ ...bodyStyle, justifyContent: 'center', gap: 16 }}>
          <div style={{ ...dimTextStyle, fontSize: 11 }}>Ingrese monto de retiro:</div>
          <div
            style={{
              ...textStyle,
              fontSize: 20,
              fontFamily: 'Consolas, "Courier New", monospace',
              letterSpacing: '0.08em',
              minHeight: 30,
            }}
          >
            ${customAmount || '0'}
            <span style={{ opacity: blink ? 1 : 0 }}>_</span>
          </div>
          <div style={{ ...dimTextStyle, fontSize: 10, marginTop: 8 }}>
            ENTER para confirmar | C para borrar
          </div>
        </div>
      </div>
    )
  }

  // ── WITHDRAW_CONFIRM ──────────────────────────────────────────────────────
  if (atmState === 'WITHDRAW_CONFIRM') {
    const cardLast4 = card ? maskCardNumber(card.cardNumber) : '****'
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={headerStyle}>
          <span style={textStyle}>Confirme su retiro</span>
        </div>
        <div style={{ flex: 1, display: 'flex' }}>
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-around',
              padding: '8px 12px',
              fontFamily: 'Consolas, "Courier New", monospace',
            }}
          >
            <div style={{ ...textStyle, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div>
                <span style={dimTextStyle}>Monto:  </span>
                <span style={{ fontSize: 16 }}>{amount !== null ? formatMoney(amount) : '-'}</span>
              </div>
              <div>
                <span style={dimTextStyle}>Cuenta: </span>
                <span>{cardLast4}</span>
              </div>
            </div>
            <div style={{ ...textStyle, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, height: 28 }}>
              <span style={{ ...dimTextStyle, fontSize: 10 }}>F1</span>
              <span style={{ color: '#00ff41' }}>Confirmar</span>
            </div>
            <div style={{ height: 28 }} />
            <div style={{ height: 28 }} />
          </div>
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '8px 12px',
              fontFamily: 'Consolas, "Courier New", monospace',
            }}
          >
            <div style={{ ...textStyle, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, height: 28 }}>
              <span style={{ color: '#ff6666' }}>Cancelar</span>
              <span style={{ ...dimTextStyle, fontSize: 10 }}>F4</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── DISPENSING ────────────────────────────────────────────────────────────
  if (atmState === 'DISPENSING') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={headerStyle}>
          <span style={textStyle}>Dispensando efectivo...</span>
        </div>
        <div style={{ ...bodyStyle, alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <div style={{ ...textStyle, fontSize: 28 }} className="atm-spinner">
            {spinChars[spinIdx]}
          </div>
          <div style={{ ...textStyle, fontSize: 13 }}>
            {amount !== null ? formatMoney(amount) : ''}
          </div>
          <div style={{ ...dimTextStyle, fontSize: 11, marginTop: 4 }}>
            Por favor retire su dinero
          </div>
        </div>
      </div>
    )
  }

  // ── DEPOSIT ───────────────────────────────────────────────────────────────
  if (atmState === 'DEPOSIT') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={headerStyle}>
          <span style={textStyle}>Depósito — Seleccione tipo</span>
        </div>
        <div style={{ flex: 1, display: 'flex' }}>
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-around',
              padding: '8px 12px',
              fontFamily: 'Consolas, "Courier New", monospace',
            }}
          >
            <div style={{ ...textStyle, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, height: 28 }}>
              <span style={{ ...dimTextStyle, fontSize: 10 }}>F1</span>
              <span>Depósito en efectivo</span>
            </div>
            <div style={{ height: 28 }} />
            <div style={{ height: 28 }} />
            <div style={{ height: 28 }} />
          </div>
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '8px 12px',
              fontFamily: 'Consolas, "Courier New", monospace',
            }}
          >
            <div style={{ ...textStyle, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, height: 28 }}>
              <span style={{ color: '#ff6666' }}>Cancelar</span>
              <span style={{ ...dimTextStyle, fontSize: 10 }}>F4</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── DEPOSIT_AMOUNT ────────────────────────────────────────────────────────
  if (atmState === 'DEPOSIT_AMOUNT') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={headerStyle}>
          <span style={textStyle}>Depósito — Ingrese monto</span>
        </div>
        <div style={{ ...bodyStyle, justifyContent: 'center', gap: 16 }}>
          <div style={{ ...dimTextStyle, fontSize: 11 }}>Ingrese monto a depositar:</div>
          <div
            style={{
              ...textStyle,
              fontSize: 20,
              fontFamily: 'Consolas, "Courier New", monospace',
              letterSpacing: '0.08em',
              minHeight: 30,
            }}
          >
            ${customAmount || '0'}
            <span style={{ opacity: blink ? 1 : 0 }}>_</span>
          </div>
          <div style={{ ...dimTextStyle, fontSize: 10, marginTop: 8 }}>
            ENTER para confirmar | C para borrar
          </div>
        </div>
      </div>
    )
  }

  // ── DEPOSIT_CONFIRM ───────────────────────────────────────────────────────
  if (atmState === 'DEPOSIT_CONFIRM') {
    const cardLast4 = card ? maskCardNumber(card.cardNumber) : '****'
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={headerStyle}>
          <span style={textStyle}>Confirme su depósito</span>
        </div>
        <div style={{ flex: 1, display: 'flex' }}>
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-around',
              padding: '8px 12px',
              fontFamily: 'Consolas, "Courier New", monospace',
            }}
          >
            <div style={{ ...textStyle, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div>
                <span style={dimTextStyle}>Monto:  </span>
                <span style={{ fontSize: 16 }}>{amount !== null ? formatMoney(amount) : '-'}</span>
              </div>
              <div>
                <span style={dimTextStyle}>Cuenta: </span>
                <span>{cardLast4}</span>
              </div>
            </div>
            <div style={{ ...textStyle, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, height: 28 }}>
              <span style={{ ...dimTextStyle, fontSize: 10 }}>F1</span>
              <span style={{ color: '#00ff41' }}>Confirmar</span>
            </div>
            <div style={{ height: 28 }} />
            <div style={{ height: 28 }} />
          </div>
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '8px 12px',
              fontFamily: 'Consolas, "Courier New", monospace',
            }}
          >
            <div style={{ ...textStyle, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, height: 28 }}>
              <span style={{ color: '#ff6666' }}>Cancelar</span>
              <span style={{ ...dimTextStyle, fontSize: 10 }}>F4</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── PAYMENT (service selection) ───────────────────────────────────────────
  if (atmState === 'PAYMENT') {
    const services = ['Electricidad', 'Agua', 'Gas', 'Internet']
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={headerStyle}>
          <span style={textStyle}>Pago de Servicios — Seleccione</span>
        </div>
        <div style={{ flex: 1, display: 'flex' }}>
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-around',
              padding: '6px 12px',
              fontFamily: 'Consolas, "Courier New", monospace',
            }}
          >
            {services.map((s, i) => (
              <div key={i} style={{ ...textStyle, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, height: 28 }}>
                <span style={{ ...dimTextStyle, fontSize: 10 }}>F{i + 1}</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '6px 12px',
              fontFamily: 'Consolas, "Courier New", monospace',
            }}
          >
            <div style={{ ...textStyle, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, height: 28 }}>
              <span style={{ color: '#ff6666' }}>Cancelar</span>
              <span style={{ ...dimTextStyle, fontSize: 10 }}>F4</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── PAYMENT_AMOUNT ────────────────────────────────────────────────────────
  if (atmState === 'PAYMENT_AMOUNT') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={headerStyle}>
          <span style={textStyle}>Pago — Ingrese monto</span>
        </div>
        <div style={{ ...bodyStyle, justifyContent: 'center', gap: 14 }}>
          <div style={{ ...dimTextStyle, fontSize: 11 }}>
            Servicio: <span style={textStyle}>{selectedService}</span>
          </div>
          <div style={{ ...dimTextStyle, fontSize: 11 }}>Ingrese monto a pagar:</div>
          <div
            style={{
              ...textStyle,
              fontSize: 20,
              fontFamily: 'Consolas, "Courier New", monospace',
              letterSpacing: '0.08em',
              minHeight: 30,
            }}
          >
            ${customAmount || '0'}
            <span style={{ opacity: blink ? 1 : 0 }}>_</span>
          </div>
          <div style={{ ...dimTextStyle, fontSize: 10, marginTop: 8 }}>
            ENTER para confirmar | C para borrar
          </div>
        </div>
      </div>
    )
  }

  // ── PAYMENT_CONFIRM ───────────────────────────────────────────────────────
  if (atmState === 'PAYMENT_CONFIRM') {
    const cardLast4 = card ? maskCardNumber(card.cardNumber) : '****'
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={headerStyle}>
          <span style={textStyle}>Confirme su pago</span>
        </div>
        <div style={{ flex: 1, display: 'flex' }}>
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-around',
              padding: '8px 12px',
              fontFamily: 'Consolas, "Courier New", monospace',
            }}
          >
            <div style={{ ...textStyle, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div>
                <span style={dimTextStyle}>Servicio: </span>
                <span>{selectedService}</span>
              </div>
              <div>
                <span style={dimTextStyle}>Monto:    </span>
                <span style={{ fontSize: 15 }}>{amount !== null ? formatMoney(amount) : '-'}</span>
              </div>
              <div>
                <span style={dimTextStyle}>Cuenta:   </span>
                <span>{cardLast4}</span>
              </div>
            </div>
            <div style={{ ...textStyle, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, height: 28 }}>
              <span style={{ ...dimTextStyle, fontSize: 10 }}>F1</span>
              <span style={{ color: '#00ff41' }}>Confirmar</span>
            </div>
            <div style={{ height: 28 }} />
            <div style={{ height: 28 }} />
          </div>
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '8px 12px',
              fontFamily: 'Consolas, "Courier New", monospace',
            }}
          >
            <div style={{ ...textStyle, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, height: 28 }}>
              <span style={{ color: '#ff6666' }}>Cancelar</span>
              <span style={{ ...dimTextStyle, fontSize: 10 }}>F4</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  if (atmState === 'SUMMARY') {
    const tx = lastTransaction
    const typeLabels: Record<string, string> = {
      deposit: 'Depósito',
      withdraw: 'Retiro',
      payment: 'Pago de Servicio',
    }
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={headerStyle}>
          <span style={{ color: '#00ff41', fontFamily: 'Consolas, "Courier New", monospace' }}>
            Operacion exitosa
          </span>
        </div>
        <div
          style={{
            ...bodyStyle,
            justifyContent: 'center',
            gap: 10,
            fontFamily: 'Consolas, "Courier New", monospace',
          }}
        >
          {tx ? (
            <>
              <div style={{ ...textStyle, fontSize: 11 }}>
                <span style={dimTextStyle}>Tipo:    </span>
                <span>{typeLabels[tx.type] ?? tx.type}</span>
              </div>
              {tx.service && (
                <div style={{ ...textStyle, fontSize: 11 }}>
                  <span style={dimTextStyle}>Servicio:</span>
                  <span> {tx.service}</span>
                </div>
              )}
              <div style={{ ...textStyle, fontSize: 11 }}>
                <span style={dimTextStyle}>Monto:   </span>
                <span style={{ fontSize: 16 }}>{formatMoney(tx.amount)}</span>
              </div>
              <div style={{ ...textStyle, fontSize: 11 }}>
                <span style={dimTextStyle}>Tarjeta: </span>
                <span>****{tx.cardLast4}</span>
              </div>
              <div style={{ ...textStyle, fontSize: 11 }}>
                <span style={dimTextStyle}>Fecha:   </span>
                <span>{tx.timestamp}</span>
              </div>
            </>
          ) : (
            <div style={textStyle}>Transaccion completada</div>
          )}
          <div
            style={{
              ...dimTextStyle,
              fontSize: 10,
              marginTop: 10,
              opacity: blink ? 0.7 : 0.3,
            }}
          >
            Presione cualquier tecla para continuar
          </div>
        </div>
      </div>
    )
  }

  // Default fallback
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={dimTextStyle}>{atmState}</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Function Key Button
// ─────────────────────────────────────────────────────────────────────────────
interface FnKeyProps {
  label: string
  active: boolean
  onClick: () => void
}

function FnKey({ label, active, onClick }: FnKeyProps) {
  return (
    <button
      className="atm-fn-key"
      onClick={onClick}
      style={{
        background: active
          ? 'linear-gradient(to bottom, #4a6a4a, #2d4a2d)'
          : undefined,
        borderColor: active ? '#336633' : undefined,
        color: active ? '#88ee88' : undefined,
        boxShadow: active
          ? '0 0 6px rgba(0, 200, 0, 0.3), 0 2px 3px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)'
          : undefined,
      }}
      title={label}
    >
      {/* Small triangle indicator pointing at screen */}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Compute which function keys are "active" based on state
// ─────────────────────────────────────────────────────────────────────────────
function getActiveKeys(state: ATMState): { left: boolean[]; right: boolean[] } {
  const left = [false, false, false, false]
  const right = [false, false, false, false]

  switch (state) {
    case 'MAIN_MENU':
      left[0] = left[1] = left[2] = left[3] = true
      break
    case 'WITHDRAW':
      left[0] = left[1] = left[2] = left[3] = true
      right[0] = true
      right[3] = true
      break
    case 'DEPOSIT':
      left[0] = true
      right[3] = true
      break
    case 'PAYMENT':
      left[0] = left[1] = left[2] = left[3] = true
      right[3] = true
      break
    case 'WITHDRAW_CONFIRM':
    case 'DEPOSIT_CONFIRM':
    case 'PAYMENT_CONFIRM':
      left[0] = true
      right[3] = true
      break
    case 'SUMMARY':
      left[0] = left[1] = left[2] = left[3] = true
      right[0] = right[1] = right[2] = right[3] = true
      break
    default:
      break
  }

  return { left, right }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main SimulatorClient component
// ─────────────────────────────────────────────────────────────────────────────
export default function SimulatorClient({ simulator, session }: SimulatorClientProps) {
  const store = useATMStore()
  const { state: atmState, pressKey, pressFunctionKey, insertCard, reset } = store

  const [showCardModal, setShowCardModal] = useState(false)
  const [ledBlink, setLedBlink] = useState(true)
  const transactionPosted = useRef(false)

  // ── LED blink for IDLE / EJECTING ────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setLedBlink((v) => !v), 800)
    return () => clearInterval(t)
  }, [])

  // ── Reset store on mount ──────────────────────────────────────────────────
  useEffect(() => {
    reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulator.id])

  // ── Post transaction when SUMMARY is reached ──────────────────────────────
  useEffect(() => {
    if (atmState === 'SUMMARY' && store.lastTransaction && !transactionPosted.current) {
      transactionPosted.current = true
      const tx = store.lastTransaction
      fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulatorId: simulator.id,
          type: tx.type,
          amount: tx.amount,
          serviceName: tx.service ?? undefined,
          status: tx.status,
          cardNumber: tx.cardLast4,
        }),
      }).catch(() => {
        // Silently ignore — best effort logging
      })
    }
    if (atmState !== 'SUMMARY') {
      transactionPosted.current = false
    }
  }, [atmState, store.lastTransaction, simulator.id])

  // ── Physical keyboard ─────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't intercept when a modal input has focus
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        pressKey(e.key)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        pressKey('ENTER')
      } else if (e.key === 'Escape') {
        e.preventDefault()
        pressKey('CANCEL')
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        pressKey('CLEAR')
      } else if (e.key === '*') {
        e.preventDefault()
        pressKey('CLEAR')
      }
    },
    [pressKey]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // ── Card slot click ───────────────────────────────────────────────────────
  function handleCardSlotClick() {
    if (atmState === 'IDLE') {
      setShowCardModal(true)
    }
  }

  function handleCardInsert(card: CardData) {
    setShowCardModal(false)
    insertCard(card)
  }

  // ── Theme colors ──────────────────────────────────────────────────────────
  const { screenBg, screenText, primary } = simulator.themeColors

  // ── Active fn keys ────────────────────────────────────────────────────────
  const { left: leftActive, right: rightActive } = getActiveKeys(atmState)

  // ── LED color ─────────────────────────────────────────────────────────────
  let ledClass = 'atm-led green'
  if (atmState === 'IDLE') ledClass = ledBlink ? 'atm-led green' : 'atm-led off'
  if (atmState === 'EJECTING') ledClass = ledBlink ? 'atm-led yellow' : 'atm-led off'
  if (atmState === 'DISPENSING') ledClass = 'atm-led yellow'
  if (atmState === 'PIN_ENTRY') ledClass = 'atm-led green'

  // ── Keypad layout ─────────────────────────────────────────────────────────
  const keypadKeys: { label: string; key: string; wide?: boolean }[] = [
    { label: '7', key: '7' },
    { label: '8', key: '8' },
    { label: '9', key: '9' },
    { label: '4', key: '4' },
    { label: '5', key: '5' },
    { label: '6', key: '6' },
    { label: '1', key: '1' },
    { label: '2', key: '2' },
    { label: '3', key: '3' },
    { label: 'C', key: 'CLEAR' },
    { label: '0', key: '0' },
    { label: 'OK', key: 'ENTER' },
  ]

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#1a1a1a',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
      }}
    >
      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <div
        style={{
          height: 40,
          background: '#2B2D3A',
          borderBottom: '1px solid #111',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 12,
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <Link
          href="/dashboard"
          style={{
            color: '#AAAAAA',
            fontSize: 12,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontFamily: '"Segoe UI", Arial, sans-serif',
          }}
        >
          <span style={{ fontSize: 14 }}>◀</span>
          <span>Volver al panel</span>
        </Link>

        <div
          style={{
            width: 1,
            height: 20,
            background: '#444',
            flexShrink: 0,
          }}
        />

        <span
          style={{
            color: '#CCCCCC',
            fontSize: 12,
            fontFamily: '"Segoe UI", Arial, sans-serif',
          }}
        >
          {simulator.logoEmoji} {simulator.bankName}
        </span>

        <div style={{ flex: 1 }} />

        <span
          style={{
            color: '#777',
            fontSize: 11,
            fontFamily: '"Segoe UI", Arial, sans-serif',
          }}
        >
          {session.displayName} ({session.role})
        </span>

        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#00c040',
            boxShadow: '0 0 4px #00c040',
            flexShrink: 0,
          }}
        />
      </div>

      {/* ── ATM centered area ──────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 80px',
          minHeight: 0,
        }}
      >
        {/* ── ATM Chassis ──────────────────────────────────────────────────── */}
        <div className="atm-chassis">

          {/* ── Brand bar ─────────────────────────────────────────────────── */}
          <div
            className="atm-brand-bar"
            style={{ background: `linear-gradient(to right, ${primary}22, ${primary}44, ${primary}22)` }}
          >
            <span style={{ fontSize: 20 }}>{simulator.logoEmoji}</span>
            <span
              style={{
                color: '#DDDDDD',
                fontSize: 14,
                fontWeight: 600,
                fontFamily: '"Segoe UI", Arial, sans-serif',
                letterSpacing: '0.05em',
              }}
            >
              {simulator.bankName}
            </span>
            <div style={{ flex: 1 }} />
            <span
              style={{
                color: '#666',
                fontSize: 10,
                fontFamily: 'Consolas, "Courier New", monospace',
              }}
            >
              ATM v2.1
            </span>
          </div>

          {/* ── Screen bezel ──────────────────────────────────────────────── */}
          <div className="atm-screen-bezel">
            {/* Left function keys */}
            <div className="atm-fn-keys-left">
              {leftActive.map((active, i) => (
                <FnKey
                  key={i}
                  label={`F${i + 1}`}
                  active={active}
                  onClick={() => pressFunctionKey('left', i)}
                />
              ))}
            </div>

            {/* Screen surface */}
            <div
              className="atm-screen"
              style={{ background: screenBg, minHeight: 280 }}
            >
              {/* Scanline overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage:
                    'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)',
                  pointerEvents: 'none',
                  zIndex: 2,
                }}
              />
              {/* Vignette */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.35) 100%)',
                  pointerEvents: 'none',
                  zIndex: 3,
                }}
              />

              {/* Actual content */}
              <div style={{ position: 'relative', zIndex: 4, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <ATMScreenContent
                  atmState={atmState}
                  screenBg={screenBg}
                  screenText={screenText}
                  simulator={simulator}
                />
              </div>
            </div>

            {/* Right function keys */}
            <div className="atm-fn-keys-right">
              {rightActive.map((active, i) => (
                <FnKey
                  key={i}
                  label={`F${i + 1}`}
                  active={active}
                  onClick={() => pressFunctionKey('right', i)}
                />
              ))}
            </div>
          </div>

          {/* ── Card slot area ────────────────────────────────────────────── */}
          <div className="atm-card-slot-area">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* LED indicator */}
              <span className={ledClass} />

              {/* Slot label */}
              <span
                style={{
                  color: '#555',
                  fontSize: 9,
                  fontFamily: 'Consolas, "Courier New", monospace',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {atmState === 'IDLE' ? 'INSERTE TARJETA' : atmState === 'EJECTING' ? 'RETIRE TARJETA' : 'TARJETA INSERTADA'}
              </span>

              {/* Slot */}
              <div
                className="atm-card-slot"
                onClick={handleCardSlotClick}
                style={{
                  cursor: atmState === 'IDLE' ? 'pointer' : 'default',
                  borderColor: atmState === 'IDLE' ? '#556655' : '#333',
                  boxShadow:
                    atmState === 'IDLE'
                      ? 'inset 0 1px 3px rgba(0,0,0,0.8), 0 0 4px rgba(0,128,0,0.2)'
                      : 'inset 0 1px 3px rgba(0,0,0,0.8)',
                }}
                title={atmState === 'IDLE' ? 'Haga clic para insertar tarjeta' : undefined}
              >
                {atmState !== 'IDLE' && (
                  <div
                    style={{
                      width: 60,
                      height: 4,
                      background: '#444',
                      borderRadius: 1,
                      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* ── Numeric Keypad ────────────────────────────────────────────── */}
          <div className="atm-keypad">
            {keypadKeys.map(({ label, key }) => (
              <button
                key={key}
                className="atm-key"
                onClick={() => pressKey(key)}
                style={{
                  background:
                    key === 'ENTER'
                      ? 'linear-gradient(to bottom, #2a4a2a, #1a2e1a)'
                      : key === 'CLEAR'
                      ? 'linear-gradient(to bottom, #4a2a2a, #2e1a1a)'
                      : undefined,
                  borderColor:
                    key === 'ENTER'
                      ? '#336633'
                      : key === 'CLEAR'
                      ? '#663333'
                      : undefined,
                  color:
                    key === 'ENTER'
                      ? '#88cc88'
                      : key === 'CLEAR'
                      ? '#cc8888'
                      : undefined,
                  fontSize: key === 'ENTER' || key === 'CLEAR' ? 10 : undefined,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Receipt / cash slot ───────────────────────────────────────── */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              marginTop: 10,
              width: 'calc(100% - 48px)',
            }}
          >
            <span
              style={{
                color: '#444',
                fontSize: 9,
                fontFamily: 'Consolas, "Courier New", monospace',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {atmState === 'DISPENSING' ? 'RETIRO DE EFECTIVO' : 'RANURA DE RECIBO'}
            </span>
            <div
              className="atm-receipt-slot"
              style={{
                width: '100%',
                boxShadow:
                  atmState === 'DISPENSING'
                    ? 'inset 0 1px 4px rgba(0,0,0,0.7), 0 0 8px rgba(200,200,0,0.3)'
                    : undefined,
              }}
            />
          </div>

          {/* ── Bottom label ─────────────────────────────────────────────── */}
          <div
            style={{
              marginTop: 8,
              color: '#333',
              fontSize: 9,
              fontFamily: 'Consolas, "Courier New", monospace',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            ATM SIMULATOR PLATFORM
          </div>
        </div>
      </div>

      {/* ── Card Insert Modal ──────────────────────────────────────────────── */}
      {showCardModal && (
        <CardInsertModal
          onInsert={handleCardInsert}
          onClose={() => setShowCardModal(false)}
        />
      )}
    </div>
  )
}

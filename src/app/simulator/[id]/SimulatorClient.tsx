'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { useATMStore, type CardData, type ATMState } from '@/store/atmStore'
import type { Simulator, SessionUser } from '@/lib/db/types'
import NDCConsole from '@/components/simulator/NDCConsole'

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
function formatMoney(n: number) {
  return '$' + n.toLocaleString('es-CL')
}
function maskPAN(pan: string) {
  return '**** **** **** ' + pan.slice(-4)
}

// ─────────────────────────────────────────────────────────────────────────────
// Hooks
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

function useBlink(ms = 600) {
  const [v, setV] = useState(true)
  useEffect(() => {
    const t = setInterval(() => setV(p => !p), ms)
    return () => clearInterval(t)
  }, [ms])
  return v
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen layout — options per state
// Each state defines 4 left-side labels and 4 right-side labels.
// null = empty slot (no key active).
// These labels align 1-to-1 with the fn key columns rendered inside the screen.
// ─────────────────────────────────────────────────────────────────────────────
type Opt = string | null
type Opts4 = [Opt, Opt, Opt, Opt]

interface ScreenLayout {
  left: Opts4
  right: Opts4
}

const NONE: Opts4 = [null, null, null, null]

function getScreenLayout(state: ATMState): ScreenLayout {
  switch (state) {
    case 'MAIN_MENU':
      return {
        left: ['Depósito', 'Retiro', 'Pago Servicios', 'Salir'],
        right: ['Consulta Saldo', null, null, null],
      }
    case 'WITHDRAW':
      return {
        left: ['$10.000', '$20.000', '$50.000', '$100.000'],
        right: ['Otro monto', null, null, 'Cancelar'],
      }
    case 'DEPOSIT':
      return { left: ['En efectivo', null, null, null], right: [null, null, null, 'Cancelar'] }
    case 'PAYMENT':
      return {
        left: ['Electricidad', 'Agua', 'Gas', 'Internet'],
        right: [null, null, null, 'Cancelar'],
      }
    case 'WITHDRAW_CONFIRM':
    case 'DEPOSIT_CONFIRM':
    case 'PAYMENT_CONFIRM':
      return { left: ['✓ Confirmar', null, null, null], right: [null, null, null, '✗ Cancelar'] }
    case 'AUTHORIZING':
      return { left: NONE, right: NONE }
    case 'SUMMARY':
    case 'BALANCE_RESULT':
      return { left: ['Continuar', null, null, null], right: NONE }
    default:
      return { left: NONE, right: NONE }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FnKeyCol — physical-looking fn key buttons rendered INSIDE the screen edges.
// Each col has exactly 4 slots with justify-content:space-around so they align
// pixel-perfect with the OptionsCol next to them.
// ─────────────────────────────────────────────────────────────────────────────
interface FnKeyColProps {
  opts: Opts4
  side: 'left' | 'right'
  onPress: (i: number) => void
  screenText: string
}

function FnKeyCol({ opts, side, onPress, screenText }: FnKeyColProps) {
  return (
    <div
      style={{
        width: 28,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        padding: '6px 0',
        background: 'rgba(0,0,0,0.45)',
        borderRight: side === 'left' ? `1px solid ${screenText}12` : undefined,
        borderLeft: side === 'right' ? `1px solid ${screenText}12` : undefined,
      }}
    >
      {opts.map((label, i) => {
        const active = label !== null
        return (
          <button
            key={i}
            onClick={active ? () => onPress(i) : undefined}
            title={label ?? ''}
            style={{
              height: 26,
              margin: '0 3px',
              background: active
                ? `rgba(0,90,0,0.7)`
                : 'rgba(10,10,10,0.6)',
              border: active
                ? `1px solid ${screenText}50`
                : '1px solid rgba(40,40,40,0.5)',
              borderRadius: 2,
              cursor: active ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
              color: active ? screenText : 'rgba(35,35,35,0.9)',
              transition: 'background 0.1s',
              padding: 0,
              flexShrink: 0,
              boxShadow: active
                ? `0 0 5px ${screenText}25, inset 0 1px 0 rgba(255,255,255,0.05)`
                : 'none',
            }}
          >
            {active ? (side === 'left' ? '▶' : '◀') : ''}
          </button>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// OptionsCol — text labels aligned with the fn key buttons.
// Uses the same justify-content:space-around and padding as FnKeyCol.
// ─────────────────────────────────────────────────────────────────────────────
interface OptionsColProps {
  opts: Opts4
  side: 'left' | 'right'
  screenText: string
  onPress: (i: number) => void
}

function OptionsCol({ opts, side, screenText, onPress }: OptionsColProps) {
  const isLeft = side === 'left'
  return (
    <div
      style={{
        width: 88,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        padding: '6px 0',
      }}
    >
      {opts.map((label, i) => (
        <div
          key={i}
          onClick={() => label && onPress(i)}
          style={{
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: isLeft ? 'flex-start' : 'flex-end',
            padding: isLeft ? '0 6px 0 5px' : '0 5px 0 6px',
            color: label ? screenText : 'transparent',
            fontSize: 10,
            fontFamily: 'Consolas, "Courier New", monospace',
            cursor: label ? 'pointer' : 'default',
            borderBottom: `1px dotted ${screenText}14`,
            userSelect: 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={label ?? ''}
        >
          {label ?? ''}
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CenterContent — state-specific content in the middle of the screen
// ─────────────────────────────────────────────────────────────────────────────
interface CenterProps {
  atmState: ATMState
  screenText: string
  now: Date | null
}

function CenterContent({ atmState, screenText, now }: CenterProps) {
  const {
    card, pin, amount, customAmount, selectedService, selectedFlow,
    lastTransaction, lastBalance, isProcessing,
  } = useATMStore()
  const blink = useBlink()
  const spinChars = ['|', '/', '—', '\\']
  const [spinIdx, setSpinIdx] = useState(0)

  useEffect(() => {
    if (!isProcessing) return
    const t = setInterval(() => setSpinIdx(i => (i + 1) % 4), 180)
    return () => clearInterval(t)
  }, [isProcessing])

  const t: React.CSSProperties = { color: screenText, fontFamily: 'Consolas,"Courier New",monospace' }
  const d: React.CSSProperties = { ...t, opacity: 0.5 }
  const wrap: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 6px',
    gap: 8,
    overflow: 'hidden',
  }

  const typeLabels: Record<string, string> = {
    deposit: 'Depósito',
    withdraw: 'Retiro',
    payment: 'Pago de Servicio',
  }

  switch (atmState) {
    case 'IDLE':
      return (
        <div style={wrap}>
          <div style={{ ...t, fontSize: 20, letterSpacing: '0.04em' }}>Bienvenido</div>
          <div style={{ ...d, fontSize: 9, textAlign: 'center', lineHeight: 1.5 }}>
            Ingrese los datos de su tarjeta
            <br />en el panel lateral →
          </div>
          <div style={{ ...t, fontSize: 14, opacity: blink ? 1 : 0 }}>▶</div>
          <div style={{ ...d, fontSize: 8, marginTop: 4 }}>
            {now?.toLocaleString('es-CL', {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            }) ?? ''}
          </div>
        </div>
      )

    case 'INSERTING_CARD':
      return (
        <div style={wrap}>
          <div style={{ ...t, fontSize: 18 }}>{spinChars[spinIdx]}</div>
          <div style={{ ...t, fontSize: 11 }}>Leyendo tarjeta...</div>
          <div style={{ ...d, fontSize: 9 }}>Por favor espere</div>
        </div>
      )

    case 'EJECTING':
      return (
        <div style={wrap}>
          <div style={{ ...t, fontSize: 13 }}>💳</div>
          <div style={{ ...t, fontSize: 11, opacity: blink ? 1 : 0.3 }}>Retire su tarjeta</div>
          <div style={{ ...d, fontSize: 9 }}>del panel lateral</div>
        </div>
      )

    case 'PIN_ENTRY': {
      const dots = Array.from({ length: 8 }, (_, i) => i < pin.length)
      return (
        <div style={wrap}>
          <div style={{ ...d, fontSize: 9 }}>Ingrese su PIN:</div>
          <div style={{ display: 'flex', gap: 5 }}>
            {dots.map((filled, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  width: 11, height: 11,
                  borderRadius: '50%',
                  background: filled ? screenText : 'transparent',
                  border: `1.5px solid ${screenText}`,
                  opacity: filled ? 1 : 0.3,
                  transition: 'background 0.08s',
                }}
              />
            ))}
          </div>
          <div style={{ ...d, fontSize: 8, textAlign: 'center', lineHeight: 1.6 }}>
            OK confirmar · C borrar · CANC salir
          </div>
          <div style={{ ...d, fontSize: 8 }}>
            {pin.length}/8{pin.length >= 4 ? ' ✓' : ` (mín. 4)`}
          </div>
        </div>
      )
    }

    case 'MAIN_MENU': {
      const last4 = card ? '**** ' + card.cardNumber.slice(-4) : '****'
      const typeLabel = card?.cardType === 'credit' ? 'CRÉDITO' : 'DÉBITO'
      return (
        <div style={{ ...wrap, alignItems: 'flex-start', gap: 6 }}>
          <div style={{ ...d, fontSize: 8, borderBottom: `1px solid ${screenText}20`, paddingBottom: 5, width: '100%' }}>
            {typeLabel} · {last4}
          </div>
          <div style={{ ...t, fontSize: 10, marginTop: 2 }}>Seleccione operación</div>
          <div style={{ ...d, fontSize: 8, lineHeight: 1.6 }}>
            Use las teclas de la izquierda
          </div>
        </div>
      )
    }

    case 'WITHDRAW':
      return (
        <div style={{ ...wrap, alignItems: 'flex-start', gap: 6 }}>
          <div style={{ ...t, fontSize: 10 }}>Retiro de efectivo</div>
          <div style={{ ...d, fontSize: 8, lineHeight: 1.6 }}>
            Seleccione monto (izq.)
            <br />u &quot;Otro monto&quot; (der.)
          </div>
        </div>
      )

    case 'WITHDRAW_AMOUNT':
    case 'DEPOSIT_AMOUNT':
    case 'PAYMENT_AMOUNT': {
      const titles: Record<string, string> = {
        WITHDRAW_AMOUNT: 'Monto de retiro',
        DEPOSIT_AMOUNT: 'Monto a depositar',
        PAYMENT_AMOUNT: `Monto — ${selectedService}`,
      }
      return (
        <div style={wrap}>
          <div style={{ ...d, fontSize: 9 }}>{titles[atmState]}:</div>
          <div style={{ ...t, fontSize: 22, letterSpacing: '0.05em' }}>
            ${customAmount || '0'}
            <span style={{ opacity: blink ? 1 : 0 }}>_</span>
          </div>
          <div style={{ ...d, fontSize: 8 }}>OK confirmar · C borrar</div>
        </div>
      )
    }

    case 'WITHDRAW_CONFIRM':
    case 'DEPOSIT_CONFIRM':
    case 'PAYMENT_CONFIRM': {
      const last4 = card ? card.cardNumber.slice(-4) : '****'
      const label =
        atmState === 'WITHDRAW_CONFIRM' ? 'Retiro'
          : atmState === 'DEPOSIT_CONFIRM' ? 'Depósito' : 'Pago'
      return (
        <div style={{ ...wrap, alignItems: 'flex-start', gap: 6 }}>
          <div style={{ ...t, fontSize: 10, marginBottom: 4 }}>Confirme {label}</div>
          {atmState === 'PAYMENT_CONFIRM' && (
            <div style={{ ...t, fontSize: 9 }}>
              <span style={d}>Servicio: </span>{selectedService}
            </div>
          )}
          <div style={{ ...t, fontSize: 14 }}>
            <span style={d}>Monto: </span>{amount != null ? formatMoney(amount) : '—'}
          </div>
          <div style={{ ...t, fontSize: 8 }}>
            <span style={d}>Tarjeta: </span>**** {last4}
          </div>
        </div>
      )
    }

    case 'AUTHORIZING': {
      const flowLabel =
        selectedFlow === 'balance' ? 'consulta de saldo'
          : selectedFlow === 'withdraw' ? 'retiro'
          : selectedFlow === 'deposit' ? 'depósito' : 'pago'
      return (
        <div style={wrap}>
          <div style={{ ...t, fontSize: 18 }}>{spinChars[spinIdx]}</div>
          <div style={{ ...t, fontSize: 11 }}>Autorizando {flowLabel}...</div>
          <div style={{ ...d, fontSize: 8, textAlign: 'center', lineHeight: 1.5 }}>
            Conectando con switch transaccional
            <br />por favor espere
          </div>
        </div>
      )
    }

    case 'BALANCE_RESULT': {
      const last4 = card ? card.cardNumber.slice(-4) : '****'
      return (
        <div style={{ ...wrap, alignItems: 'flex-start', gap: 5 }}>
          <div style={{ ...t, fontSize: 11, color: '#00ff88' }}>✓ Consulta de saldo</div>
          <div style={{ ...t, fontSize: 9 }}>
            <span style={d}>Tarjeta: </span>**** {last4}
          </div>
          <div style={{ ...d, fontSize: 9, marginTop: 4 }}>Saldo disponible:</div>
          <div style={{ ...t, fontSize: 20 }}>
            {lastBalance != null ? formatMoney(lastBalance) : '—'}
          </div>
          <div style={{ ...d, fontSize: 8, marginTop: 4, opacity: blink ? 0.7 : 0.25 }}>
            Presione F1 para continuar
          </div>
        </div>
      )
    }

    case 'DISPENSING':
      return (
        <div style={wrap}>
          <div style={{ ...t, fontSize: 20 }}>{spinChars[spinIdx]}</div>
          <div style={{ ...t, fontSize: 13 }}>{amount != null ? formatMoney(amount) : ''}</div>
          <div style={{ ...d, fontSize: 10 }}>Dispensando efectivo...</div>
          <div style={{ ...d, fontSize: 8, opacity: blink ? 0.6 : 0.2 }}>Por favor retire su dinero</div>
        </div>
      )

    case 'DEPOSIT':
      return (
        <div style={{ ...wrap, alignItems: 'flex-start', gap: 6 }}>
          <div style={{ ...t, fontSize: 10 }}>Depósito</div>
          <div style={{ ...d, fontSize: 8 }}>Seleccione tipo (izquierda)</div>
        </div>
      )

    case 'PAYMENT':
      return (
        <div style={{ ...wrap, alignItems: 'flex-start', gap: 6 }}>
          <div style={{ ...t, fontSize: 10 }}>Pago de Servicios</div>
          <div style={{ ...d, fontSize: 8 }}>Seleccione el servicio (izquierda)</div>
        </div>
      )

    case 'SUMMARY': {
      const tx = lastTransaction
      return (
        <div style={{ ...wrap, alignItems: 'flex-start', gap: 5 }}>
          <div style={{ ...t, fontSize: 11, color: '#00ff88' }}>✓ Operación exitosa</div>
          {tx && (
            <>
              <div style={{ ...t, fontSize: 9 }}>
                <span style={d}>Tipo:    </span>{typeLabels[tx.type] ?? tx.type}
              </div>
              {tx.service && (
                <div style={{ ...t, fontSize: 9 }}>
                  <span style={d}>Servicio:</span> {tx.service}
                </div>
              )}
              <div style={{ ...t, fontSize: 13 }}>
                <span style={d}>Monto:   </span>{formatMoney(tx.amount)}
              </div>
              <div style={{ ...t, fontSize: 8 }}>
                <span style={d}>Tarjeta: </span>****{tx.cardLast4}
              </div>
              <div style={{ ...t, fontSize: 8 }}>
                <span style={d}>Fecha:   </span>{tx.timestamp}
              </div>
            </>
          )}
          <div style={{ ...d, fontSize: 8, marginTop: 4, opacity: blink ? 0.7 : 0.25 }}>
            Presione F1 para continuar
          </div>
        </div>
      )
    }

    default:
      return (
        <div style={wrap}>
          <span style={d}>{atmState}</span>
        </div>
      )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ATMScreen — full screen component with integrated fn key columns
// Layout: [fn-left] [opts-left] [center] [opts-right] [fn-right]
// All 5 columns share the same height and justify-content:space-around
// so fn keys and their option labels are pixel-perfect aligned.
// ─────────────────────────────────────────────────────────────────────────────
interface ATMScreenProps {
  atmState: ATMState
  screenBg: string
  screenText: string
  simulator: Simulator
  pressFunctionKey: (side: 'left' | 'right', index: number) => void
}

function ATMScreen({ atmState, screenBg, screenText, simulator, pressFunctionKey }: ATMScreenProps) {
  const now = useClock()
  const { left: leftOpts, right: rightOpts } = getScreenLayout(atmState)

  return (
    <div
      className="atm-screen"
      style={{ background: screenBg, minHeight: 300, flexDirection: 'column' }}
    >
      {/* CRT scanlines overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
        backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.07) 2px,rgba(0,0,0,0.07) 4px)',
      }} />
      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3,
        background: 'radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,0.4) 100%)',
      }} />

      {/* All content above overlays */}
      <div style={{ position: 'relative', zIndex: 4, flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Header bar — bank name + time */}
        <div style={{
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '5px 8px',
          borderBottom: `1px solid ${screenText}20`,
          background: `rgba(0,0,0,0.25)`,
          fontFamily: 'Consolas,"Courier New",monospace',
          fontSize: 10, color: screenText,
        }}>
          <span>{simulator.logoEmoji} {simulator.bankName}</span>
          <span style={{ opacity: 0.45, fontSize: 9 }}>
            {now?.toLocaleString('es-CL', {
              hour: '2-digit', minute: '2-digit', second: '2-digit',
            }) ?? '--:--:--'}
          </span>
        </div>

        {/* Body row — fn keys + option labels + center */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Left fn key column */}
          <FnKeyCol
            opts={leftOpts}
            side="left"
            screenText={screenText}
            onPress={i => pressFunctionKey('left', i)}
          />

          {/* Left option labels */}
          <OptionsCol
            opts={leftOpts}
            side="left"
            screenText={screenText}
            onPress={i => pressFunctionKey('left', i)}
          />

          {/* Center state content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <CenterContent atmState={atmState} screenText={screenText} now={now} />
          </div>

          {/* Right option labels */}
          <OptionsCol
            opts={rightOpts}
            side="right"
            screenText={screenText}
            onPress={i => pressFunctionKey('right', i)}
          />

          {/* Right fn key column */}
          <FnKeyCol
            opts={rightOpts}
            side="right"
            screenText={screenText}
            onPress={i => pressFunctionKey('right', i)}
          />
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CardReaderPanel — right-side panel for entering/viewing card data
// ─────────────────────────────────────────────────────────────────────────────
interface CardReaderPanelProps {
  atmState: ATMState
  card: CardData | null
  onInsert: (card: CardData) => void
  onEject: () => void
  primary: string
}

function CardReaderPanel({ atmState, card, onInsert, onEject, primary }: CardReaderPanelProps) {
  const [pan, setPan] = useState('')
  const [cardName, setCardName] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [cardType, setCardType] = useState<'debit' | 'credit'>('debit')
  const [error, setError] = useState('')

  const isIdle = atmState === 'IDLE'

  function formatPAN(val: string) {
    const d = val.replace(/\D/g, '').slice(0, 16)
    return d.replace(/(.{4})/g, '$1 ').trim()
  }

  function handleExpiryChange(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value.replace(/\D/g, '').slice(0, 4)
    if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2)
    setExpiry(v)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const digits = pan.replace(/\s/g, '')
    if (digits.length !== 16) { setError('El PAN debe tener 16 dígitos'); return }
    if (!cardName.trim()) { setError('Ingrese el nombre del titular'); return }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) { setError('Vencimiento: formato MM/AA'); return }
    if (!/^\d{3,4}$/.test(cvv)) { setError('CVV: 3 ó 4 dígitos'); return }
    onInsert({ cardNumber: digits, cardName: cardName.trim(), expiry, cvv, cardType })
    setPan(''); setCardName(''); setExpiry(''); setCvv(''); setError('')
  }

  return (
    <div style={{
      width: '100%',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      background: '#F0F0F0',
      border: '1px solid #C8C8C8',
      borderRadius: 2,
      alignSelf: 'flex-start',
      maxHeight: 'calc(100vh - 320px)',
      overflowY: 'auto',
    }}>
      {/* Title bar */}
      <div style={{
        height: 26, flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '0 8px',
        background: 'linear-gradient(#EAEAEA,#D8D8D8)',
        borderBottom: '1px solid #C8C8C8',
      }}>
        <span style={{ fontSize: 13 }}>💳</span>
        <span style={{ fontSize: 11, fontWeight: 'bold', color: '#333', fontFamily: '"Segoe UI",Arial,sans-serif' }}>
          Lector de Tarjeta
        </span>
        <span style={{
          marginLeft: 'auto',
          padding: '1px 6px', borderRadius: 2,
          fontSize: 9, fontWeight: 'bold',
          background: isIdle ? '#A06000' : '#167516',
          color: '#fff',
        }}>
          {isIdle ? 'EN ESPERA' : 'INSERTADA'}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {card && !isIdle ? (
          /* ── Card info display ─────────────────────────────── */
          <>
            <div style={{
              background: '#FAFAFA', border: '1px solid #D4D4D4',
              borderRadius: 2, padding: '10px 12px',
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 22 }}>💳</span>
                <span style={{
                  fontSize: 10, fontWeight: 'bold', color: '#0451A5',
                  fontFamily: '"Segoe UI",Arial,sans-serif', textTransform: 'uppercase',
                }}>
                  Tarjeta de {card.cardType === 'credit' ? 'Crédito' : 'Débito'}
                </span>
              </div>
              <InfoRow label="PAN"         value={maskPAN(card.cardNumber)} mono />
              <InfoRow label="Titular"     value={card.cardName} />
              <InfoRow label="Vencimiento" value={card.expiry} mono />
              <InfoRow label="CVV"         value="***" mono />
            </div>
            <button
              onClick={onEject}
              className="btn btn-danger"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              ⏏ Expulsar tarjeta
            </button>
            <p style={{ fontSize: 9, color: '#888', textAlign: 'center', fontFamily: '"Segoe UI",Arial,sans-serif' }}>
              O presione <kbd style={{ border: '1px solid #ccc', borderRadius: 2, padding: '0 3px', background: '#f4f4f4' }}>ESC</kbd> en el teclado
            </p>
          </>
        ) : (
          /* ── Card data entry form ──────────────────────────── */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>

            {/* Card type toggle */}
            <div>
              <div style={{ fontSize: 9, color: '#555', fontWeight: 'bold', fontFamily: '"Segoe UI",Arial,sans-serif', marginBottom: 4 }}>
                Tipo de tarjeta
              </div>
              <div style={{ display: 'flex', gap: 14 }}>
                {(['debit', 'credit'] as const).map(t => (
                  <label
                    key={t}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      cursor: 'pointer', fontSize: 11,
                      fontFamily: '"Segoe UI",Arial,sans-serif', color: '#333',
                    }}
                  >
                    <input
                      type="radio"
                      name="cardType"
                      value={t}
                      checked={cardType === t}
                      onChange={() => setCardType(t)}
                      style={{ accentColor: primary }}
                    />
                    {t === 'debit' ? 'Débito' : 'Crédito'}
                  </label>
                ))}
              </div>
            </div>

            {/* PAN */}
            <FormField label="PAN (Número de tarjeta)">
              <input
                className="form-input mono"
                type="text"
                placeholder="XXXX XXXX XXXX XXXX"
                value={pan}
                onChange={e => setPan(formatPAN(e.target.value))}
                maxLength={19}
                autoFocus
                style={{ width: '100%', letterSpacing: '0.1em' }}
              />
            </FormField>

            {/* Cardholder */}
            <FormField label="Nombre del titular">
              <input
                className="form-input"
                type="text"
                placeholder="NOMBRE APELLIDO"
                value={cardName}
                onChange={e => setCardName(e.target.value.toUpperCase())}
                style={{ width: '100%' }}
              />
            </FormField>

            {/* Expiry + CVV */}
            <div style={{ display: 'flex', gap: 8 }}>
              <FormField label="Vencimiento" style={{ flex: 1 }}>
                <input
                  className="form-input mono"
                  type="text"
                  placeholder="MM/AA"
                  value={expiry}
                  onChange={handleExpiryChange}
                  maxLength={5}
                  style={{ width: '100%' }}
                />
              </FormField>
              <FormField label="CVV" style={{ flex: 1 }}>
                <input
                  className="form-input mono"
                  type="password"
                  placeholder="•••"
                  value={cvv}
                  onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  style={{ width: '100%' }}
                />
              </FormField>
            </div>

            {error && (
              <div style={{
                fontSize: 10, color: '#C01515',
                background: '#FFF2F2', border: '1px solid #F4A0A0',
                padding: '4px 8px', borderRadius: 2,
              }}>
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 2 }}
            >
              💳 Simular lectura de tarjeta
            </button>

            <p style={{
              fontSize: 9, color: '#999', textAlign: 'center',
              fontFamily: '"Segoe UI",Arial,sans-serif', lineHeight: 1.4,
            }}>
              Ingrese datos ficticios — sin validación Luhn
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────────────────────
function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'baseline' }}>
      <span style={{ fontSize: 9, color: '#777', fontFamily: '"Segoe UI",Arial,sans-serif', minWidth: 68, flexShrink: 0 }}>
        {label}:
      </span>
      <span style={{
        fontSize: 11, color: '#1a1a1a', fontWeight: 'bold',
        fontFamily: mono ? 'Consolas,monospace' : '"Segoe UI",Arial,sans-serif',
        wordBreak: 'break-all',
      }}>
        {value}
      </span>
    </div>
  )
}

function FormField({
  label, children, style,
}: {
  label: string
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, ...style }}>
      <label style={{ fontSize: 9, color: '#555', fontWeight: 'bold', fontFamily: '"Segoe UI",Arial,sans-serif' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main SimulatorClient
// ─────────────────────────────────────────────────────────────────────────────
export default function SimulatorClient({ simulator, session }: SimulatorClientProps) {
  const store = useATMStore()
  const {
    state: atmState, pressKey, pressFunctionKey, insertCard, cancel, reset, setSimulatorContext,
  } = store
  const transactionPosted = useRef(false)
  const [ledBlink, setLedBlink] = useState(true)

  // LED blink
  useEffect(() => {
    const t = setInterval(() => setLedBlink(v => !v), 800)
    return () => clearInterval(t)
  }, [])

  // Reset store when simulator changes, and tell it which terminal (LUNO)
  // to identify itself as when talking to the switch autorizador.
  useEffect(() => {
    reset()
    setSimulatorContext(simulator.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulator.id])

  // Log transaction once when SUMMARY is reached
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
          serviceName: tx.service,
          status: tx.status,
          cardNumber: tx.cardLast4,
        }),
      }).catch(() => {})
    }
    if (atmState !== 'SUMMARY') transactionPosted.current = false
  }, [atmState, store.lastTransaction, simulator.id])

  // Physical keyboard support
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key >= '0' && e.key <= '9') { e.preventDefault(); pressKey(e.key) }
      else if (e.key === 'Enter') { e.preventDefault(); pressKey('ENTER') }
      else if (e.key === 'Escape') { e.preventDefault(); pressKey('CANCEL') }
      else if (e.key === 'Backspace' || e.key === '*') { e.preventDefault(); pressKey('CLEAR') }
    },
    [pressKey]
  )
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const { screenBg, screenText, primary } = simulator.themeColors

  // LED state
  let ledClass = 'atm-led off'
  if (atmState === 'IDLE') ledClass = ledBlink ? 'atm-led green' : 'atm-led off'
  else if (atmState === 'EJECTING') ledClass = ledBlink ? 'atm-led yellow' : 'atm-led off'
  else if (atmState === 'DISPENSING') ledClass = 'atm-led yellow'
  else ledClass = 'atm-led green'

  const keypadKeys = [
    { label: '7', key: '7' }, { label: '8', key: '8' }, { label: '9', key: '9' },
    { label: '4', key: '4' }, { label: '5', key: '5' }, { label: '6', key: '6' },
    { label: '1', key: '1' }, { label: '2', key: '2' }, { label: '3', key: '3' },
    { label: 'C', key: 'CLEAR' }, { label: '0', key: '0' }, { label: 'OK', key: 'ENTER' },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1a1a1a',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'auto',
    }}>
      {/* ── Top navigation bar ─────────────────────────────────────────── */}
      <div style={{
        height: 40, flexShrink: 0,
        background: '#2B2D3A', borderBottom: '1px solid #111',
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12,
      }}>
        <Link
          href="/dashboard"
          style={{ color: '#AAAAAA', fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5, fontFamily: '"Segoe UI",Arial,sans-serif' }}
        >
          <span style={{ fontSize: 14 }}>◀</span>
          <span>Volver al panel</span>
        </Link>
        <div style={{ width: 1, height: 20, background: '#444' }} />
        <span style={{ color: '#CCCCCC', fontSize: 12, fontFamily: '"Segoe UI",Arial,sans-serif' }}>
          {simulator.logoEmoji} {simulator.bankName}
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ color: '#888', fontSize: 10, fontFamily: '"Segoe UI",Arial,sans-serif' }}>
          {session.displayName} ({session.role})
        </span>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00c040', boxShadow: '0 0 4px #00c040' }} />
      </div>

      {/* ── Main area: ATM + Card Reader Panel ─────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '28px 32px',
        gap: 24,
      }}>

        {/* ── ATM Chassis ──────────────────────────────────────────────── */}
        <div className="atm-chassis">

          {/* Brand bar */}
          <div
            className="atm-brand-bar"
            style={{ background: `linear-gradient(to right,${primary}22,${primary}44,${primary}22)` }}
          >
            <span style={{ fontSize: 20 }}>{simulator.logoEmoji}</span>
            <span style={{
              color: '#DDD', fontSize: 14, fontWeight: 600,
              fontFamily: '"Segoe UI",Arial,sans-serif', letterSpacing: '0.05em',
            }}>
              {simulator.bankName}
            </span>
            <div style={{ flex: 1 }} />
            <span style={{ color: '#555', fontSize: 9, fontFamily: 'Consolas,monospace' }}>ATM v2.1</span>
          </div>

          {/* Screen bezel */}
          <div className="atm-screen-bezel">
            <ATMScreen
              atmState={atmState}
              screenBg={screenBg}
              screenText={screenText}
              simulator={simulator}
              pressFunctionKey={pressFunctionKey}
            />
          </div>

          {/* Card slot — decorative, reflects state via LED */}
          <div className="atm-card-slot-area">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={ledClass} />
              <span style={{
                color: '#555', fontSize: 9,
                fontFamily: 'Consolas,monospace',
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {atmState === 'IDLE'
                  ? 'SIN TARJETA'
                  : atmState === 'EJECTING'
                  ? 'RETIRE TARJETA'
                  : 'TARJETA INSERTADA'}
              </span>
              <div
                className="atm-card-slot"
                style={{
                  cursor: 'default',
                  borderColor: atmState !== 'IDLE' ? '#334433' : '#333',
                }}
              >
                {atmState !== 'IDLE' && atmState !== 'INSERTING_CARD' && (
                  <div style={{
                    width: 60, height: 4,
                    background: '#336633',
                    borderRadius: 1,
                    boxShadow: `0 0 4px ${screenText}40, inset 0 1px 2px rgba(0,0,0,0.5)`,
                  }} />
                )}
              </div>
            </div>
          </div>

          {/* Numeric keypad */}
          <div className="atm-keypad">
            {keypadKeys.map(({ label, key }) => (
              <button
                key={key}
                className="atm-key"
                onClick={() => pressKey(key)}
                style={{
                  background:
                    key === 'ENTER'
                      ? 'linear-gradient(to bottom,#2a4a2a,#1a2e1a)'
                      : key === 'CLEAR'
                      ? 'linear-gradient(to bottom,#4a2a2a,#2e1a1a)'
                      : undefined,
                  borderColor:
                    key === 'ENTER' ? '#336633' : key === 'CLEAR' ? '#663333' : undefined,
                  color:
                    key === 'ENTER' ? '#88cc88' : key === 'CLEAR' ? '#cc8888' : undefined,
                  fontSize: key === 'ENTER' || key === 'CLEAR' ? 10 : undefined,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Receipt / cash slot */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 4, marginTop: 10, width: 'calc(100% - 48px)',
          }}>
            <span style={{
              color: '#444', fontSize: 9, fontFamily: 'Consolas,monospace',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              {atmState === 'DISPENSING' ? 'RETIRO DE EFECTIVO' : 'RANURA DE RECIBO'}
            </span>
            <div
              className="atm-receipt-slot"
              style={{
                width: '100%',
                boxShadow: atmState === 'DISPENSING'
                  ? 'inset 0 1px 4px rgba(0,0,0,0.7),0 0 8px rgba(200,200,0,0.3)'
                  : undefined,
              }}
            />
          </div>

          {/* Bottom label */}
          <div style={{
            marginTop: 8, color: '#333', fontSize: 9,
            fontFamily: 'Consolas,monospace', letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            ATM SIMULATOR PLATFORM
          </div>
        </div>

        {/* ── Right column: Card Reader + NDC Console ──────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 300, flexShrink: 0 }}>
          <CardReaderPanel
            atmState={atmState}
            card={store.card}
            onInsert={insertCard}
            onEject={cancel}
            primary={primary}
          />

          {/* Mini console — shows the NDC messages exchanged with the
              simulated authorizer switch, Eclipse Console style. */}
          <NDCConsole />
        </div>
      </div>
    </div>
  )
}

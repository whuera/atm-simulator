// ─────────────────────────────────────────────────────────────────────────
// Simplified NDC-style (NCR Direct Connect) message builder.
//
// Educational/simulator use only — this is NOT a byte-accurate
// implementation of the real Diebold 91x / NCR NDC wire protocol.
// Field names and framing (STX / FS / ETX / LRC) mirror the real protocol
// closely enough for training purposes: to show operators what "hitting
// the authorizer switch" looks like from the terminal's point of view.
// No real cardholder data ever flows through here — the simulator only
// ever carries fictitious data entered by the operator.
// ─────────────────────────────────────────────────────────────────────────

// Control characters as they'd appear on the real wire (kept for reference —
// not sent over HTTP, only used to compute an illustrative LRC checksum).
export const STX = '\x02'
export const ETX = '\x03'
export const FS = '\x1C' // field separator

// Printable stand-ins used when rendering the message to the console —
// control characters are not printable.
const GLYPH = { STX: '<STX>', ETX: '<ETX>', FS: ' ␟ ' }

export type NDCTxnType = 'withdraw' | 'deposit' | 'payment' | 'balance'

const TXN_TYPE_CODE: Record<NDCTxnType, string> = {
  withdraw: '01',
  deposit: '21',
  payment: '54',
  balance: '31',
}

const TXN_TYPE_LABEL: Record<NDCTxnType, string> = {
  withdraw: 'Retiro de Efectivo',
  deposit: 'Depósito',
  payment: 'Pago de Servicio',
  balance: 'Consulta de Saldo',
}

// Simple in-memory STAN (System Trace Audit Number) counter — resets
// whenever the server process restarts, which is fine for a simulator.
let stanCounter = Math.floor(Math.random() * 900000) + 1

function nextSTAN(): string {
  stanCounter = (stanCounter % 999999) + 1
  return stanCounter.toString().padStart(6, '0')
}

function maskPAN(pan: string): string {
  if (pan.length <= 10) return pan
  return pan.slice(0, 6) + '*'.repeat(pan.length - 10) + pan.slice(-4)
}

function lrc(payload: string): string {
  let x = 0
  for (let i = 0; i < payload.length; i++) x ^= payload.charCodeAt(i)
  return x.toString(16).toUpperCase().padStart(2, '0')
}

function terminalLUNO(simulatorId: string): string {
  const digits = simulatorId.replace(/\D/g, '') || '1'
  return digits.padStart(8, '0').slice(-8)
}

function nowTag(): string {
  const d = new Date()
  const p = (n: number) => n.toString().padStart(2, '0')
  return `${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

export interface NDCField {
  label: string
  value: string
}

export interface NDCMessage {
  raw: string
  fields: NDCField[]
  stan: string
  luno: string
}

export interface NDCRequestParams {
  simulatorId: string
  txnType: NDCTxnType
  amount: number | null
  cardNumber: string // fake PAN entered in the simulator
  expiry: string      // MM/YY
  serviceName?: string
}

export function buildNDCRequest(p: NDCRequestParams): NDCMessage {
  const stan = nextSTAN()
  const luno = terminalLUNO(p.simulatorId)
  const track2 = `;${maskPAN(p.cardNumber)}=${p.expiry.replace('/', '')}101...?`
  const amountField = Math.max(0, p.amount ?? 0).toString().padStart(12, '0')
  const dt = nowTag()

  const wireParts = [
    '01', // message class: transaction request
    track2,
    TXN_TYPE_CODE[p.txnType],
    amountField,
    '152', // currency numeric code (CLP)
    stan,
    dt,
    luno,
  ]
  const raw = `${GLYPH.STX}${wireParts.join(GLYPH.FS)}${GLYPH.ETX} LRC:${lrc(wireParts.join(''))}`

  const fields: NDCField[] = [
    { label: 'MsgClass', value: '01 (Transaction Request)' },
    { label: 'Terminal (LUNO)', value: luno },
    { label: 'Track2', value: track2 },
    { label: 'TxnType', value: `${TXN_TYPE_CODE[p.txnType]} - ${TXN_TYPE_LABEL[p.txnType]}` },
  ]
  if (p.serviceName) fields.push({ label: 'Servicio', value: p.serviceName })
  fields.push(
    {
      label: 'Amount',
      value: p.amount != null ? `${amountField} ($${p.amount.toLocaleString('es-CL')})` : '000000000000',
    },
    { label: 'Currency', value: '152 (CLP)' },
    { label: 'STAN', value: stan },
    { label: 'Date/Time', value: dt },
  )

  return { raw, fields, stan, luno }
}

export interface NDCResponseParams {
  stan: string
  luno: string
  amount: number | null
  approved: boolean
  balance?: number
}

export function buildNDCResponse(p: NDCResponseParams): NDCMessage {
  const respCode = p.approved ? '00' : '05'
  const approvalCode = p.approved
    ? Math.floor(100000 + Math.random() * 900000).toString()
    : '------'
  const amountField = Math.max(0, p.amount ?? 0).toString().padStart(12, '0')

  const wireParts = [
    '02', // message class: authorization response
    respCode,
    approvalCode,
    p.stan,
    amountField,
  ]
  const raw = `${GLYPH.STX}${wireParts.join(GLYPH.FS)}${GLYPH.ETX} LRC:${lrc(wireParts.join(''))}`

  const fields: NDCField[] = [
    { label: 'MsgClass', value: '02 (Authorization Response)' },
    { label: 'RespCode', value: `${respCode} - ${p.approved ? 'APROBADA' : 'RECHAZADA'}` },
    { label: 'ApprovalCode', value: approvalCode },
    { label: 'STAN', value: p.stan },
    { label: 'Amount', value: amountField },
  ]
  if (p.balance != null) {
    fields.push({ label: 'Saldo Disponible', value: `$${p.balance.toLocaleString('es-CL')}` })
  }

  return { raw, fields, stan: p.stan, luno: p.luno }
}

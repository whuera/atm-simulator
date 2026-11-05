// ─────────────────────────────────────────────────────────────────────────
// "El ATM por dentro" — the timeline the isometric figure plays while a
// transaction runs. Pure data, no DOM. Every step names the module that
// does the work, so the drawing, the readout and the text below the card
// all come from the same source.
// ─────────────────────────────────────────────────────────────────────────

export type ModuleId =
  | 'reader' | 'epp' | 'pc' | 'hsm' | 'nic' | 'switch' | 'issuer' | 'dispenser' | 'printer'

export interface TraceResponse {
  approved: boolean
  code: string
  raw: string
}

/** One transaction as the figure sees it — filled by the ATM store. */
export interface Trace {
  id: number
  txnType: 'withdraw' | 'deposit' | 'payment' | 'balance'
  amount: number | null
  maskedPan: string
  stan: string
  luno: string
  ndcRaw: string
  response: TraceResponse | null
  failed: boolean
}

export interface Step {
  module: ModuleId
  /** seconds from the start of the trace */
  at: number
  title: string
  text: (t: Trace) => string
  /** short readout for the card corner */
  readout: (t: Trace) => string
}

const ISO_PROC: Record<Trace['txnType'], string> = {
  withdraw: '011000', deposit: '210000', payment: '500000', balance: '311000',
}

const money = (n: number | null) => (n == null ? '—' : `$${n.toLocaleString('es-CL')}`)

export const STEPS: Step[] = [
  {
    module: 'reader', at: 0, title: 'Lectura de tarjeta',
    text: t => `El lector motorizado arrastra la tarjeta y lee el chip EMV / banda magnética: obtiene el Track 2 (PAN ${t.maskedPan} y vencimiento). El PAN completo nunca sale del ATM en claro.`,
    readout: t => `Track2 · ${t.maskedPan}`,
  },
  {
    module: 'epp', at: 1.6, title: 'PIN cifrado en el teclado (EPP)',
    text: () => 'El PIN se cifró dentro del Encrypting PIN Pad en cuanto lo digitaste: arma un PIN block ISO 9564 formato 0 (PIN ⊕ PAN) y lo cifra con 3DES usando la llave de trabajo (PIN key). Ni la PC del ATM conoce el PIN.',
    readout: () => 'PIN block · 3DES',
  },
  {
    module: 'pc', at: 3.2, title: 'Armado del mensaje NDC',
    text: t => `La aplicación del ATM (sobre XFS) arma la Transaction Request NDC: clase 01, Track 2, código de transacción, monto ${money(t.amount)}, moneda 152, STAN ${t.stan} y LUNO ${t.luno}, separados por FS y enmarcados con STX…ETX + LRC.`,
    readout: t => `NDC 01 · STAN ${t.stan}`,
  },
  {
    module: 'hsm', at: 5.0, title: 'Seguridad: MAC y canal cifrado',
    text: () => 'El módulo de seguridad calcula un MAC sobre el mensaje (integridad: nadie puede cambiar el monto en el camino) y la conexión con el host viaja por un canal TLS/VPN.',
    readout: () => 'MAC · TLS',
  },
  {
    module: 'nic', at: 6.4, title: 'Envío al switch',
    text: t => `La tarjeta de red envía el mensaje por TCP/IP al switch transaccional, identificándose como la terminal LUNO ${t.luno}.`,
    readout: t => `TCP → switch · LUNO ${t.luno}`,
  },
  {
    module: 'switch', at: 7.8, title: 'Switch: NDC → ISO 8583',
    text: t => `El switch valida el MAC, traduce el PIN block a la llave de la red en su HSM y convierte el mensaje NDC a ISO 8583: MTI 0200, bitmap, DE2 PAN, DE3 ${ISO_PROC[t.txnType]}, DE4 monto, DE11 STAN ${t.stan}, DE41 terminal. Luego lo enruta al banco emisor según el BIN.`,
    readout: t => `ISO 8583 · 0200 · DE3 ${ISO_PROC[t.txnType]}`,
  },
  {
    module: 'issuer', at: 9.2, title: 'Autorización del emisor',
    text: t => t.response
      ? `El core del banco emisor verifica PIN, saldo y límites y responde un 0210 con DE39 = ${t.response.code} (${t.response.approved ? 'aprobada' : 'rechazada'}).`
      : 'El core del banco emisor verifica PIN, saldo y límites…',
    readout: t => (t.response ? `0210 · DE39 ${t.response.code}` : '0200 · esperando…'),
  },
  {
    module: 'switch', at: 10.4, title: 'Regreso: ISO 8583 → NDC',
    text: () => 'El switch traduce el 0210 de vuelta a una respuesta NDC (Transaction Reply) con las instrucciones para el ATM: qué pantalla mostrar, qué dispensar y qué imprimir.',
    readout: t => (t.response ? `NDC reply · ${t.response.code}` : 'NDC reply'),
  },
  {
    module: 'pc', at: 11.8, title: 'El ATM ejecuta la respuesta',
    text: t => t.txnType === 'withdraw'
      ? 'La PC del ATM ordena al dispensador contar y entregar los billetes, imprime el comprobante y envía el Ready (confirmación) al host.'
      : 'La PC del ATM muestra el resultado en pantalla, imprime el comprobante y envía el Ready (confirmación) al host.',
    readout: t => (t.response?.approved ? 'Aprobada · ✓' : 'Rechazada'),
  },
]

/** The store holds the ATM screen until the reply reaches the ATM. */
export const TRACE_HOLD_MS = STEPS[STEPS.length - 1].at * 1000
/** Whole figure timeline, delivery included. */
export const TRACE_TOTAL = STEPS[STEPS.length - 1].at + 1.8
/** The figure waits here (issuer step) until the switch really answered. */
export const WAIT_STEP = STEPS.findIndex(s => s.module === 'issuer')

export function stepAt(seconds: number): number {
  let i = 0
  for (let k = 0; k < STEPS.length; k++) if (seconds >= STEPS[k].at) i = k
  return i
}

export function maskPan(pan: string): string {
  return pan.length <= 10 ? pan : pan.slice(0, 6) + '*'.repeat(pan.length - 10) + pan.slice(-4)
}

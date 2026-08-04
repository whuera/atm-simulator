import { create } from 'zustand'
import { buildNDCRequest } from '@/lib/ndc'
import { useConsoleStore } from './consoleStore'

export type ATMState =
  | 'IDLE'
  | 'INSERTING_CARD'
  | 'PIN_ENTRY'
  | 'MAIN_MENU'
  | 'WITHDRAW'
  | 'WITHDRAW_AMOUNT'
  | 'WITHDRAW_CONFIRM'
  | 'DISPENSING'
  | 'DEPOSIT'
  | 'DEPOSIT_AMOUNT'
  | 'DEPOSIT_CONFIRM'
  | 'PAYMENT'
  | 'PAYMENT_SERVICE'
  | 'PAYMENT_AMOUNT'
  | 'PAYMENT_CONFIRM'
  | 'AUTHORIZING'
  | 'BALANCE_RESULT'
  | 'SUMMARY'
  | 'EJECTING'

export interface CardData {
  cardNumber: string           // 16 digits (PAN)
  cardName: string
  expiry: string               // MM/YY
  cvv: string                  // 3–4 digits
  cardType: 'debit' | 'credit'
}

export interface TransactionSummary {
  type: 'deposit' | 'withdraw' | 'payment'
  amount: number
  service?: string
  cardLast4: string
  timestamp: string
  status: 'success' | 'cancelled'
}

interface ATMStore {
  state: ATMState
  card: CardData | null
  pin: string             // accumulated PIN digits
  pinConfirmed: boolean
  selectedFlow: 'deposit' | 'withdraw' | 'payment' | 'balance' | null
  amount: number | null
  customAmount: string    // for typing custom amount
  selectedService: string | null
  lastTransaction: TransactionSummary | null
  lastBalance: number | null   // result of the last balance inquiry
  keypadBuffer: string    // general purpose buffer for keypad input
  isProcessing: boolean
  message: string         // status message on screen
  simulatorId: string | null   // current simulator — used as the NDC terminal (LUNO) id

  // Actions
  insertCard: (card: CardData) => void
  pressKey: (key: string) => void
  pressFunctionKey: (side: 'left' | 'right', index: number) => void
  cancel: () => void
  reset: () => void
  setProcessing: (v: boolean) => void
  setMessage: (msg: string) => void
  setLastTransaction: (tx: TransactionSummary) => void
  setSimulatorContext: (simulatorId: string) => void
  authorizeAndComplete: () => Promise<void>
  requestBalanceInquiry: () => Promise<void>
}

export const useATMStore = create<ATMStore>((set, get) => ({
  state: 'IDLE',
  card: null,
  pin: '',
  pinConfirmed: false,
  selectedFlow: null,
  amount: null,
  customAmount: '',
  selectedService: null,
  lastTransaction: null,
  lastBalance: null,
  keypadBuffer: '',
  isProcessing: false,
  message: '',
  simulatorId: null,

  insertCard: (card) => {
    set({ card, state: 'INSERTING_CARD' })
    setTimeout(() => {
      set({ state: 'PIN_ENTRY', pin: '', pinConfirmed: false })
    }, 1500)
  },

  pressKey: (key) => {
    const { state, pin, customAmount } = get()

    if (key === 'CANCEL') {
      get().cancel()
      return
    }

    if (key === 'CLEAR') {
      if (state === 'PIN_ENTRY') set({ pin: '' })
      else if (
        state === 'WITHDRAW_AMOUNT' ||
        state === 'DEPOSIT_AMOUNT' ||
        state === 'PAYMENT_AMOUNT'
      ) {
        set({ customAmount: customAmount.slice(0, -1) })
      }
      return
    }

    if (key === 'ENTER') {
      const s = get().state
      if (s === 'PIN_ENTRY') {
        if (pin.length >= 4) {
          set({ pinConfirmed: true, state: 'MAIN_MENU', pin: '' })
        }
      } else if (s === 'WITHDRAW_AMOUNT') {
        const n = parseInt(customAmount)
        if (!isNaN(n) && n > 0) {
          set({ amount: n, customAmount: '', state: 'WITHDRAW_CONFIRM' })
        }
      } else if (s === 'DEPOSIT_AMOUNT') {
        const n = parseInt(customAmount)
        if (!isNaN(n) && n > 0) {
          set({ amount: n, customAmount: '', state: 'DEPOSIT_CONFIRM' })
        }
      } else if (s === 'PAYMENT_AMOUNT') {
        const n = parseInt(customAmount)
        if (!isNaN(n) && n > 0) {
          set({ amount: n, customAmount: '', state: 'PAYMENT_CONFIRM' })
        }
      }
      return
    }

    // Digit keys
    if (/^\d$/.test(key)) {
      if (state === 'PIN_ENTRY' && pin.length < 8) {
        set({ pin: pin + key })
      } else if (
        state === 'WITHDRAW_AMOUNT' ||
        state === 'DEPOSIT_AMOUNT' ||
        state === 'PAYMENT_AMOUNT'
      ) {
        if (customAmount.length < 8) set({ customAmount: customAmount + key })
      }
    }
  },

  pressFunctionKey: (side, index) => {
    const { state } = get()

    if (state === 'MAIN_MENU') {
      // Left side keys: Depósito (0), Retiro (1), Pagos (2), Salir (3)
      if (side === 'left') {
        if (index === 0) set({ state: 'DEPOSIT', selectedFlow: 'deposit', amount: null })
        if (index === 1) set({ state: 'WITHDRAW', selectedFlow: 'withdraw', amount: null })
        if (index === 2)
          set({ state: 'PAYMENT', selectedFlow: 'payment', amount: null, selectedService: null })
        if (index === 3) get().cancel()
      }
      // Right side keys: Consulta de Saldo (0)
      if (side === 'right' && index === 0) {
        get().requestBalanceInquiry()
      }
    }

    if (state === 'WITHDRAW') {
      // Preset amounts: 10000, 20000, 50000, 100000 (left side)
      // Right side: Otro monto (0), Cancelar (3)
      const presets = [10000, 20000, 50000, 100000]
      if (side === 'left' && index < 4) {
        set({ amount: presets[index], state: 'WITHDRAW_CONFIRM' })
      }
      if (side === 'right' && index === 0) {
        set({ state: 'WITHDRAW_AMOUNT', customAmount: '' })
      }
      if (side === 'right' && index === 3) get().cancel()
    }

    if (state === 'DEPOSIT') {
      if (side === 'left' && index === 0) set({ state: 'DEPOSIT_AMOUNT', customAmount: '' })
      if (side === 'right' && index === 3) get().cancel()
    }

    if (state === 'PAYMENT') {
      // Services list left side
      const services = ['Electricidad', 'Agua', 'Gas', 'Internet']
      if (side === 'left' && index < 4) {
        set({ selectedService: services[index], state: 'PAYMENT_AMOUNT', customAmount: '' })
      }
      if (side === 'right' && index === 3) get().cancel()
    }

    if (
      state === 'WITHDRAW_CONFIRM' ||
      state === 'DEPOSIT_CONFIRM' ||
      state === 'PAYMENT_CONFIRM'
    ) {
      if (side === 'left' && index === 0) {
        get().authorizeAndComplete()
      }
      if (side === 'right' && index === 3) get().cancel()
    }

    if (state === 'SUMMARY' || state === 'BALANCE_RESULT') {
      // Any key: go back to main menu
      set({
        state: 'MAIN_MENU',
        amount: null,
        selectedFlow: null,
        selectedService: null,
        lastBalance: null,
      })
    }
  },

  cancel: () => {
    set({
      state: 'EJECTING',
      pin: '',
      pinConfirmed: false,
      selectedFlow: null,
      amount: null,
      customAmount: '',
      selectedService: null,
      keypadBuffer: '',
      isProcessing: false,
      lastBalance: null,
    })
    setTimeout(() => {
      set({ state: 'IDLE', card: null, lastTransaction: null })
    }, 1500)
  },

  reset: () =>
    set({
      state: 'IDLE',
      card: null,
      pin: '',
      pinConfirmed: false,
      selectedFlow: null,
      amount: null,
      customAmount: '',
      selectedService: null,
      lastTransaction: null,
      lastBalance: null,
      keypadBuffer: '',
      isProcessing: false,
      message: '',
    }),

  setProcessing: (v) => set({ isProcessing: v }),
  setMessage: (msg) => set({ message: msg }),
  setLastTransaction: (tx) => set({ lastTransaction: tx }),
  setSimulatorContext: (simulatorId) => set({ simulatorId }),

  // ───────────────────────────────────────────────────────────────────
  // authorizeAndComplete — builds an NDC-style request for the current
  // withdraw/deposit/payment flow, "sends" it to the simulated switch
  // (/api/switch/authorize), logs the whole round trip to the console,
  // and only then moves the ATM state forward.
  // ───────────────────────────────────────────────────────────────────
  authorizeAndComplete: async () => {
    const { selectedFlow, amount, card, simulatorId, selectedService } = get()
    const type = selectedFlow
    if (!type || type === 'balance' || amount == null) return

    const cardLast4 = card?.cardNumber.slice(-4) ?? '****'
    const log = useConsoleStore.getState().append

    set({ state: 'AUTHORIZING', isProcessing: true })

    const request = buildNDCRequest({
      simulatorId: simulatorId ?? 'unknown',
      txnType: type,
      amount,
      cardNumber: card?.cardNumber ?? '0000000000000000',
      expiry: card?.expiry ?? '00/00',
      serviceName: type === 'payment' ? selectedService ?? undefined : undefined,
    })

    log('tx', `▶ Enviando mensaje NDC al switch autorizador (LUNO ${request.luno}, STAN ${request.stan})`)
    log('info', request.raw)
    request.fields.forEach(f => log('info', `   ${f.label.padEnd(16, ' ')}: ${f.value}`))
    log('wait', '⏳ Esperando autorización del host...')

    try {
      const res = await fetch('/api/switch/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stan: request.stan,
          luno: request.luno,
          txnType: type,
          amount,
          cardLast4,
        }),
      })
      const data = await res.json()

      log('rx', '◀ Respuesta del switch recibida')
      log('info', data.raw ?? '(sin datos)')
      ;(data.fields ?? []).forEach((f: { label: string; value: string }) =>
        log('info', `   ${f.label.padEnd(16, ' ')}: ${f.value}`)
      )

      if (data.approved) {
        log('ok', `✔ Transacción autorizada — código de respuesta ${data.responseCode}`)
        if (type === 'withdraw') {
          set({ state: 'DISPENSING' })
          setTimeout(() => {
            set({
              state: 'SUMMARY',
              isProcessing: false,
              lastTransaction: {
                type,
                amount,
                cardLast4,
                timestamp: new Date().toLocaleString('es-CL'),
                status: 'success',
              },
            })
          }, 2200)
        } else {
          set({
            state: 'SUMMARY',
            isProcessing: false,
            lastTransaction: {
              type,
              amount,
              service: get().selectedService ?? undefined,
              cardLast4,
              timestamp: new Date().toLocaleString('es-CL'),
              status: 'success',
            },
          })
        }
      } else {
        log('err', `✘ Transacción rechazada por el switch — código de respuesta ${data.responseCode}`)
        set({ isProcessing: false })
        get().cancel()
      }
    } catch {
      log('err', '✘ Error de comunicación con el switch autorizador')
      set({ isProcessing: false })
      get().cancel()
    }
  },

  // ───────────────────────────────────────────────────────────────────
  // requestBalanceInquiry — same NDC round trip as above, for a balance
  // inquiry ("consulta de saldo") triggered directly from the main menu.
  // ───────────────────────────────────────────────────────────────────
  requestBalanceInquiry: async () => {
    const { card, simulatorId } = get()
    if (!card) return

    const cardLast4 = card.cardNumber.slice(-4)
    const log = useConsoleStore.getState().append

    set({ state: 'AUTHORIZING', isProcessing: true, selectedFlow: 'balance' })

    const request = buildNDCRequest({
      simulatorId: simulatorId ?? 'unknown',
      txnType: 'balance',
      amount: null,
      cardNumber: card.cardNumber,
      expiry: card.expiry,
    })

    log('tx', `▶ Enviando mensaje NDC al switch autorizador (LUNO ${request.luno}, STAN ${request.stan})`)
    log('info', request.raw)
    request.fields.forEach(f => log('info', `   ${f.label.padEnd(16, ' ')}: ${f.value}`))
    log('wait', '⏳ Esperando autorización del host...')

    try {
      const res = await fetch('/api/switch/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stan: request.stan,
          luno: request.luno,
          txnType: 'balance',
          amount: null,
          cardLast4,
        }),
      })
      const data = await res.json()

      log('rx', '◀ Respuesta del switch recibida')
      log('info', data.raw ?? '(sin datos)')
      ;(data.fields ?? []).forEach((f: { label: string; value: string }) =>
        log('info', `   ${f.label.padEnd(16, ' ')}: ${f.value}`)
      )

      if (data.approved) {
        log('ok', `✔ Consulta autorizada — código de respuesta ${data.responseCode}`)
        set({ state: 'BALANCE_RESULT', isProcessing: false, lastBalance: data.balance ?? null })
      } else {
        log('err', `✘ Consulta rechazada por el switch — código de respuesta ${data.responseCode}`)
        set({ isProcessing: false })
        get().cancel()
      }
    } catch {
      log('err', '✘ Error de comunicación con el switch autorizador')
      set({ isProcessing: false })
      get().cancel()
    }
  },
}))

import { create } from 'zustand'

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
  selectedFlow: 'deposit' | 'withdraw' | 'payment' | null
  amount: number | null
  customAmount: string    // for typing custom amount
  selectedService: string | null
  lastTransaction: TransactionSummary | null
  keypadBuffer: string    // general purpose buffer for keypad input
  isProcessing: boolean
  message: string         // status message on screen

  // Actions
  insertCard: (card: CardData) => void
  pressKey: (key: string) => void
  pressFunctionKey: (side: 'left' | 'right', index: number) => void
  cancel: () => void
  reset: () => void
  setProcessing: (v: boolean) => void
  setMessage: (msg: string) => void
  setLastTransaction: (tx: TransactionSummary) => void
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
  keypadBuffer: '',
  isProcessing: false,
  message: '',

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
    const { state, card } = get()

    if (state === 'MAIN_MENU') {
      // Left side keys: Depósito (0), Retiro (1), Pagos (2), Salir (3)
      if (side === 'left') {
        if (index === 0) set({ state: 'DEPOSIT', selectedFlow: 'deposit', amount: null })
        if (index === 1) set({ state: 'WITHDRAW', selectedFlow: 'withdraw', amount: null })
        if (index === 2)
          set({ state: 'PAYMENT', selectedFlow: 'payment', amount: null, selectedService: null })
        if (index === 3) get().cancel()
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
        // Confirm
        const type = get().selectedFlow!
        const amount = get().amount!
        const cardLast4 = card?.cardNumber.slice(-4) ?? '****'
        if (type === 'withdraw') {
          set({ state: 'DISPENSING', isProcessing: true })
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
          }, 2500)
        } else {
          set({
            state: 'SUMMARY',
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
      }
      if (side === 'right' && index === 3) get().cancel()
    }

    if (state === 'SUMMARY') {
      // Any key: go back to main menu
      set({ state: 'MAIN_MENU', amount: null, selectedFlow: null, selectedService: null })
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
      keypadBuffer: '',
      isProcessing: false,
      message: '',
    }),

  setProcessing: (v) => set({ isProcessing: v }),
  setMessage: (msg) => set({ message: msg }),
  setLastTransaction: (tx) => set({ lastTransaction: tx }),
}))

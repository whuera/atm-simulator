export interface User {
  id: string
  username: string
  passwordHash: string
  role: 'admin' | 'user'
  displayName: string
  createdAt: string
}

export interface Simulator {
  id: string
  bankName: string
  logoEmoji: string       // emoji as placeholder logo
  themeColors: {
    primary: string       // bank primary color
    secondary: string     // bank secondary color
    screenBg: string      // ATM screen background color
    screenText: string    // ATM screen text color
  }
  enabledFlows: Array<'deposit' | 'withdraw' | 'payment'>
  description: string
  createdAt: string
}

export interface Assignment {
  userId: string
  simulatorId: string
}

export interface Transaction {
  id: string
  userId: string
  simulatorId: string
  type: 'deposit' | 'withdraw' | 'payment'
  amount: number
  serviceName?: string     // for payment type
  timestamp: string
  status: 'success' | 'cancelled'
  cardNumber?: string      // last 4 digits
}

export interface SessionUser {
  id: string
  username: string
  role: 'admin' | 'user'
  displayName: string
}

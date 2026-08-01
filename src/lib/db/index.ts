import type { User, Simulator, Assignment, Transaction } from './types'
import { createSeedData } from './seed'

// ---- In-memory store (module singleton) ----
interface Store {
  users: User[]
  simulators: Simulator[]
  assignments: Assignment[]
  transactions: Transaction[]
  initialized: boolean
}

const store: Store = {
  users: [],
  simulators: [],
  assignments: [],
  transactions: [],
  initialized: false,
}

async function ensureInit() {
  if (store.initialized) return
  const seed = await createSeedData()
  store.users = seed.users
  store.simulators = seed.simulators
  store.assignments = seed.assignments
  store.initialized = true
}

// ---- Users ----
export async function getUsers(): Promise<User[]> {
  await ensureInit()
  return store.users
}

export async function getUserById(id: string): Promise<User | null> {
  await ensureInit()
  return store.users.find(u => u.id === id) ?? null
}

export async function getUserByUsername(username: string): Promise<User | null> {
  await ensureInit()
  return store.users.find(u => u.username === username) ?? null
}

export async function createUser(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
  await ensureInit()
  const user: User = { ...data, id: `u${Date.now()}`, createdAt: new Date().toISOString() }
  store.users.push(user)
  return user
}

export async function updateUser(id: string, data: Partial<Omit<User, 'id'>>): Promise<User | null> {
  await ensureInit()
  const idx = store.users.findIndex(u => u.id === id)
  if (idx === -1) return null
  store.users[idx] = { ...store.users[idx], ...data }
  return store.users[idx]
}

export async function deleteUser(id: string): Promise<boolean> {
  await ensureInit()
  const idx = store.users.findIndex(u => u.id === id)
  if (idx === -1) return false
  store.users.splice(idx, 1)
  store.assignments = store.assignments.filter(a => a.userId !== id)
  return true
}

// ---- Simulators ----
export async function getSimulators(): Promise<Simulator[]> {
  await ensureInit()
  return store.simulators
}

export async function getSimulatorById(id: string): Promise<Simulator | null> {
  await ensureInit()
  return store.simulators.find(s => s.id === id) ?? null
}

export async function createSimulator(data: Omit<Simulator, 'id' | 'createdAt'>): Promise<Simulator> {
  await ensureInit()
  const sim: Simulator = { ...data, id: `s${Date.now()}`, createdAt: new Date().toISOString() }
  store.simulators.push(sim)
  return sim
}

export async function updateSimulator(id: string, data: Partial<Omit<Simulator, 'id'>>): Promise<Simulator | null> {
  await ensureInit()
  const idx = store.simulators.findIndex(s => s.id === id)
  if (idx === -1) return null
  store.simulators[idx] = { ...store.simulators[idx], ...data }
  return store.simulators[idx]
}

export async function deleteSimulator(id: string): Promise<boolean> {
  await ensureInit()
  const idx = store.simulators.findIndex(s => s.id === id)
  if (idx === -1) return false
  store.simulators.splice(idx, 1)
  store.assignments = store.assignments.filter(a => a.simulatorId !== id)
  return true
}

// ---- Assignments ----
export async function getAssignments(): Promise<Assignment[]> {
  await ensureInit()
  return store.assignments
}

export async function getSimulatorsForUser(userId: string): Promise<Simulator[]> {
  await ensureInit()
  const simIds = store.assignments.filter(a => a.userId === userId).map(a => a.simulatorId)
  return store.simulators.filter(s => simIds.includes(s.id))
}

export async function getUsersForSimulator(simulatorId: string): Promise<User[]> {
  await ensureInit()
  const userIds = store.assignments.filter(a => a.simulatorId === simulatorId).map(a => a.userId)
  return store.users.filter(u => userIds.includes(u.id))
}

export async function setAssignment(userId: string, simulatorId: string): Promise<void> {
  await ensureInit()
  const exists = store.assignments.some(a => a.userId === userId && a.simulatorId === simulatorId)
  if (!exists) store.assignments.push({ userId, simulatorId })
}

export async function removeAssignment(userId: string, simulatorId: string): Promise<void> {
  await ensureInit()
  store.assignments = store.assignments.filter(
    a => !(a.userId === userId && a.simulatorId === simulatorId)
  )
}

export async function setUserAssignments(userId: string, simulatorIds: string[]): Promise<void> {
  await ensureInit()
  store.assignments = store.assignments.filter(a => a.userId !== userId)
  for (const simId of simulatorIds) {
    store.assignments.push({ userId, simulatorId: simId })
  }
}

// ---- Transactions ----
export async function getTransactions(): Promise<Transaction[]> {
  await ensureInit()
  return [...store.transactions].reverse()
}

export async function getTransactionsByUser(userId: string): Promise<Transaction[]> {
  await ensureInit()
  return store.transactions.filter(t => t.userId === userId).reverse()
}

export async function createTransaction(
  data: Omit<Transaction, 'id' | 'timestamp'>
): Promise<Transaction> {
  await ensureInit()
  const tx: Transaction = {
    ...data,
    id: `tx${Date.now()}`,
    timestamp: new Date().toISOString(),
  }
  store.transactions.push(tx)
  return tx
}

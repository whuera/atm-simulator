import bcrypt from 'bcryptjs'
import type { User, Simulator, Assignment } from './types'

export async function createSeedData() {
  const adminHash = await bcrypt.hash('admin123', 10)
  const userHash = await bcrypt.hash('user123', 10)

  const users: User[] = [
    {
      id: 'u1',
      username: 'admin',
      passwordHash: adminHash,
      role: 'admin',
      displayName: 'Administrador',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'u2',
      username: 'maria.garcia',
      passwordHash: userHash,
      role: 'user',
      displayName: 'María García',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'u3',
      username: 'carlos.mendez',
      passwordHash: userHash,
      role: 'user',
      displayName: 'Carlos Méndez',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'u4',
      username: 'ana.torres',
      passwordHash: userHash,
      role: 'user',
      displayName: 'Ana Torres',
      createdAt: new Date().toISOString(),
    },
  ]

  const simulators: Simulator[] = [
    {
      id: 's1',
      bankName: 'Banco Santander Chile',
      logoEmoji: '🏦',
      themeColors: {
        primary: '#EC0000',
        secondary: '#FFFFFF',
        screenBg: '#001800',
        screenText: '#00ff41',
      },
      enabledFlows: ['deposit', 'withdraw', 'payment'],
      description: 'Simulador ATM Santander — todos los flujos habilitados',
      createdAt: new Date().toISOString(),
    },
    {
      id: 's2',
      bankName: 'Banco BICE',
      logoEmoji: '🏛️',
      themeColors: {
        primary: '#003087',
        secondary: '#FFFFFF',
        screenBg: '#000818',
        screenText: '#4488ff',
      },
      enabledFlows: ['deposit', 'withdraw'],
      description: 'Simulador ATM BICE — depósito y retiro',
      createdAt: new Date().toISOString(),
    },
    {
      id: 's3',
      bankName: 'Banco Falabella',
      logoEmoji: '🛍️',
      themeColors: {
        primary: '#7DC242',
        secondary: '#FFFFFF',
        screenBg: '#001400',
        screenText: '#88ff44',
      },
      enabledFlows: ['withdraw', 'payment'],
      description: 'Simulador ATM Falabella — retiro y pago de servicios',
      createdAt: new Date().toISOString(),
    },
  ]

  const assignments: Assignment[] = [
    { userId: 'u2', simulatorId: 's1' },
    { userId: 'u2', simulatorId: 's2' },
    { userId: 'u3', simulatorId: 's1' },
    { userId: 'u3', simulatorId: 's3' },
    { userId: 'u4', simulatorId: 's2' },
    { userId: 'u4', simulatorId: 's3' },
  ]

  return { users, simulators, assignments }
}

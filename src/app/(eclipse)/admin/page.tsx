import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getUsers, getSimulators, getAssignments, getTransactions } from '@/lib/db'
import AdminDashboardClient from './AdminDashboardClient'

export default async function AdminPage() {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/dashboard')

  const [users, simulators, assignments, transactions] = await Promise.all([
    getUsers(),
    getSimulators(),
    getAssignments(),
    getTransactions(),
  ])

  return (
    <AdminDashboardClient
      session={session}
      initialUsers={users.map(u => ({ ...u, passwordHash: '' }))}
      initialSimulators={simulators}
      initialAssignments={assignments}
      recentTransactions={transactions.slice(0, 20)}
    />
  )
}

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getSimulatorById, getSimulatorsForUser } from '@/lib/db'
import SimulatorClient from './SimulatorClient'

export default async function SimulatorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect('/login')

  // Admin can access all simulators, regular users only their assigned ones
  const simulator = await getSimulatorById(id)
  if (!simulator) redirect('/dashboard')

  if (session.role !== 'admin') {
    const mySimulators = await getSimulatorsForUser(session.id)
    if (!mySimulators.find((s) => s.id === id)) redirect('/dashboard')
  }

  return <SimulatorClient simulator={simulator} session={session} />
}

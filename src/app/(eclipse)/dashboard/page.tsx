import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getSimulatorsForUser } from '@/lib/db'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  const simulators = await getSimulatorsForUser(session.id)
  return <DashboardClient session={session} simulators={simulators} />
}

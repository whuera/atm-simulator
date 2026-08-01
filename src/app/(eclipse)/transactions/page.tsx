import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import TransactionsClient from './TransactionsClient'

export default async function TransactionsPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  return <TransactionsClient session={session} />
}

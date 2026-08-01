import { NextResponse } from 'next/server'
import { getTransactions, getTransactionsByUser, createTransaction } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (session.role === 'admin') {
    const txs = await getTransactions()
    return NextResponse.json(txs)
  }
  const txs = await getTransactionsByUser(session.id)
  return NextResponse.json(txs)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await request.json()
  const tx = await createTransaction({ ...data, userId: session.id })
  return NextResponse.json(tx, { status: 201 })
}

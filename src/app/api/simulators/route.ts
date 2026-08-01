import { NextResponse } from 'next/server'
import { getSimulators, createSimulator } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sims = await getSimulators()
  return NextResponse.json(sims)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const data = await request.json()
  const sim = await createSimulator(data)
  return NextResponse.json(sim, { status: 201 })
}

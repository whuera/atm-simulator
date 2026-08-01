import { NextResponse } from 'next/server'
import { getAssignments, setUserAssignments, getSimulatorsForUser } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (userId) {
    const sims = await getSimulatorsForUser(userId)
    return NextResponse.json(sims)
  }

  if (session.role !== 'admin') {
    const sims = await getSimulatorsForUser(session.id)
    return NextResponse.json(sims)
  }

  const assignments = await getAssignments()
  return NextResponse.json(assignments)
}

export async function PUT(request: Request) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { userId, simulatorIds } = await request.json()
  await setUserAssignments(userId, simulatorIds)
  return NextResponse.json({ ok: true })
}

import { NextResponse } from 'next/server'
import { getSimulatorById, updateSimulator, deleteSimulator } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const sim = await getSimulatorById(id)
  if (!sim) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(sim)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const data = await request.json()
  const sim = await updateSimulator(id, data)
  if (!sim) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(sim)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const ok = await deleteSimulator(id)
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}

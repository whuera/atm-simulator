import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getUserById, updateUser, deleteUser } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const data = await request.json()
  const update: Record<string, unknown> = {}
  if (data.displayName) update.displayName = data.displayName
  if (data.role) update.role = data.role
  if (data.password) update.passwordHash = await bcrypt.hash(data.password, 10)
  const user = await updateUser(id, update)
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ...user, passwordHash: undefined })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  if (id === session.id) {
    return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 })
  }
  const ok = await deleteUser(id)
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}

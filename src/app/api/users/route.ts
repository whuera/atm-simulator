import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getUsers, createUser } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const users = await getUsers()
  // Never send passwordHash to client
  return NextResponse.json(users.map(u => ({ ...u, passwordHash: undefined })))
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { username, password, role, displayName } = await request.json()
  if (!username || !password || !role || !displayName) {
    return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
  }
  const passwordHash = await bcrypt.hash(password, 10)
  const user = await createUser({ username, passwordHash, role, displayName })
  return NextResponse.json({ ...user, passwordHash: undefined }, { status: 201 })
}

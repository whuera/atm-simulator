import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getUserByUsername } from '@/lib/db'
import { setSessionCookie } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Usuario y contraseña requeridos' }, { status: 400 })
    }

    const user = await getUserByUsername(username)
    if (!user) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    const sessionUser = {
      id: user.id,
      username: user.username,
      role: user.role,
      displayName: user.displayName,
    }

    await setSessionCookie(sessionUser)

    return NextResponse.json({ user: sessionUser })
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

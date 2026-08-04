import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { buildNDCResponse, type NDCTxnType } from '@/lib/ndc'

// ─────────────────────────────────────────────────────────────────────────
// Simulated authorizer switch endpoint.
//
// The ATM simulator posts an NDC-style transaction request here (débito /
// depósito / pago / consulta). This route stands in for the real switch:
// it "receives" the message, waits a realistic amount of time, and returns
// an NDC-style authorization response. Nothing here talks to a real
// financial network — it exists purely so operators can see the request/
// response round trip in the on-screen console.
// ─────────────────────────────────────────────────────────────────────────

function randomDelay(minMs: number, maxMs: number) {
  return new Promise(resolve => setTimeout(resolve, minMs + Math.random() * (maxMs - minMs)))
}

// Deterministic pseudo-balance so the same card "has" a stable balance
// for the duration of the process.
function fakeBalance(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return 50_000 + (h % 2_450_000)
}

interface AuthorizeRequestBody {
  stan: string
  luno: string
  txnType: NDCTxnType
  amount: number | null
  cardLast4?: string
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: AuthorizeRequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Mensaje NDC inválido' }, { status: 400 })
  }

  if (!body?.stan || !body?.luno || !body?.txnType) {
    return NextResponse.json({ error: 'Mensaje NDC incompleto' }, { status: 400 })
  }

  // Simulated round trip to the authorizer switch.
  await randomDelay(400, 900)

  const approved = true // simulator always authorizes — this endpoint exists for the log/UX
  const balance =
    body.txnType === 'balance' ? fakeBalance((body.cardLast4 ?? '0000') + body.luno) : undefined

  const response = buildNDCResponse({
    stan: body.stan,
    luno: body.luno,
    amount: body.amount,
    approved,
    balance,
  })

  return NextResponse.json({
    approved,
    responseCode: approved ? '00' : '05',
    balance: balance ?? null,
    raw: response.raw,
    fields: response.fields,
    stan: response.stan,
    luno: response.luno,
  })
}

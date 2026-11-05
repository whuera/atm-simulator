'use client'

import * as React from 'react'
import { Dots, IsoFigure, Line, Plate, Solid, Wire } from '@/components/iso/react/draw'
import { useInView, useLoop, useReadout } from '@/components/iso/react/live'
import '@/components/iso/iso.css'
import './atm-inside.css'
import {
  CARD, CARD_TRAVEL, HEIGHT, MODULE_TAGS, NOTES, NOTES_TRAVEL, PAPER, PAPER_TRAVEL, PARTS, STEP_PATHS, WIDTH,
  along, packetAt, translate, type RouteId,
} from './geometry'
import { STEPS, TRACE_TOTAL, WAIT_STEP, stepAt, type ModuleId, type Trace } from './model'

const ROUTES_BY_STEP: RouteId[][] = [[], ['reader', 'epp'], ['epp'], ['hsm'], ['nic', 'uplink'], [], ['core'], ['core'], ['uplink']]

const smooth = (f: number) => f * f * (3 - 2 * f)
const clamp01 = (f: number) => Math.min(1, Math.max(0, f))

function moduleOf(step: number, trace: Trace | null): ModuleId | null {
  if (!trace || step < 0) return null
  if (step === STEPS.length - 1) return trace.txnType === 'withdraw' ? 'dispenser' : 'printer'
  return STEPS[step].module
}

interface Props {
  trace: Trace | null
  onSkip: () => void
}

export default function AtmInsideFigure({ trace, onSkip }: Props) {
  const { anchor, say } = useReadout<HTMLDivElement>()
  const visible = useInView(anchor)
  // Seconds into the timeline. Advanced by wall-clock time (not frame dt),
  // so it stays in step with the store's hold even if frames are throttled.
  const clock = React.useRef(0)
  const wall = React.useRef(0)
  const [step, setStep] = React.useState(-1)
  const [playing, setPlaying] = React.useState(false)

  const packet = React.useRef<SVGGElement>(null)
  const card = React.useRef<SVGGElement>(null)
  const notes = React.useRef<SVGGElement>(null)
  const paper = React.useRef<SVGGElement>(null)
  const traceRef = React.useRef(trace)
  React.useLayoutEffect(() => { traceRef.current = trace }, [trace])

  // A new transaction restarts the timeline (state derived from the prop).
  const [seenId, setSeenId] = React.useState<number | null>(null)
  if (trace && trace.id !== seenId) {
    setSeenId(trace.id)
    setStep(0)
    setPlaying(true)
  }
  React.useEffect(() => { clock.current = 0; wall.current = performance.now() }, [seenId])

  const draw = React.useCallback((t: number, calm: boolean) => {
    const tr = traceRef.current
    const i = stepAt(t)
    const start = STEPS[i].at
    const end = i + 1 < STEPS.length ? STEPS[i + 1].at : TRACE_TOTAL
    const f = calm ? 1 : smooth(clamp01((t - start) / ((end - start) * 0.75)))

    const g = packet.current
    if (g) {
      const p = along(STEP_PATHS[i], f)
      const s = packetAt(p)
      const paths = g.querySelectorAll('path')
      ;[s.fill, ...s.shades, s.top, s.crease, s.outline].forEach((d, n) => paths[n]?.setAttribute('d', d))
      // the reply travels back as a different message
      g.dataset.leg = i >= 7 ? 'reply' : i >= 5 ? 'iso' : 'ndc'
      g.style.opacity = tr?.failed && i >= WAIT_STEP ? '0' : '1'
    }
    const cardIn = i === 0 ? f : 1
    card.current?.setAttribute('transform', translate(CARD_TRAVEL, cardIn))
    const last = i === STEPS.length - 1
    const out = last && tr?.response?.approved ? f : 0
    notes.current?.setAttribute('transform', translate(NOTES_TRAVEL, tr?.txnType === 'withdraw' ? out : 0))
    notes.current?.style.setProperty('opacity', tr?.txnType === 'withdraw' && last ? '1' : '0')
    paper.current?.setAttribute('transform', translate(PAPER_TRAVEL, out))
    if (tr) say(tr.failed && i >= WAIT_STEP ? 'Error de comunicación' : STEPS[i].readout(tr))
    return i
  }, [say])

  useLoop((_dt, calm) => {
    const tr = traceRef.current
    if (!tr) return false
    const now = performance.now()
    let t = clock.current + (now - wall.current) / 1000
    wall.current = now
    // Hold at the issuer until the switch really answered.
    const hold = STEPS[WAIT_STEP].at + 0.6
    if (!tr.response && t > hold) t = hold
    if (tr.failed) t = Math.min(t, STEPS[WAIT_STEP].at - 0.01)
    t = Math.min(t, TRACE_TOTAL)
    clock.current = t
    const i = draw(t, calm)
    setStep(prev => (prev === i ? prev : i))
    const done = t >= TRACE_TOTAL || (tr.failed && t >= STEPS[WAIT_STEP].at - 0.01)
    if (done) setPlaying(false)
    return !done
  }, playing && visible)

  // Rest pose before the first transaction.
  React.useEffect(() => {
    if (!trace) {
      card.current?.setAttribute('transform', translate(CARD_TRAVEL, 0))
      notes.current?.style.setProperty('opacity', '0')
      if (packet.current) packet.current.style.opacity = '0'
    }
  }, [trace])

  const replay = () => {
    clock.current = 0
    wall.current = performance.now()
    setStep(0)
    setPlaying(true)
  }
  const skip = () => {
    onSkip()
    clock.current = Math.max(clock.current, STEPS[STEPS.length - 1].at)
  }

  const active = playing || step >= 0 ? moduleOf(step, trace) : null
  const liveRoutes = playing && step >= 0 ? ROUTES_BY_STEP[step] : []
  const current = trace && step >= 0 ? STEPS[step] : null
  const activeTitle = current && step === STEPS.length - 1 && trace?.txnType === 'withdraw'
    ? 'Entrega de efectivo'
    : current?.title

  return (
    <div className="iso atm-inside" data-theme="light" ref={anchor}>
      <Plate
        fig="Fig 1"
        title="El ATM por dentro"
        hint={trace ? (playing ? 'Transacción en curso' : 'Transacción terminada') : 'Ejecuta una transacción'}
        readout={trace ? '' : 'En espera'}
      >
        <div className="atm-inside-stage">
        <IsoFigure
          width={WIDTH}
          height={HEIGHT}
          label="Corte isométrico de un cajero automático: lector de tarjeta, teclado cifrado (EPP), PC del ATM, módulo de seguridad y tarjeta de red, conectados por cable a un rack del switch transaccional y al core del banco emisor. Un paquete de datos recorre cada módulo mientras se procesa la transacción."
        >
          {PARTS.map((part, n) => {
            const lit = part.kind !== 'halo' && part.kind !== 'slot' && part.kind !== 'wire' && part.module != null && part.module === active
            switch (part.kind) {
              case 'halo':
                return <path key={n} className="iso-halo" d={part.d} />
              case 'solid':
                return (
                  <Solid
                    key={n}
                    paths={part.paths}
                    tone={part.tone}
                    crease={part.crease ?? 'faint'}
                    lit={lit}
                    inner={part.inner ? <Line d={part.inner} tone="faint" /> : undefined}
                  />
                )
              case 'line':
                return <Line key={n} d={part.d} tone={lit ? 'lit' : part.tone} free={part.free} />
              case 'dots':
                return <Dots key={n} points={part.points} size={part.size} tone={lit ? 'hi' : part.tone} pulse={part.pulse} />
              case 'wire': {
                const on = liveRoutes.includes(part.route)
                const [first, ...rest] = part.points
                return <Wire key={n} from={first} via={rest.slice(0, -1)} to={rest[rest.length - 1]} tone={on ? 'lit' : part.tone} flow={on} />
              }
              case 'slot':
                if (part.name === 'card') {
                  return <g key={n} ref={card}><Solid paths={CARD} tone="hi" crease="lo" lit={active === 'reader'} /></g>
                }
                if (part.name === 'notes') {
                  return <g key={n} ref={notes} style={{ opacity: 0 }}><Solid paths={NOTES} tone="hi" crease="lo" /></g>
                }
                return <g key={n} ref={paper}><Solid paths={PAPER} tone="hi" crease="none" /></g>
            }
          })}
          <g ref={packet} className="atm-packet" style={{ opacity: 0 }}>
            <path className="iso-fill" />
            {[0, 1, 2, 3].map(s => <path key={s} className="iso-shade" data-shade={s} />)}
            <path className="iso-top" />
            <path className="iso-line iso-crease" data-tone="lo" />
            <path className="iso-line iso-edge" data-tone="lit" />
          </g>
        </IsoFigure>
        {active ? (
          <span
            className="atm-inside-tag"
            style={{ left: `${(MODULE_TAGS[active].at[0] / WIDTH) * 100}%`, top: `${(MODULE_TAGS[active].at[1] / HEIGHT) * 100}%` }}
          >
            {MODULE_TAGS[active].label}
          </span>
        ) : null}
        </div>
      </Plate>

      <div className="atm-inside-steps">
        <ol>
          {STEPS.map((s, n) => (
            <li key={n} data-state={n < step ? 'done' : n === step ? 'now' : 'next'}>
              {n === STEPS.length - 1 && trace?.txnType === 'withdraw' ? 'Entrega de efectivo' : s.title}
            </li>
          ))}
        </ol>
        <p className="atm-inside-text" aria-live="polite">
          {trace && current
            ? (trace.failed && step >= WAIT_STEP - 1
                ? 'No hubo respuesta del switch: el ATM cancela la transacción y devuelve la tarjeta.'
                : current.text(trace))
            : 'Inserta una tarjeta, ingresa el PIN y confirma una transacción: aquí verás, paso a paso, cómo viaja tu operación desde el lector de tarjetas hasta el switch y el banco emisor.'}
        </p>
        <div className="atm-inside-actions">
          {activeTitle ? <strong>{activeTitle}</strong> : <span />}
          {playing
            ? <button type="button" onClick={skip}>Saltar ⏭</button>
            : trace && !trace.failed ? <button type="button" onClick={replay}>Repetir ↻</button> : null}
        </div>
      </div>
    </div>
  )
}

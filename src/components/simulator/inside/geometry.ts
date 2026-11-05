// ─────────────────────────────────────────────────────────────────────────
// Static geometry for "El ATM por dentro": an ATM cabinet with its front
// and side panels off (modules on shelves), a cable along the bench to the
// switch rack, and on to the issuer's core. World units ≈ px, z up.
// Everything is computed once at module load; the live component only
// moves the packet, the card and the notes.
// ─────────────────────────────────────────────────────────────────────────
import * as k from '@/components/iso/iso-kit'
import type { Flat, Plan, Point3, SolidPaths, Tone, LineTone } from '@/components/iso/iso-kit'
import type { ModuleId } from './model'

export const WIDTH = 640
export const HEIGHT = 400
const AZIMUTH = 58

// ── World layout ──────────────────────────────────────────────────────────
const BENCH: Plan = { x: -222, y: -58, w: 448, d: 116, r: 8 }
const CAB: Plan = { x: -200, y: -45, w: 112, d: 90, r: 0 }
const CAB_TOP = 190
const SHELF_1 = 62
const SHELF_2 = 124
const CHASE = -36 // shelves stop here: the cable chase runs behind them

const RACK: Plan = { x: -18, y: -32, w: 64, d: 64, r: 0 }
const RACK_TOP = 150
const CORE_A: Plan = { x: 118, y: -30, w: 38, d: 52, r: 2 }
const CORE_B: Plan = { x: 166, y: -30, w: 46, d: 52, r: 2 }

export const P = k.fitProjection(
  [
    ...k.boxCorners(BENCH, -16, 0),
    ...k.boxCorners(CAB, 0, CAB_TOP),
    ...k.boxCorners(RACK, 0, RACK_TOP),
  ],
  WIDTH, HEIGHT, { pad: 26, azimuth: AZIMUTH },
)

const at = (p: Point3) => k.iso(p, P)
const depth = (p: Point3) => k.depthOf(p, P)

// ── Part list in painter's order ─────────────────────────────────────────
export type Part =
  | { kind: 'solid'; paths: SolidPaths; tone: Tone; crease?: Tone | 'none'; module?: ModuleId; flat?: boolean; inner?: string }
  | { kind: 'line'; d: string; tone: LineTone; module?: ModuleId; free?: boolean }
  | { kind: 'dots'; points: Flat[]; size: number; tone: Tone; module?: ModuleId; pulse?: boolean }
  | { kind: 'wire'; points: Flat[]; tone: LineTone; route: RouteId }
  | { kind: 'halo'; d: string }
  | { kind: 'slot'; name: 'card' | 'notes' | 'paper' }

export type RouteId = 'reader' | 'epp' | 'hsm' | 'nic' | 'uplink' | 'core'

const parts: Part[] = []
const solid = (paths: SolidPaths, tone: Tone, extra: Partial<Extract<Part, { kind: 'solid' }>> = {}) =>
  parts.push({ kind: 'solid', paths, tone, ...extra })
const line = (d: string, tone: LineTone, module?: ModuleId, free?: boolean) => parts.push({ kind: 'line', d, tone, module, free })
const dots = (pts: Point3[], size: number, tone: Tone, module?: ModuleId, pulse?: boolean) =>
  parts.push({ kind: 'dots', points: k.pointsAt(pts, P), size, tone, module, pulse })
const slab = (plan: Plan, z: number, h: number, steps = 3, bevel = 0) => k.slabOf(plan, z, h, P, steps, bevel)
const screwsOn = (plan: Plan, z: number, inset = 3, module?: ModuleId) =>
  dots(k.corners(plan, inset).map(([x, y]) => [x, y, z] as Point3), 0.5, 'mid', module)

const byDepth = <T extends { c: Point3 }>(list: T[]) => [...list].sort((a, b) => depth(a.c) - depth(b.c))

// ── Bench ────────────────────────────────────────────────────────────────
parts.push({ kind: 'halo', d: k.haloOf(BENCH, -16, 14, P) })
for (const [x, y] of byDepth(k.corners(BENCH, 16).map(c => ({ c: [c[0], c[1], 0] as Point3 }))).map(o => o.c)) {
  solid(k.cylinder(x, y, 7, -16, 1.6, P, 24), 'lo')
  solid(k.cylinder(x, y, 5.2, -14.4, 3.4, P, 24), 'mid')
}
solid(slab(BENCH, -11, 11, 8, 1.4), 'mid')
line(k.planOutline(k.insetPlan(BENCH, 5), 0, P), 'faint')
for (const [x, y] of k.corners(BENCH, 10)) line(k.ring(x, y, 2.2, 0, P, 16), 'lo')
screwsOn(BENCH, 0, 10)

// ruler strip along the front edge
const STRIP: Plan = { x: -80, y: BENCH.y + BENCH.d - 13, w: 190, d: 7, r: 1 }
solid(slab(STRIP, 0, 0.6), 'lo', { crease: 'none' })
{
  const t = k.topTicks(STRIP.x + 4, STRIP.x + STRIP.w - 4, 5, 5, STRIP.y + 0.8, 0.6, [2, 3.8], P)
  line(t.minor, 'lo'); line(t.major, 'mid')
}
// label plate
const LABEL: Plan = { x: 130, y: BENCH.y + BENCH.d - 20, w: 60, d: 13, r: 1.5 }
solid(slab(LABEL, 0, 0.8), 'lo', { crease: 'none' })
line(k.planOutline(k.insetPlan(LABEL, 1.6), 0.8, P, 3), 'faint')
line(k.lineOnTop([LABEL.x + 6, LABEL.y + 4], [LABEL.x + 40, LABEL.y + 4], 0.8, P), 'lo', undefined, true)
line(k.lineOnTop([LABEL.x + 6, LABEL.y + 6.8], [LABEL.x + 50, LABEL.y + 6.8], 0.8, P), 'lo', undefined, true)
line(k.lineOnTop([LABEL.x + 6, LABEL.y + 9.6], [LABEL.x + 30, LABEL.y + 9.6], 0.8, P), 'lo', undefined, true)
dots([[LABEL.x + 3, LABEL.y + 6.5, 0.8], [LABEL.x + LABEL.w - 3, LABEL.y + 6.5, 0.8]], 0.45, 'mid')

// ── Cables on the bench (drawn before the things that stand on it) ───────
export const ROUTES: Record<RouteId, Point3[]> = {
  // ATM-internal harnesses run down the chase behind the shelves
  reader: [[-172, 10, 152], [-172, -40, 152], [-172, -40, 100], [-172, -30, 100]],
  epp: [[-120, -2, 132], [-120, -40, 132], [-120, -40, 100], [-150, -40, 100], [-150, -30, 100]],
  hsm: [[-150, 10, 100], [-150, 10, 104], [-125, 10, 104], [-125, -10, 79]],
  nic: [[-125, -10, 79], [-125, 4, 75], [-112, 18, 75]],
  // NIC → out through the open side → down → along the bench → switch
  uplink: [[-96, 22, 74], [-82, 22, 74], [-82, 22, 1], [-30, 22, 1], [-30, 34, 1], [-6, 34, 1], [-6, 34, 18]],
  core: [[34, 34, 58], [60, 34, 58], [60, 34, 1], [100, 34, 1], [100, 26, 1], [128, 26, 1], [128, 22, 14]],
}

const wire = (route: RouteId, tone: LineTone = 'lo') =>
  parts.push({ kind: 'wire', points: ROUTES[route].map(at), tone, route })

wire('uplink'); wire('core')
// cable clamps on the bench
for (const [x, y] of [[-56, 22], [-18, 34], [80, 34], [114, 26]] as [number, number][]) {
  solid(slab({ x: x - 3, y: y - 3.5, w: 6, d: 7, r: 1 }, 0, 2.4), 'mid', { crease: 'faint' })
  dots([[x, y - 2.2, 2.4], [x, y + 2.2, 2.4]], 0.4, 'mid')
}

// ── ATM cabinet: back and far-side panels, back posts ────────────────────
const POST = 6
const postAt = (x: number, y: number) => ({ x, y, w: POST, d: POST, r: 0.6 })
solid(slab({ x: CAB.x, y: CAB.y, w: CAB.w, d: 4, r: 0 }, 0, CAB_TOP, 2), 'mid', {
  inner: k.sideSeam({ x: CAB.x, y: CAB.y, w: CAB.w, d: 4, r: 0 }, SHELF_1 + 3, P, 2) + k.sideSeam({ x: CAB.x, y: CAB.y, w: CAB.w, d: 4, r: 0 }, SHELF_2 + 3, P, 2),
})
solid(slab({ x: CAB.x, y: CAB.y, w: 4, d: CAB.d, r: 0 }, 0, CAB_TOP, 2), 'mid')
// vent slots on the far-side panel's inner face (closed outlines)
for (let i = 0; i < 6; i++) {
  const z = 20 + i * 6
  line(k.pathOf([at([CAB.x + 4, -20, z]), at([CAB.x + 4, 20, z]), at([CAB.x + 4, 20, z + 2]), at([CAB.x + 4, -20, z + 2])], true), 'lo')
}
// display against the back panel, facing +y
const SCREEN: Plan = { x: -152, y: CAB.y + 4, w: 54, d: 8, r: 1 }
solid(slab(SCREEN, 140, 40, 2, 0.6), 'mid')
line(k.pathOf([at([-149, SCREEN.y + 8, 144]), at([-101, SCREEN.y + 8, 144]), at([-101, SCREEN.y + 8, 176]), at([-149, SCREEN.y + 8, 176])], true), 'lo')

// plinth
solid(slab({ x: CAB.x + 4, y: CAB.y + 4, w: CAB.w - 4, d: CAB.d - 4, r: 0 }, 0, 8, 2, 0.8), 'lo')

// ── Lower compartment: dispenser cassettes + receipt printer ─────────────
const CASSETTES: Plan[] = [
  { x: -194, y: -30, w: 30, d: 66, r: 1.5 },
  { x: -160, y: -30, w: 30, d: 66, r: 1.5 },
]
for (const c of CASSETTES) {
  solid(slab(c, 8, 34, 3, 0.6), 'mid', { module: 'dispenser', inner: k.sideSeam(c, 30, P, 3) })
  line(k.planOutline(k.insetPlan(c, 3), 42, P, 3), 'faint', 'dispenser')
  // pull handle on the front (+y) face
  const hx = c.x + c.w / 2
  solid(slab({ x: hx - 6, y: c.y + c.d, w: 12, d: 2, r: 0.6 }, 20, 4), 'mid', { module: 'dispenser' })
  screwsOn(c, 42, 3, 'dispenser')
}
// presenter (belt) on top of the cassettes, carrying the notes forward
const PRESENTER: Plan = { x: -192, y: -8, w: 60, d: 46, r: 1 }
solid(slab(PRESENTER, 42, 5, 2, 0.4), 'lo', { module: 'dispenser' })
for (let i = 0; i < 4; i++) {
  const y = PRESENTER.y + 6 + i * 11
  line(k.lineOnTop([PRESENTER.x, y], [PRESENTER.x + PRESENTER.w, y], 47, P), 'faint', 'dispenser')
}
parts.push({ kind: 'slot', name: 'notes' })

// receipt printer with its paper roll
const PRINTER: Plan = { x: -124, y: -24, w: 30, d: 44, r: 2 }
solid(slab(PRINTER, 8, 26, 3, 0.6), 'mid', { module: 'printer' })
solid(k.cylinder(-109, -8, 10, 34, 12, P, 32), 'hi', { module: 'printer' })
line(k.ring(-109, -8, 3, 46, P, 16), 'lo', 'printer')
solid(slab({ x: -118, y: 12, w: 18, d: 6, r: 0.6 }, 34, 4), 'mid', { module: 'printer' })
parts.push({ kind: 'slot', name: 'paper' })

// shelf 1
const shelf = (z: number) => {
  const plan: Plan = { x: CAB.x + 4, y: CHASE, w: CAB.w - 4, d: CAB.y + CAB.d - CHASE, r: 0 }
  solid(slab(plan, z, 3, 2, 0.5), 'mid')
  dots([[plan.x + 4, plan.y + plan.d - 3, z + 3], [plan.x + plan.w - 4, plan.y + plan.d - 3, z + 3]], 0.45, 'mid')
}
shelf(SHELF_1)

// ── Middle compartment: ATM PC, security module, network card ────────────
const PC: Plan = { x: -192, y: -30, w: 56, d: 58, r: 2 }
const PC_Z = SHELF_1 + 3
solid(slab(PC, PC_Z, 35, 3, 0.8), 'mid', { module: 'pc', inner: k.sideSeam(PC, PC_Z + 6, P, 3) })
dots(Array.from({ length: 20 }, (_, i) => [PC.x + 30 + (i % 5) * 4, PC.y + 8 + Math.floor(i / 5) * 4, PC_Z + 35] as Point3), 0.45, 'lo', 'pc')
solid(k.cylinder(PC.x + 16, PC.y + 18, 9, PC_Z + 35, 1.5, P, 32), 'lo', { module: 'pc' })
line(k.ring(PC.x + 16, PC.y + 18, 2.6, PC_Z + 36.5, P, 16), 'mid', 'pc')
for (let i = 0; i < 3; i++) {
  solid(slab({ x: PC.x + 8 + i * 6, y: PC.y + 36, w: 3, d: 18, r: 0.4 }, PC_Z + 35, 5), 'hi', { module: 'pc' })
}
screwsOn(PC, PC_Z + 35, 3, 'pc')

const HSM: Plan = { x: -132, y: -26, w: 24, d: 26, r: 1.5 }
solid(slab(HSM, PC_Z, 12, 3, 0.8), 'mid', { module: 'hsm' })
solid(slab(k.insetPlan(HSM, 4), PC_Z + 12, 2, 3, 0.4), 'hi', { module: 'hsm' })
screwsOn(HSM, PC_Z + 12, 2, 'hsm')

const NIC: Plan = { x: -126, y: 8, w: 30, d: 20, r: 1.5 }
solid(slab(NIC, PC_Z, 8, 3, 0.6), 'mid', { module: 'nic' })
dots([[NIC.x + 6, NIC.y + NIC.d, PC_Z + 4], [NIC.x + 11, NIC.y + NIC.d, PC_Z + 4]], 0.8, 'hi', 'nic', true)

wire('hsm'); wire('nic')

shelf(SHELF_2)

// ── Upper compartment: card reader and encrypting PIN pad ───────────────
const READER: Plan = { x: -192, y: -10, w: 40, d: 46, r: 2 }
const READER_Z = SHELF_2 + 3 + 14
solid(slab({ x: -188, y: -4, w: 32, d: 30, r: 1 }, SHELF_2 + 3, 14, 2), 'lo')
wire('reader')
solid(slab(READER, READER_Z, 20, 3, 0.8), 'mid', { module: 'reader', inner: k.sideSeam(READER, READER_Z + 10, P, 3) })
solid(k.cylinder(READER.x + 10, READER.y + 12, 5, READER_Z + 20, 6, P, 20), 'mid', { module: 'reader' })
line(k.ring(READER.x + 10, READER.y + 12, 1.6, READER_Z + 26, P, 12), 'lo', 'reader')
screwsOn(READER, READER_Z + 20, 3, 'reader')
// slot bezel on the front face, where the card goes in
solid(slab({ x: READER.x + 6, y: READER.y + READER.d, w: 28, d: 3, r: 0.8 }, READER_Z + 6, 8, 2), 'hi', { module: 'reader' })
parts.push({ kind: 'slot', name: 'card' })

const EPP: Plan = { x: -142, y: 2, w: 44, d: 36, r: 2 }
const EPP_Z = SHELF_2 + 3
wire('epp')
solid(slab(EPP, EPP_Z, 7, 3, 0.8), 'mid', { module: 'epp' })
// privacy hood along the back edge
solid(slab({ x: EPP.x, y: EPP.y - 3, w: EPP.w, d: 3, r: 0.6 }, EPP_Z, 14, 2), 'mid', { module: 'epp' })
for (let row = 0; row < 4; row++) {
  for (let col = 0; col < 3; col++) {
    const key: Plan = { x: EPP.x + 6 + col * 9, y: EPP.y + 5 + row * 7.5, w: 7, d: 5.5, r: 0.8 }
    solid(slab(key, EPP_Z + 7, 2, 2, 0.3), 'hi', { module: 'epp', crease: 'lo' })
  }
}
// function keys column
for (let row = 0; row < 3; row++) {
  solid(slab({ x: EPP.x + 34, y: EPP.y + 5 + row * 9, w: 6, d: 7, r: 0.8 }, EPP_Z + 7, 2, 2, 0.3), 'mid', { module: 'epp' })
}

// ── Cabinet front posts and top rails (in front of everything inside) ────
solid(slab(postAt(CAB.x, CAB.y), 0, CAB_TOP, 2), 'mid')
solid(slab({ x: CAB.x, y: CAB.y, w: CAB.w, d: 5, r: 0 }, CAB_TOP - 5, 5, 2), 'mid')
solid(slab({ x: CAB.x, y: CAB.y, w: 5, d: CAB.d, r: 0 }, CAB_TOP - 5, 5, 2), 'mid')
solid(slab(postAt(CAB.x + CAB.w - POST, CAB.y), 0, CAB_TOP, 2), 'mid')
solid(slab({ x: CAB.x + CAB.w - 5, y: CAB.y, w: 5, d: CAB.d, r: 0 }, CAB_TOP - 5, 5, 2), 'mid')
solid(slab(postAt(CAB.x, CAB.y + CAB.d - POST), 0, CAB_TOP, 2), 'mid')
solid(slab({ x: CAB.x, y: CAB.y + CAB.d - 5, w: CAB.w, d: 5, r: 0 }, CAB_TOP - 5, 5, 2), 'mid')
solid(slab(postAt(CAB.x + CAB.w - POST, CAB.y + CAB.d - POST), 0, CAB_TOP, 2), 'mid')
dots([
  [CAB.x + 2.5, CAB.y + CAB.d - 2.5, CAB_TOP], [CAB.x + CAB.w - 2.5, CAB.y + CAB.d - 2.5, CAB_TOP],
  [CAB.x + CAB.w - 2.5, CAB.y + 2.5, CAB_TOP], [CAB.x + 2.5, CAB.y + 2.5, CAB_TOP],
], 0.55, 'mid')

// ── Switch rack ──────────────────────────────────────────────────────────
solid(slab(k.insetPlan(RACK, -3), 0, 6, 2, 0.6), 'lo')
solid(slab(postAt(RACK.x, RACK.y), 6, RACK_TOP - 6, 2), 'mid')
solid(slab(postAt(RACK.x + RACK.w - POST, RACK.y), 6, RACK_TOP - 6, 2), 'mid')
solid(slab(postAt(RACK.x, RACK.y + RACK.d - POST), 6, RACK_TOP - 6, 2), 'mid')
const UNITS = [12, 30, 48, 66, 84, 102, 120]
UNITS.forEach((z, i) => {
  const unit: Plan = { x: RACK.x + 2, y: RACK.y + 4, w: RACK.w - 4, d: RACK.d - 6, r: 0.6 }
  const isCore = i === 2 // the NDC ↔ ISO 8583 translator / authorization engine
  const h = isCore ? 16 : 14
  solid(slab(unit, z, h, 2, 0.5), isCore ? 'hi' : 'mid', { module: isCore ? 'switch' : undefined })
  // bezel line + status LEDs on the front (+y) face
  const fy = unit.y + unit.d
  line(k.pathOf([at([unit.x + 4, fy, z + 3]), at([unit.x + unit.w - 4, fy, z + 3]), at([unit.x + unit.w - 4, fy, z + h - 3]), at([unit.x + 4, fy, z + h - 3])], true), 'faint', isCore ? 'switch' : undefined)
  dots([[unit.x + 8, fy, z + h / 2], [unit.x + 13, fy, z + h / 2], [unit.x + 18, fy, z + h / 2]], 0.7, isCore ? 'hi' : 'lo', isCore ? 'switch' : undefined, isCore)
  screwsOn(unit, z + h, 2.5, isCore ? 'switch' : undefined)
})
solid(slab(postAt(RACK.x + RACK.w - POST, RACK.y + RACK.d - POST), 6, RACK_TOP - 6, 2), 'mid')
solid(slab(k.insetPlan(RACK, -2), RACK_TOP, 4, 2, 0.6), 'mid')
dots(k.corners(RACK, 3).map(([x, y]) => [x, y, RACK_TOP + 4] as Point3), 0.55, 'mid')

// ── Issuer: the bank's core (authorization host) ─────────────────────────
for (const [plan, h] of [[CORE_A, 104], [CORE_B, 82]] as [Plan, number][]) {
  solid(slab(k.insetPlan(plan, -2), 0, 5, 3, 0.5), 'lo')
  solid(slab(plan, 5, h, 3, 1), 'mid', { module: 'issuer', inner: k.sideSeam(plan, 5 + h * 0.5, P, 3) })
  const fy = plan.y + plan.d
  for (let i = 0; i < 5; i++) {
    const z = 16 + i * 12
    line(k.pathOf([at([plan.x + 5, fy, z]), at([plan.x + plan.w - 5, fy, z]), at([plan.x + plan.w - 5, fy, z + 6]), at([plan.x + 5, fy, z + 6])], true), 'faint', 'issuer')
  }
  dots([[plan.x + 8, fy, h - 6], [plan.x + 13, fy, h - 6]], 0.7, 'hi', 'issuer', true)
  dots(Array.from({ length: 16 }, (_, i) => [plan.x + 8 + (i % 4) * 6, plan.y + 10 + Math.floor(i / 4) * 6, 5 + h] as Point3), 0.45, 'lo', 'issuer')
}

export const PARTS = parts

// ── Packet routes per step (world polylines) ─────────────────────────────
const READER_OUT: Point3 = [-172, 10, READER_Z + 20]
const EPP_OUT: Point3 = [-120, 20, EPP_Z + 9]
const PC_TOP: Point3 = [PC.x + 28, PC.y + 30, PC_Z + 35]
const HSM_TOP: Point3 = [HSM.x + 12, HSM.y + 13, PC_Z + 14]
const NIC_TOP: Point3 = [NIC.x + 15, NIC.y + 10, PC_Z + 8]
const SWITCH_IN: Point3 = [RACK.x + RACK.w / 2, RACK.y + RACK.d - 2, 48 + 16]
const ISSUER_IN: Point3 = [CORE_A.x + 19, CORE_A.y + 26, 109]
const DISPENSER_OUT: Point3 = [-162, 30, 47]

const via = (...pts: Point3[]) => pts
/** Where the packet travels during each step (index = step). */
export const STEP_PATHS: Point3[][] = [
  via(READER_OUT, READER_OUT),
  via(READER_OUT, [-172, -40, 152], [-120, -40, 132], EPP_OUT),
  via(EPP_OUT, [-120, -40, 132], [-150, -40, 100], PC_TOP),
  via(PC_TOP, [-150, 10, 104], HSM_TOP),
  via(HSM_TOP, NIC_TOP, ...ROUTES.uplink, SWITCH_IN),
  via(SWITCH_IN, SWITCH_IN),
  via(SWITCH_IN, ...ROUTES.core, ISSUER_IN),
  via(ISSUER_IN, [128, 22, 14], ...[...ROUTES.core].reverse(), SWITCH_IN),
  via(SWITCH_IN, ...[...ROUTES.uplink].reverse(), NIC_TOP, PC_TOP, DISPENSER_OUT),
]

/** Where the floating name tag sits for each module (world points). */
export const MODULE_TAGS: Record<ModuleId, { label: string; at: Flat }> = Object.fromEntries(
  ([
    ['reader', 'Lector de tarjeta', [READER.x + 20, READER.y + 23, READER_Z + 30]],
    ['epp', 'Teclado cifrado (EPP)', [EPP.x + 22, EPP.y + 18, EPP_Z + 16]],
    ['pc', 'PC del ATM (XFS)', [PC.x + 28, PC.y + 29, PC_Z + 40]],
    ['hsm', 'Módulo de seguridad', [HSM.x + 12, HSM.y + 13, PC_Z + 18]],
    ['nic', 'Tarjeta de red', [NIC.x + 15, NIC.y + 10, PC_Z + 12]],
    ['switch', 'Switch transaccional', [RACK.x + RACK.w / 2, RACK.y + RACK.d / 2, RACK_TOP + 8]],
    ['issuer', 'Banco emisor (core)', [CORE_A.x + 19, CORE_A.y + 26, 115]],
    ['dispenser', 'Dispensador de billetes', [-162, 4, 52]],
    ['printer', 'Impresora de recibos', [-109, -8, 50]],
  ] as [ModuleId, string, Point3][]).map(([id, label, p]) => [id, { label, at: at(p) }]),
) as Record<ModuleId, { label: string; at: Flat }>

/** Point at fraction f (0..1) along a polyline, by length. */
export function along(path: Point3[], f: number): Point3 {
  if (path.length === 1) return path[0]
  const lens = path.slice(1).map((p, i) => Math.hypot(p[0] - path[i][0], p[1] - path[i][1], p[2] - path[i][2]))
  const total = lens.reduce((a, b) => a + b, 0)
  if (total === 0) return path[0]
  let d = Math.min(1, Math.max(0, f)) * total
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i] || i === lens.length - 1) {
      const t = lens[i] ? Math.min(1, d / lens[i]) : 0
      const a = path[i], b = path[i + 1]
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
    }
    d -= lens[i]
  }
  return path[path.length - 1]
}

/** The packet: a small lit envelope rebuilt at its position each frame. */
export function packetAt([x, y, z]: Point3, size = 1.5): SolidPaths {
  const w = 9 * size, d = 6 * size
  return k.slabOf({ x: x - w / 2, y: y - d / 2, w, d, r: 1 }, z, 3.2 * size, P, 2, 0.4)
}

// ── Moving parts built at rest ───────────────────────────────────────────
// Card: sits half out of the reader's slot; slides 14 units in (−y) while read.
export const CARD = k.slabOf({ x: READER.x + 8, y: READER.y + READER.d - 2, w: 24, d: 18, r: 1.2 }, READER_Z + 9.4, 1.2, P, 3)
export const CARD_TRAVEL: Point3 = [0, -14, 0]
// Notes: a small stack on the presenter, pushed out toward the customer (+y).
export const NOTES = k.slabOf({ x: -176, y: 6, w: 26, d: 14, r: 0.6 }, 47, 3, P, 2, 0.3)
export const NOTES_TRAVEL: Point3 = [0, 34, 0]
// Receipt paper out of the printer mouth.
export const PAPER = k.slabOf({ x: -116, y: 18, w: 14, d: 4, r: 0.3 }, 38, 0.6, P, 2)
export const PAPER_TRAVEL: Point3 = [0, 16, 0]
export const translate = (by: Point3, f: number) => k.translateAlong(P, [by[0] * f, by[1] * f, by[2] * f])

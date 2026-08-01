# ATM Simulator Platform

Plataforma de entrenamiento/QA que simula cajeros automáticos (ATM) de distintos bancos. Usuarios internos pueden practicar flujos de depósito, retiro y pago sin tocar un ATM físico ni sistemas reales.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4** con design system Eclipse IDE
- **Zustand** para estado del simulador ATM
- **jose** para JWT en cookie httpOnly | **bcryptjs** para hash de contraseñas
- Datos en **memoria** (reemplazable por Prisma/Postgres sin cambiar la UI)

## Iniciar el proyecto

```bash
npm install
npm run dev
# Abrir http://localhost:3000
```

## Usuarios de prueba

| Usuario | Contraseña | Rol | Simuladores |
|---------|-----------|-----|-------------|
| `admin` | `admin123` | Administrador | Todos |
| `maria.garcia` | `user123` | Usuario | Santander, BICE |
| `carlos.mendez` | `user123` | Usuario | Santander, Falabella |
| `ana.torres` | `user123` | Usuario | BICE, Falabella |

## Simuladores incluidos

| Banco | Flujos habilitados |
|-------|--------------------|
| Banco Santander Chile | Depósito, Retiro, Pagos |
| Banco BICE | Depósito, Retiro |
| Banco Falabella | Retiro, Pagos |

## Flujo del simulador ATM

1. **IDLE** → clic en ranura de tarjeta → modal de inserción
2. **PIN_ENTRY** → ingresa PIN con teclado del ATM (mín. 4 dígitos + ENTER)
3. **MAIN_MENU** → teclas de función: Depósito / Retiro / Pagos / Salir
4. **Flujo** → monto/servicio → confirmación → resumen
5. Cancelar en cualquier punto → expulsa tarjeta → IDLE

**Atajos teclado físico:** `0-9` dígitos · `Enter` confirmar · `Escape` cancelar · `Backspace` borrar

## Estructura

```
src/
├── app/(eclipse)/dashboard/    # Panel usuario (ATMs asignados)
├── app/(eclipse)/admin/        # Admin: CRUD usuarios/sims/asignaciones
├── app/simulator/[id]/         # Simulador ATM visual completo
├── app/login/                  # Login Eclipse-style
├── app/api/                    # REST API (auth, users, simulators, assignments, transactions)
├── lib/db/                     # Capa de datos in-memory (→ reemplazar por Prisma)
├── lib/auth.ts                 # JWT helpers
├── store/atmStore.ts           # Máquina de estados Zustand del ATM
└── proxy.ts                    # Protección de rutas (Next.js 16)
```

## Próximos pasos

- [ ] DB real: Prisma + PostgreSQL (la capa `src/lib/db/` está preparada)
- [ ] Grupos de usuarios con asignaciones grupo → simulador
- [ ] Logos reales SVG de bancos en `/public/logos/`
- [ ] Validación Luhn del número de tarjeta
- [ ] Impresión de comprobante en PDF
- [ ] Tests E2E con Playwright
- [ ] Límites de retiro y reglas de negocio configurables por simulador

## Variable de entorno

```bash
# .env.local (opcional — tiene default para dev)
JWT_SECRET=tu-secreto-muy-seguro-aqui
```

---

*Original Next.js README abajo:*

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

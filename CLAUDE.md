# RentCAR — Car Rental Management System (ERP)

## Project Overview
RentCAR is a full-stack car rental management ERP built for a single-location agency in Morocco. It manages fleet, clients, reservations, contracts, invoicing, payments, expenses, maintenance, and reporting. The system is bilingual (French/Arabic), responsive (desktop + mobile), and deployed to Vercel from day one.

## Tech Stack
- **Framework:** Next.js 14+ (App Router, TypeScript, Server Components)
- **UI:** shadcn/ui + Tailwind CSS + Lucide Icons
- **Database:** MongoDB Atlas (cloud) + Mongoose ODM
- **Auth:** NextAuth.js v5 (Credentials provider, JWT strategy)
- **Validation:** React Hook Form + Zod schemas
- **i18n:** next-intl (French default + Arabic with full RTL)
- **Theme:** next-themes (dark / light / system)
- **Charts:** Recharts (dashboard visualizations)
- **Dates:** date-fns (formatting, calculations, locale-aware)
- **Hosting:** Vercel (auto-deploy from GitHub)
- **Currency:** MAD (Moroccan Dirham), all monetary fields are Numbers stored in centimes

## Deployment
- **Hosting:** Vercel (production from day 1, auto-deploy from GitHub)
- **Database:** MongoDB Atlas (cloud, free M0 tier for dev)
- **Domain:** Custom domain via Vercel dashboard
- **CI/CD:** Push to main = auto-deploy to production, PRs get preview URLs
- **Env vars:** Managed in Vercel dashboard (production) and .env.local (dev)

## Key Constraints
- Single user (no roles/permissions, just a login gate via NextAuth)
- Single location (no multi-branch logic)
- Bilingual: French (default) + Arabic (RTL)
- Responsive: desktop-first, fully usable on mobile/tablet
- All monetary values in MAD (Moroccan Dirham)
- Moroccan document types: CIN, permis de conduire
- Moroccan license plate format: XXXXX-A-XX

## Project Structure
```
src/
├── app/
│   ├── layout.tsx                 # Root layout: fonts, providers, metadata
│   ├── page.tsx                   # Redirect → /dashboard
│   ├── login/page.tsx             # Login page (public)
│   ├── (dashboard)/
│   │   ├── layout.tsx             # Authenticated shell: sidebar + topbar
│   │   ├── dashboard/page.tsx
│   │   ├── vehicles/page.tsx
│   │   ├── clients/page.tsx
│   │   ├── reservations/page.tsx
│   │   ├── contracts/page.tsx
│   │   ├── calendar/page.tsx
│   │   ├── invoicing/page.tsx
│   │   ├── payments/page.tsx
│   │   ├── cashflow/page.tsx
│   │   ├── expenses/page.tsx
│   │   ├── maintenance/page.tsx
│   │   ├── alerts/page.tsx
│   │   ├── documents/page.tsx
│   │   ├── reports/page.tsx
│   │   └── settings/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── dashboard/stats/route.ts
│       ├── vehicles/route.ts
│       ├── vehicles/[id]/route.ts
│       ├── clients/route.ts
│       ├── clients/[id]/route.ts
│       ├── reservations/route.ts
│       ├── reservations/[id]/route.ts
│       ├── contracts/route.ts
│       ├── contracts/[id]/route.ts
│       ├── invoices/route.ts
│       ├── invoices/[id]/route.ts
│       ├── payments/route.ts
│       ├── expenses/route.ts
│       ├── maintenance/route.ts
│       └── maintenance/[id]/route.ts
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx            # Collapsible sidebar with nav groups
│   │   ├── topbar.tsx             # Page title, date, theme toggle, lang switch
│   │   ├── mobile-nav.tsx         # Sheet-based mobile navigation
│   │   └── nav-items.ts           # Centralized nav config array
│   ├── dashboard/
│   │   ├── kpi-cards.tsx
│   │   ├── fleet-overview.tsx
│   │   ├── revenue-chart.tsx
│   │   ├── recent-activity.tsx
│   │   ├── alerts-panel.tsx
│   │   └── utilization-gauge.tsx
│   ├── vehicles/
│   │   ├── vehicle-table.tsx      # DataTable with columns
│   │   ├── vehicle-form.tsx       # Add/Edit form (Sheet)
│   │   ├── vehicle-detail.tsx     # Detail view (Sheet)
│   │   └── columns.tsx            # Table column definitions
│   ├── clients/
│   │   ├── client-grid.tsx        # Card-based grid
│   │   ├── client-form.tsx
│   │   └── client-detail.tsx
│   ├── reservations/
│   │   ├── reservation-table.tsx
│   │   ├── reservation-form.tsx
│   │   └── availability-check.tsx
│   ├── contracts/
│   │   ├── contract-table.tsx
│   │   ├── contract-form.tsx
│   │   ├── pickup-form.tsx        # Vehicle pickup checklist
│   │   └── return-form.tsx        # Vehicle return checklist
│   ├── shared/
│   │   ├── data-table.tsx         # Reusable table with search/filter/pagination
│   │   ├── status-badge.tsx       # Color-coded status indicators
│   │   ├── confirm-dialog.tsx     # Delete confirmation
│   │   ├── empty-state.tsx        # No data placeholder
│   │   ├── page-header.tsx        # Title + action button layout
│   │   └── loading-skeleton.tsx   # Skeleton loaders
│   ├── ui/                        # shadcn/ui components (auto-generated)
│   └── providers/
│       ├── theme-provider.tsx     # next-themes wrapper
│       ├── session-provider.tsx   # NextAuth session
│       └── locale-provider.tsx    # next-intl wrapper
├── lib/
│   ├── mongodb.ts                 # Mongoose connection singleton (cached)
│   ├── auth.ts                    # NextAuth config + helpers
│   ├── utils.ts                   # cn() helper, formatCurrency(), formatDate()
│   └── validations.ts            # Zod schemas for all entities
├── models/
│   ├── Vehicle.ts
│   ├── Client.ts
│   ├── Reservation.ts
│   ├── Contract.ts
│   ├── Invoice.ts
│   ├── Payment.ts
│   ├── Expense.ts
│   ├── Maintenance.ts
│   └── AuditLog.ts
├── types/
│   └── index.ts                   # Shared TS interfaces for all entities
├── hooks/
│   ├── use-vehicles.ts            # SWR/fetch hook for vehicles
│   ├── use-clients.ts
│   ├── use-reservations.ts
│   └── use-debounce.ts
├── i18n/
│   ├── fr.json                    # French translations
│   ├── ar.json                    # Arabic translations
│   └── config.ts                  # i18n setup
└── middleware.ts                   # Auth protection + locale detection
```

## Database Collections & Schemas

### Vehicle
brand (String, required), model (String, required), plate (String, unique, required), year (Number), color (String), fuel (Enum: Diesel|Essence|Hybride|Electrique), mileage (Number), dailyRate (Number, MAD), status (Enum: available|rented|reserved|maintenance), vin (String), insuranceExpiry (Date), technicalInspection (Date), notes (String), timestamps

### Client
firstName (String, required), lastName (String, required), phone (String, required), email (String), cin (String), passport (String), drivingLicense (String, required), licenseExpiry (Date), address (String), city (String), nationality (String), dateOfBirth (Date), emergencyContact (String), clientType (Enum: regular|vip|blacklisted), totalRentals (Number, computed), totalSpent (Number, computed), notes (String), timestamps

### Reservation
clientId (ObjectId ref → Client), vehicleId (ObjectId ref → Vehicle), startDate (Date), endDate (Date), status (Enum: pending|confirmed|active|completed|cancelled), dailyRate (Number, snapshot), totalDays (Number, computed), totalPrice (Number, computed), deposit (Number), notes (String), timestamps

### Contract
reservationId (ObjectId ref), clientId (ObjectId ref), vehicleId (ObjectId ref), contractNumber (String, auto: RC-YYYY-NNNN), signedAt (Date), mileageOut (Number), mileageIn (Number), fuelLevelOut (Enum: full|3/4|1/2|1/4|empty), fuelLevelIn (Enum), damageReportOut (String), damageReportIn (String), status (Enum: active|completed|disputed), timestamps

### Invoice
contractId (ObjectId ref), clientId (ObjectId ref), invoiceNumber (String, auto: INV-YYYY-NNNN), amount (Number), tax (Number), totalAmount (Number), status (Enum: draft|sent|paid|overdue|cancelled), dueDate (Date), paidAt (Date), paymentMethod (String), notes (String), timestamps

### Payment
invoiceId (ObjectId ref), clientId (ObjectId ref), amount (Number), method (Enum: cash|card|transfer|cheque), reference (String), date (Date), notes (String), timestamps

### Expense
vehicleId (ObjectId ref, optional), category (Enum: fuel|repair|insurance|tax|parking|other), amount (Number), description (String), date (Date), receipt (String, file path), timestamps

### Maintenance
vehicleId (ObjectId ref), type (Enum: oil_change|tires|brakes|inspection|repair|other), description (String), cost (Number), date (Date), nextDue (Date), status (Enum: scheduled|in_progress|completed), timestamps

### AuditLog
action (Enum: create|update|delete), entity (String), entityId (ObjectId), details (Mixed/JSON), timestamp (Date)

## API Patterns
Every resource follows the same RESTful pattern:
- `GET /api/[resource]` → List with query params: ?search=, ?status=, ?page=, ?limit=
- `POST /api/[resource]` → Create (validates body with Zod)
- `GET /api/[resource]/[id]` → Get single document
- `PUT /api/[resource]/[id]` → Update (partial, validates with Zod)
- `DELETE /api/[resource]/[id]` → Soft delete or hard delete

### API Response Format
```json
// Success (single)
{ "success": true, "data": { ... } }

// Success (list with pagination)
{ "success": true, "data": [...], "total": 50, "page": 1, "limit": 20 }

// Error
{ "success": false, "error": "Validation failed", "details": [...] }
```

### API Route Template
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Vehicle from "@/models/Vehicle";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const filter: any = {};
  if (status && status !== "all") filter.status = status;
  if (search) filter.$or = [
    { brand: { $regex: search, $options: "i" } },
    { model: { $regex: search, $options: "i" } },
    { plate: { $regex: search, $options: "i" } },
  ];

  const [data, total] = await Promise.all([
    Vehicle.find(filter).skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 }).lean(),
    Vehicle.countDocuments(filter),
  ]);

  return NextResponse.json({ success: true, data, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  try {
    const body = await req.json();
    // validate with Zod schema here
    const vehicle = await Vehicle.create(body);
    return NextResponse.json({ success: true, data: vehicle }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
```

## Coding Conventions

### General
- TypeScript strict mode enabled
- Use server components by default, add "use client" only when interactivity is needed
- Prefer async/await over .then() chains
- Error handling: try/catch in all API routes, return proper HTTP status codes
- No console.log in production code (use console.error for actual errors)

### Naming
- Components: PascalCase, one per file (`VehicleForm.tsx`)
- Files/folders: kebab-case (`vehicle-form.tsx`)
- API routes: kebab-case (`/api/vehicles/[id]/route.ts`)
- Types/interfaces: PascalCase with `I` prefix for interfaces (`IVehicle`)
- Zod schemas: camelCase with `Schema` suffix (`vehicleSchema`)
- Hooks: camelCase with `use` prefix (`useVehicles`)
- Constants: UPPER_SNAKE_CASE (`VEHICLE_STATUS`)

### Component Patterns
- Forms: React Hook Form + Zod resolver + shadcn/ui form components
- Tables: shadcn/ui DataTable with TanStack Table
- Modals: shadcn/ui Sheet (slide-out panels) for forms, Dialog for confirmations
- Loading: Skeleton components while data fetches
- Empty states: Illustrated placeholder with action button
- Toast notifications: shadcn/ui Sonner for success/error feedback

### MongoDB / Mongoose
- Connection: singleton pattern in `/src/lib/mongodb.ts` (cached across hot reloads)
- Models: defined once, check `mongoose.models` before creating
- Always use `lean()` for read queries (returns plain objects, better performance)
- Populate references only when needed
- Indexes: add for frequently queried fields (plate, status, clientId, etc.)
- Model template:
```typescript
import mongoose, { Schema, Document } from "mongoose";

export interface IVehicle extends Document {
  brand: string;
  model: string;
  plate: string;
  // ... all fields
}

const VehicleSchema = new Schema<IVehicle>({
  brand: { type: String, required: true },
  model: { type: String, required: true },
  plate: { type: String, required: true, unique: true },
  status: { type: String, enum: ["available", "rented", "reserved", "maintenance"], default: "available" },
  // ... all fields
}, { timestamps: true });

VehicleSchema.index({ plate: 1 });
VehicleSchema.index({ status: 1 });

export default mongoose.models.Vehicle || mongoose.model<IVehicle>("Vehicle", VehicleSchema);
```

### Styling
- Tailwind CSS utility classes (no custom CSS files)
- Dark mode: use `dark:` variant classes
- RTL: use `rtl:` variant or logical properties (ms-, me-, ps-, pe-)
- Responsive: `sm:`, `md:`, `lg:`, `xl:` breakpoints
- shadcn/ui components as base, customize via className prop
- Color palette defined in `tailwind.config.ts` extending shadcn defaults
- **NO gradient colors anywhere** — use flat, solid colors only (no bg-gradient-to-*, no linear-gradient, no radial-gradient). Backgrounds, buttons, badges, cards, charts, and all UI elements must use single solid colors.
- **NO gradient colors anywhere** — use flat, solid colors only. No `bg-gradient-to-*`, no `linear-gradient()`, no gradient text, no gradient borders. Keep the UI clean and professional with solid color fills.

### i18n
- All user-facing strings must come from translation files
- Never hardcode French or Arabic text in components
- Use `useTranslations()` hook in client components
- Use `getTranslations()` in server components
- Date formatting: `format(date, 'PPP', { locale })` with date-fns
- Number formatting: `Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' })`

## Authentication Flow
1. User visits any `/dashboard/*` route
2. Middleware checks for NextAuth session
3. If no session → redirect to `/login`
4. User enters email + password on login page
5. NextAuth validates against ADMIN_EMAIL + ADMIN_PASSWORD_HASH env vars
6. On success → JWT token stored in HTTP-only cookie → redirect to `/dashboard`
7. All `/api/*` routes check session with `getServerSession()`
8. Logout clears the session cookie

## Business Logic Rules
- When a reservation is confirmed → vehicle status changes to "reserved"
- When a contract starts (pickup) → vehicle status changes to "rented"
- When a contract completes (return) → vehicle status changes to "available"
- When a reservation is cancelled → vehicle status reverts to "available"
- Vehicle in "maintenance" status cannot be reserved or rented
- Invoice is auto-generated when a contract is completed
- Late returns: calculate extra days × dailyRate and add to invoice
- Client totalRentals and totalSpent are updated after each completed contract
- Alerts auto-generate when: insurance < 30 days, maintenance overdue, return overdue, invoice unpaid > 7 days

## Modules (Build Order)
1. Project setup + MongoDB connection + NextAuth + theme + i18n providers
2. Layout: sidebar (collapsible), topbar, mobile nav (Sheet), responsive shell
3. Dashboard: KPI cards, fleet overview, revenue chart (Recharts), recent activity, alerts
4. Vehicles: CRUD table, add/edit Sheet, detail view, status filters, search
5. Clients: CRUD card grid, add/edit Sheet, detail view, type filters, search
6. Reservations: CRUD table, availability checker, date-range pricing, status workflow
7. Contracts: generate from reservation, pickup/return forms, PDF generation
8. Invoicing + Payments: auto-generate from contracts, partial payments, status tracking
9. Expenses + Cash flow: log expenses, daily income/expense view, profit calculation
10. Maintenance: schedule, track, cost per vehicle, next-due reminders
11. Calendar: Gantt-style timeline per vehicle, drag support optional
12. Alerts: notification center, auto-generated from business rules
13. Documents: file uploads (client IDs, contracts, receipts), preview/download
14. Reports: revenue, utilization, client stats, expense breakdown, PDF export
15. Settings: agency info, logo upload, default language, change password

## Environment Variables
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/rentcar
NEXTAUTH_URL=https://rentcar.vercel.app
NEXTAUTH_SECRET=your-random-secret-here
ADMIN_EMAIL=admin@rentcar.ma
ADMIN_PASSWORD_HASH=$2b$10$... (bcrypt hash)
```

## Quick Commands
```bash
npm run dev                        # Start dev server (localhost:3000)
npm run build                      # Production build
npm run lint                       # ESLint check
npx shadcn@latest add button       # Add shadcn component
npx shadcn@latest add sheet        # Add sheet component
```

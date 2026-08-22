# Financial Reporting — Trustworthy Ledger

## 1. Accrual vs Cash

- **Accrual (invoiced):** `Revenue.amount` — total invoiced per `jobSiteId`/`machineId` in the selected window (`createdAt` for analytics/reports, `billingStart/End` for contract scope). Use for profitability: `profit = revenue_invoiced - (fuelCost + maintCost + nonFuelExpenses)`.
- **Cash (collected):** `Revenue.amountReceived` — sum collected in same window. Shown alongside invoiced in `Analytics` project table and `Reports` export. Dashboard does NOT show cash — it shows estimated accrued revenue for the day.
- **Current default window:** Last 30 days (`since = now-30d 00:00`) for `Analytics` and `Reports` project summary. `Reports` also respects `?start=&end=` when provided — all aggregates (work, fuel, expense, maintenance, revenue) filter on the same window. No more 30d-vs-all-time mix.

## 2. Fuel double-count prevention

Fuel cost appears **once**, from `FuelLog.totalCost` only.

- `Expense` with `category=FUEL` is **excluded** from analytics/reports aggregates (`where: { category: { not: "FUEL" } }`).
- `Expense.source` / `referenceId` (Phase 4) tracks origin: `FUEL_LOG` vs `MANUAL` for reconciliation without double addition.
- If you import fuel as an `Expense` for bookkeeping, set `category=FUEL` and it will be visible in the Expense list but not added to profit math.

## 3. Payment / reconciliation — not free-form status

`Revenue` uses `paymentStatus` enum `PENDING|PARTIAL|PAID|OVERDUE` validated against `amountReceived` via `revenueSchema.superRefine`:

- `PENDING` ⇒ `amountReceived === 0`
- `PARTIAL` ⇒ `0 < amountReceived < amount`
- `PAID` ⇒ `amountReceived === amount`
- `OVERDUE` ⇒ any `amountReceived < amount` (track separately)
- `amountReceived > amount` always rejected.
- `billingStart/End` validated `YYYY-MM-DD` and `end >= start`.

Reconciliation is via updating `amountReceived` + `paymentStatus` together; do not create a separate `Expense` for collections.

## 4. Single date range, consistently applied

All metrics in `src/app/admin/analytics/page.tsx` and `src/app/admin/reports/page.tsx` (`project` type) and `src/app/api/reports/export/route.ts` (`project` type) filter on the same window:

- `WorkSession`: `startTime gte/lte`
- `FuelLog`: `date gte/lte`
- `Expense` (non-FUEL): `date gte/lte`
- `MaintenanceRecord`: `serviceDate gte/lte`
- `Revenue`: `createdAt gte/lte`

If no `?start=&end=`, analytics defaults to last 30d. Reports defaults to no filter (all-time) except project summary now also respects the picker when set — pass `?start=YYYY-MM-DD&end=YYYY-MM-DD` to scope.

## 5. Dashboard revenue — fixed 1,800 replaced

- **Before:** `estRevenue = todayHours * 1800`.
- **After:** `src/app/admin/dashboard/page.tsx` loads `JobSite.rate` per site, sums `hours * site.rate` per completed `WorkSession` for the day; fallback 1800 only when session has no `jobSiteId` or site has no rate. Subtitle shows `₹<avgRate>/hr avg • <hours>h • from site rates` and `~` when fallback was used. `billingType` (HOURLY/DAILY/FIXED) is respected as `rate` per hour — DAILY/FIXED sites should set an hourly equivalent rate or extend logic to `days * rate`.

## 6. Code references

- `src/app/admin/analytics/page.tsx` — single window + `category not FUEL`
- `src/app/admin/reports/page.tsx` — project summary now windowed
- `src/app/api/reports/export/route.ts` — same, plus date validation `YYYY-MM-DD`
- `src/lib/validations/revenue.ts` — `superRefine`
- `src/app/admin/dashboard/page.tsx` — weighted site rates

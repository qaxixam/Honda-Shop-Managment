# HBMS React — Polished Frontend

Offline-first Honda Bike Shop Management System frontend. No backend required.

## Main improvements
- Reusable UI components: `KpiCard`, `MetricCard`, `FormField`, `EmptyState`, `IconButton`, and modular POS components.
- Dashboard redesigned around clickable KPI cards instead of charts.
- Sales, profit, customer outstanding, supplier payable, low stock, product sales, service revenue and collected cash details.
- POS rebuilt for quick counter use with search, quick-add products/services, customer selection/addition, quantity controls, payment summary, save/update and print.
- Saving a POS invoice immediately updates product stock, customer balances and reports.
- Receipt printing supports standard browser printing, thermal printer workflows and Save as PDF.
- Inventory keeps shelf/rack location for every product.
- Supplier purchases update stock and supplier payable automatically; supplier payments can be recorded later.
- Expenses support custom names plus edit/delete.
- Employee management tracks salary, advance and remaining salary.
- Current web builds start from the seed data in `src/data`.
- Desktop persistence is intentionally left for the future Electron/database build.

## Run
```bash
npm install
npm run dev
```

## Verify
```bash
npm run check
```

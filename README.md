# DealerOS — SA Motors London

Internal dealership management system. Spring Boot backend + H2 file-mode persistent database. Vanilla JS ES Modules frontend served directly by Spring Boot.

---

## Table of Contents

1. [Business Overview](#business-overview)
2. [Original Requirements](#original-requirements)
3. [Requirements & Solutions](#requirements--solutions)
4. [Data Model](#data-model)
5. [Project Structure](#project-structure)
6. [Build & Run](#build--run)
7. [API Reference](#api-reference)
8. [Frontend Data Flow](#frontend-data-flow)
9. [Troubleshooting](#troubleshooting)

---

## Business Overview

SA Motors is a small used-car dealership at 64 Nile Street, London N1 operating on an **investor-funded model**. Private investors (James, Joseph, Daniel, Jeff…) contribute capital which the business uses to buy vehicles at auction or via part-exchange. Once a vehicle is sold, gross profit is split between SA Motors and the investor at a pre-agreed percentage. The system must track every vehicle's full lifecycle and maintain transparent financial records for all parties.

**Key numbers from live data:**
- ~29 vehicles in stock at any time
- 95 vehicles sold historically, averaging **£1,432 profit per car**
- Average time to sell: **9 days**
- 7 active investors with a combined capital base of ~£140,000
- Sale price range: £500 – £11,000 (budget/mid-market segment)

---

## Original Requirements

The following requirements were derived from the business's manual workflow (previously tracked in Excel spreadsheets):

| # | Requirement |
|---|-------------|
| R1 | Track every vehicle from purchase to sale, including all reconditioning and running costs |
| R2 | When a car is sold, automatically calculate gross profit and split it between SA Motors and the investor at the correct percentage |
| R3 | Maintain an accurate ledger per investor: capital deployed, capital free, total profit earned |
| R4 | Generate a formal investor invoice for every sale, as an immutable financial record |
| R5 | Track all expenses (per-vehicle and overhead) with categorisation for VAT and reporting |
| R6 | Assign every vehicle a unique, readable stock ID; every invoice a unique invoice number |
| R7 | Store and organise photos and documents per vehicle in a structured folder hierarchy |
| R8 | Track MOT expiry dates and flag vehicles approaching expiry |
| R9 | Manage fines (PCN, ULEZ, parking) linked to specific vehicles |
| R10 | Schedule and track customer viewings with a calendar view |
| R11 | Manage staff (drivers, prep) and log wage payments |
| R12 | Surface financial reporting: profit by month, top performers, VAT estimate, investor breakdown |
| R13 | Publish vehicle listings to Auto Trader and Instagram directly from the system |

---

## Requirements & Solutions

### R1 — Vehicle Lifecycle Management

**Problem:** Track every vehicle from the moment it enters stock until it is sold, capturing all costs that accumulate during the reconditioning process so that true profit can be calculated at sale time.

**Solution — `VehicleService.addVehicle()`:**

```
POST /api/vehicles
        │
        ▼
1. Normalise plate  →  uppercase, strip spaces
2. Duplicate check  →  throw 400 if plate already exists
3. Generate Stock ID  →  SA-{YYYY}-{NNNNN}
        query MAX(sequence) from DB, increment by 1
        wrapped in @Transactional to prevent race conditions
4. Set status = STOCK
5. Calculate totalCost = purchasePrice + reconCost + additionalCosts
6. Create physical folder structure:
        files/Cars/SA-2026-00001/
            Photos/, Documents/, ServiceHistory/,
            MOT/, Purchase/, Sale/, Delivery/, Collection/
```

**Dynamic cost tracking — `refreshTotalCost()`:**

Every time a cost is logged against a vehicle (`POST /api/vehicles/{stockId}/costs`), the system recalculates the vehicle's total cost from scratch:

```
FinanceEntry saved to DB
        │
        ▼
VehicleService.refreshTotalCost()
        SUM all FinanceEntries WHERE stockId = this vehicle
        totalCost = purchasePrice + SUM(entries)
        Vehicle record updated immediately
```

**Why:** Rather than manually accumulating a running total (error-prone), each cost is an independent record and the total is always derived from the source of truth. This also means costs can be deleted or corrected without corrupting the vehicle's financials.

---

### R2 — Sell a Car & Profit Split

**Problem:** When a vehicle is sold, the system must calculate gross profit, divide it between SA Motors and the investor at the correct percentage, create an invoice, update the investor's balance, and mark the vehicle as sold — all atomically. A partial write (e.g. vehicle marked SOLD but no invoice created) would be a serious data integrity failure.

**Solution — `SaleService.sellVehicle()` — `@Transactional`:**

```
POST /api/sales/sell  { stockId, salePrice, saleDate, customerName, ... }
        │
        ▼
Step 1 — Validate
        Vehicle exists           → 404 if not found
        Status is STOCK/RESERVED → 400 if already SOLD or WRITTEN_OFF

Step 2 — Refresh totalCost
        Recompute from all FinanceEntries before profit calculation

Step 3 — Calculate financials
        grossProfit    = salePrice − totalCost
        investorProfit = grossProfit × investorSharePct / 100
        saProfit       = grossProfit − investorProfit

Step 4 — Create SoldVehicle record
        Full snapshot of vehicle data at point of sale
        daysInStock = dateSold − dateAcquired

Step 5 — Create InvestorInvoice
        invoiceNumber = INV-{YYYY}-{NNNNN}  (auto-incremented)
        Financial snapshot: what was paid, what was sold for,
        who gets what — immutable after creation

Step 6 — Mark Vehicle → status = SOLD

Step 7 — Update Investor ledger
        totalProfit += investorProfit
        purchased   -= totalCost      (capital in this vehicle is freed)
        recalc()  →  available = totalBalance − purchased
```

**Why `@Transactional`:** If any of the 7 steps throws, the entire transaction rolls back. This prevents states like "vehicle is SOLD but investor balance was never updated" or "invoice exists but vehicle is still showing as STOCK".

**Snapshot principle:** `InvestorInvoice` captures a point-in-time financial snapshot. Future edits to the vehicle record or investor percentage do not alter historical invoices.

---

### R3 — Investor Ledger

**Problem:** Each investor needs a live view of: how much capital they have deployed in current stock, how much profit they have earned to date, and how much capital is free to invest in new vehicles.

**Solution — `Investor` entity with derived fields:**

```
initialBalance      Capital originally deposited by the investor
capitalReturned     Capital paid back to the investor
totalProfit         Cumulative profit earned across all sold vehicles
purchased           Sum of totalCost for all vehicles currently in stock
                    linked to this investor  (capital currently locked)
─────────────────────────────────────────────────────────────────────
totalBalance = initialBalance + totalProfit − capitalReturned
available    = totalBalance − purchased        ← free capital
```

**`Investor.recalc()`** is called after every state change. It recomputes `totalBalance` and `available` from the primary fields above. No redundant aggregated values are stored.

**Capital lifecycle through one vehicle:**
```
Vehicle purchased  →  purchased += totalCost      (capital locked)
Vehicle sold       →  totalProfit += investorProfit
                       purchased  -= totalCost     (capital released)
                   →  available increases automatically
```

---

### R4 — Investor Invoice (Immutable Financial Record)

**Problem:** Investors need a formal record of each sale showing exactly what the vehicle cost, what it sold for, and how much they are owed — in a format that cannot change after the fact.

**Solution — `InvestorInvoice` entity:**

Created atomically as part of the sell transaction (Step 5 in R2). Key design decisions:

- **Snapshot, not reference:** All financial figures (purchasePrice, reconCost, totalCost, salePrice, grossProfit, investorAmount, saAmount) are copied into the invoice at creation time. The invoice never reads from the live Vehicle record.
- **Unique number:** `INV-{YYYY}-{NNNNN}` generated from `MAX(sequence)+1` in the same transaction.
- **One invoice per vehicle:** enforced by a unique constraint on `stockId`.

```
InvestorInvoice fields (snapshot at point of sale):
    invoiceNumber     INV-2026-00007
    plate / make / model / colour / year / mileage
    purchasePrice     £4,200
    reconCost         £350
    additionalCosts   £180   (MOT, valet, transport)
    totalCost         £4,730
    salePrice         £6,995
    grossProfit       £2,265
    investorSharePct  40%
    investorAmount    £906
    saAmount          £1,359
    paymentMethod     Bank Transfer
    customerName      John Smith
```

---

### R5 — Finance Log & Expense Tracking

**Problem:** A vehicle's true cost of ownership spans many line items: auction price, transport, preparation, MOT, valet, parts, labour. Overhead costs (AutoTrader subscription, insurance, fuel) also need tracking separately. All of this feeds into VAT calculations and profit reporting.

**Solution — `FinanceEntry` entity:**

Each expense is a single independent record. The `stockId` field determines whether it is vehicle-specific or an overhead:

```
FinanceEntry
    id          auto-generated
    stockId     "SA-2026-00001"  or  null / ""  for overheads
    plate       denormalised for quick lookup
    date        LocalDate
    category    Parts / Labour / Valet / MOT / Transport /
                Fuel / Warranty / Fees / Fixed Overhead / Other
    description free text
    amount      BigDecimal
    paymentMethod  Cash / Debit Card / Bank Transfer
    paidBy      Business / Personal
```

**Key queries:**
```sql
-- Total cost of one vehicle (used by refreshTotalCost)
SELECT SUM(amount) FROM finance_entries WHERE stock_id = 'SA-2026-00001'

-- All overhead entries (for VAT input tax calculation)
SELECT * FROM finance_entries WHERE stock_id IS NULL OR stock_id = ''

-- This month's spend
SELECT SUM(amount) FROM finance_entries
WHERE date BETWEEN '2026-04-01' AND '2026-04-30'
```

---

### R6 — Unique Identifiers (Audit Trail)

**Problem:** Every vehicle and every financial transaction needs a human-readable unique identifier that is sequential and includes the year, so historical records are self-explanatory.

**Solution:**

| Identifier | Format | Example | Generation |
|-----------|--------|---------|-----------|
| Stock ID | `SA-YYYY-NNNNN` | `SA-2026-00042` | `MAX(CAST(SUBSTRING(stockId, 9) AS int)) + 1` |
| Invoice Number | `INV-YYYY-NNNNN` | `INV-2026-00007` | `MAX(CAST(SUBSTRING(invoiceNumber, 10) AS int)) + 1` |

Both use the same pattern: query the current maximum sequence from the database, increment by 1, format with zero-padding. Wrapped in `@Transactional` to prevent duplicate IDs under concurrent requests.

---

### R7 — Structured File Storage

**Problem:** Each vehicle accumulates many files over its lifecycle: purchase invoice, V5C, MOT certificate, service history, photos, delivery paperwork. These need to be stored and accessible without manual folder management.

**Solution — `FileStructureService`:**

Folder hierarchy created automatically when a vehicle is added:

```
files/
├── Cars/
│   └── SA-2026-00001/
│       ├── Photos/          ← vehicle images  (served at /files/Cars/.../Photos/*)
│       ├── Documents/       ← V5C logbook, service book scan
│       ├── ServiceHistory/  ← repair invoices
│       ├── MOT/             ← MOT test certificate
│       ├── Purchase/        ← auction receipt / purchase invoice
│       ├── Sale/            ← investor invoice PDF
│       ├── Delivery/        ← delivery note
│       └── Collection/      ← collection paperwork
└── Investors/
    └── James/               ← investor-level documents
```

Spring Boot serves the `files/` directory at `/files/**` via `WebConfig.addResourceHandlers()`. Upload via `POST /api/vehicles/{stockId}/photos` or `POST /api/vehicles/{stockId}/files`.

---

### R8 — MOT Expiry Tracking

**Problem:** Vehicles with expired or soon-to-expire MOTs cannot be legally driven, tested by customers, or sold. The business needs to be alerted before expiry.

**Solution:**

`Vehicle` entity stores `motExpiry` (LocalDate) and `needsMot` (boolean). The dashboard and MOT Tracker page filter stock for vehicles where:

```
(motExpiry − today) ≤ 90 days
```

Alerts are surfaced on the dashboard. The MOT Tracker page supports DVSA API lookup (`GET https://driver-vehicle-licensing.api.gov.uk/mot-tests/v1/...`) to verify current MOT status from the official register.

---

### R9 — Fines & Penalties

**Problem:** Dealership vehicles on trade plates or being moved attract PCN, ULEZ, and parking fines. These need to be tracked per vehicle, with outstanding amounts visible so nothing escalates to bailiff action.

**Solution — `Fine` entity:**

```
Fine
    plate         linked vehicle
    type          PCN / ULEZ / Parking / Speeding / Other
    amount        BigDecimal
    issuedDate    LocalDate
    dueDate       LocalDate
    status        Outstanding / Paid / Appealing / Cancelled
    reference     penalty notice reference number
    notes         appeal text, correspondence
```

Dashboard badge shows count of outstanding fines. Reports page flags outstanding fines as an action item.

---

### R10 — Viewings Calendar

**Problem:** Customer viewings need to be scheduled, tracked, and shown on a calendar so the team knows what is booked and can follow up on outcomes.

**Solution — `Viewing` entity + calendar grid:**

```
Viewing
    vehicle plate / model
    date / time
    customerName / phone / email
    status        Pending / Confirmed / Completed / No-show / Cancelled
    notes
```

The Viewings page renders a monthly calendar grid. Nav badge shows count of pending + confirmed viewings. Status updates trigger `updateNavBadges()`.

---

### R11 — Staff & Wage Payments

**Problem:** The business employs drivers and prep/bodywork staff on flexible pay arrangements (per job, per car). Payments need to be logged and outstanding amounts tracked.

**Solution — `Staff` and `WagePayment` entities:**

```
Staff
    name / role / payType (Per Job / Per Car / Salary) / rate
    owed      current amount owed to this staff member
    paid      total paid to date

WagePayment
    staffName / amount / date / period / method
```

`addOwed()` increases what is owed. `logPayment()` decreases `owed`, increases `paid`, and creates a `WagePayment` record for the audit trail.

---

### R12 — Reporting & VAT

**Problem:** The business needs monthly profit visibility, identification of best/worst performers, and a VAT estimate for HMRC submissions.

**Solution:**

**Reports page** computes directly from `state.soldData`:
- Total profit, revenue, cars sold, avg profit/car, avg days to sell
- Top 10 vehicles by profit (bar chart)
- 8-month rolling profit bar chart
- Automated recommendations (unlisted stock, overdue MOTs, aged inventory)

**VAT Tracker** uses a simplified estimate:
```
outputVAT = SUM(soldPrice) / 6          (1/6 of VAT-inclusive sale price = 20% VAT)
inputVAT  = SUM(finLog expenses) / 6   (VAT reclaimable on purchases)
netVATOwed = outputVAT − inputVAT
```
> Note: UK dealer margin scheme rules may apply differently — the VAT page includes a disclaimer to review with an accountant.

---

### R13 — Auto Trader & Instagram Integration

**Problem:** Listings need to go live on Auto Trader and the business Instagram account. Copy-pasting between systems is slow and error-prone.

**Solution — Demo/sandbox mode:**

Both integrations are fully UI-complete with a **demo mode** that simulates the API calls locally (no real credentials needed for development). Live mode requires:

- **Auto Trader:** API key + dealer ID from the Auto Trader Dealer Portal
- **Instagram:** Meta Business Suite app credentials (Instagram Graph API)

The listing workflow (Auto Trader) is a 5-step modal: Details → Description (AI-generated) → Spec → Photos → Publish.

---

## Data Model

```
Vehicle ─────────────────────────── (N) FinanceEntry
   │           one vehicle has           (per-vehicle costs)
   │           many cost entries
   │
   │  on sale (atomic @Transactional)
   ├──────────────────────────────── SoldVehicle          (1:1 with Vehicle)
   │
   └──────────────────────────────── InvestorInvoice      (1:1 with Vehicle)
                                              │
                                              │  profit credited to
                                              ▼
                                         Investor
                                    (totalProfit, purchased,
                                     available auto-updated)

Supporting entities (independent):
    Fine         → linked by plate
    Viewing      → linked by plate
    ServiceRecord → linked by stockId
    CollectionEntry
    Staff / WagePayment
    Receipt
    Task
```

---

## Project Structure

```
dealership-management/
├── backend/                        Spring Boot 3.2 / Java 17
│   ├── src/main/java/com/dealeros/
│   │   ├── controller/             REST endpoints (/api/*)
│   │   ├── model/                  JPA entities
│   │   ├── service/                Business logic
│   │   ├── repository/             Spring Data JPA repos
│   │   └── config/                 WebConfig (CORS, static files)
│   └── src/main/resources/
│       └── application.properties
├── frontend/                       Vanilla JS ES Modules
│   ├── index.html
│   ├── css/                        variables.css, layout.css, components.css
│   └── js/
│       ├── main.js                 Entry point — boot, API load, window bindings
│       ├── state.js                Global mutable state
│       ├── api.js                  REST wrappers
│       ├── nav.js                  Navigation, modals, badges
│       ├── utils.js                Pure helpers (fmt, escHtml…)
│       ├── media.js                Photo manager
│       ├── logo.js                 Logo base64
│       ├── app-data.js             Demo/seed data (from spreadsheet)
│       └── pages/                  20 page modules
├── data/                           H2 database files — auto-created
├── files/                          Vehicle photos & documents — auto-created
├── start.sh                        One-command start script
└── Master_Spreadsheet_TRIAL_sanitised.xlsx
```

---

## Build & Run

### Requirements

| Tool | Version | Install |
|------|---------|---------|
| Java | 17+ | `brew install openjdk@17` |
| Maven | 3.8+ | `brew install maven` |
| Browser | Any modern | — |

```bash
java -version   # must be 17+
mvn -version    # must be 3.8+
```

### Quickstart (recommended)

```bash
cd dealership-management/
./start.sh
```

Open **http://localhost:8080** — first run takes ~2 min to download Maven dependencies, subsequent starts take ~10 seconds.

### Manual steps

```bash
# 1. Build
cd backend/
mvn package -DskipTests
# JAR created at: backend/target/dealeros-backend-1.0.0.jar

# 2. Run (from project root so ../frontend and ../data paths resolve correctly)
cd ..
java -jar backend/target/dealeros-backend-1.0.0.jar
```

### Stop

```bash
Ctrl+C

# If port 8080 is already in use:
lsof -ti:8080 | xargs kill -9
```

### URLs

| URL | Description |
|-----|-------------|
| http://localhost:8080 | Main application |
| http://localhost:8080/h2-console | H2 database browser |
| http://localhost:8080/api/vehicles | Stock list (JSON) |
| http://localhost:8080/api/sales/sold | Sold history (JSON) |
| http://localhost:8080/api/investors | Investor ledger (JSON) |

### H2 Console credentials

| Field | Value |
|-------|-------|
| Driver Class | `org.h2.Driver` |
| JDBC URL | `jdbc:h2:file:./data/dealeros` |
| User Name | `sa` |
| Password | *(leave blank)* |

### Import spreadsheet data

```bash
curl -X POST http://localhost:8080/api/excel/import \
  -F "file=@Master_Spreadsheet_TRIAL_sanitised.xlsx"
```

### Reset database

```bash
rm data/dealeros.mv.db data/dealeros.trace.db
# Restart — schema recreated automatically by Hibernate
```

---

## API Reference

### Vehicles
```
GET    /api/vehicles                   Current stock list
GET    /api/vehicles/{stockId}         Single vehicle by Stock ID
GET    /api/vehicles/by-plate/{plate}  Single vehicle by plate
POST   /api/vehicles                   Add vehicle to stock
PUT    /api/vehicles/{stockId}         Update vehicle details
PATCH  /api/vehicles/{stockId}/status  Change status (STOCK/RESERVED/SOLD)
DELETE /api/vehicles/{stockId}         Remove from stock
POST   /api/vehicles/{stockId}/costs   Log a cost against a vehicle
GET    /api/vehicles/{stockId}/photos  List photos
POST   /api/vehicles/{stockId}/photos  Upload a photo
```

### Sales
```
POST   /api/sales/sell                 Sell a vehicle (full atomic transaction)
GET    /api/sales/sold                 Sold history
GET    /api/sales/invoices             All investor invoices
GET    /api/sales/invoices/{number}    Single invoice by number
```

### Finance
```
GET    /api/finance                    All expense entries
POST   /api/finance                    Add expense
DELETE /api/finance/{id}              Delete entry
GET    /api/finance/stats              Aggregated totals
```

### Investors
```
GET    /api/investors                  All investors
PUT    /api/investors/{id}             Update budget / share %
POST   /api/investors/{id}/return-capital  Return capital to investor
GET    /api/investors/{name}/vehicles  Stock + sold history for one investor
```

### Other
```
GET/POST /api/viewings                 Viewings calendar
GET/POST /api/fines                    Fines & penalties
GET/POST /api/staff                    Staff records
GET/POST /api/wages                    Wage payments
GET/POST /api/services                 Service history
GET/POST /api/collections              Collections & deliveries
POST     /api/excel/import             Import from Excel workbook
```

---

## Frontend Data Flow

```
DOMContentLoaded (async)
        │
        ├── Promise.all([
        │       GET /api/vehicles,
        │       GET /api/sales/sold,
        │       GET /api/investors,
        │       GET /api/finance
        │   ])
        │       │
        │       ├── success  →  applyStock / applySold / applyInvestors / applyFinance
        │       │               (map API camelCase fields + add snake_case aliases)
        │       │
        │       └── failure / empty DB  →  seedFromAppData()
        │                                   (demo data from app-data.js spreadsheet)
        │
        ├── loadFromStorage()   ←  AT listings, IG posts, photos (localStorage only)
        └── render all pages
```

AT listings, IG posts, and vehicle photos are stored in **localStorage only** — no backend API for these yet.

---

## Troubleshooting

**`Port 8080 already in use`**
```bash
lsof -ti:8080 | xargs kill -9
```

**`Syntax error in SQL` on startup**
H2 reserved keyword conflict. Check that fields named `year` have `@Column(name = "model_year")` in the entity class.

**Frontend returns 404**
Ensure `application.properties` contains:
```properties
spring.web.resources.static-locations=file:../frontend/,classpath:/static/
```
And that the JVM working directory is `backend/` (use `start.sh` to guarantee this).

**DB corruption / want a clean slate**
```bash
rm data/dealeros.mv.db data/dealeros.trace.db
# Restart — Hibernate recreates all tables from entity definitions
```

---

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | Spring Boot 3.2.3, Java 17 |
| Database | H2 file-mode (persistent — no external DB server needed) |
| ORM | Spring Data JPA / Hibernate |
| Excel | Apache POI 5.2.5 |
| Frontend | Vanilla JS ES Modules (no build tool) |
| Fonts | DM Sans, DM Mono (Google Fonts) |

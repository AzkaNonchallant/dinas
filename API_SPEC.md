# API Specification — Corporate Travel Management System (PT Andrea)

Base URL: `/api`
Stack: Express 5 + TypeScript + Prisma (MySQL) + Zod v4 + JWT + Multer

> Dokumen ini sudah diselaraskan dengan implementasi di `src/modules/**`. Lihat bagian
> [9. Status Implementasi](#9-status-implementasi--pekerjaan-yang-terbawa) untuk yang masih kosong.

---

## 0. Konvensi Umum

### 0.1 Autentikasi
Semua endpoint kecuali `POST /api/auth/register` dan `POST /api/auth/login` butuh header:

```
Authorization: Bearer <token>
```

Token = JWT ber-`HS256`, payload: `{ "id": 1, "email": "a@b.co", "role": "EMPLOYEE", "iat": ..., "exp": ... }`.
Role diambil dari DB saat login; **tidak ada endpoint refresh token** — kalau `expired`, user harus login ulang.

### 0.2 Response envelope

```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "..." }
```

Semua response sukses selalu dibungkus `{ success: true, data }` (`utils/response.ts`).
Endpoint hapus biasanya `data: null`.

### 0.3 Error

```json
// AppError (middleware/error.middleware.ts)
{ "success": false, "message": "Hanya pengajuan berstatus DRAFT yang dapat diubah" }

// ZodError → HTTP 422
{
  "success": false,
  "message": "Validasi gagal",
  "errors": [{ "path": "endDate", "message": "endDate harus >= startDate" }]
}

// fallback
{ "success": false, "message": "Terjadi kesalahan pada server" }   // HTTP 500
```

| HTTP | Kapan |
|---|---|
| 400 | Validasi domain (status tidak sesuai, role tidak cocok, file kurang) |
| 401 | Token tidak ada / tidak valid / kedaluwarsa, email-password salah |
| 403 | Sudah login tapi tidak berhak (role, bukan pemilik) |
| 404 | Data tidak ditemukan |
| 409 | Konflik unik (email duplikat, reimbursement untuk travel yang sama) |
| 422 | Gagal validasi Zod |

### 0.4 Pagination

Endpoint list memakai query `page` (default 1) & `limit` (default 10, max 100; notifikasi default 20)
dan membalikkan:

```json
{
  "success": true,
  "data": {
    "data": [ /* items */ ],
    "pagination": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 }
  }
}
```

> Perhatikan nesting `data.data` — `data` luar dari envelope, `data` dalam dari hasil list.

### 0.5 Format data
- `Decimal` (uang) dikirim sebagai **number** (dikonversi `Number(...)`), bukan string.
- Tanggal dikirim sebagai ISO-8601 string (`"2026-10-01T00:00:00.000Z"`).
- `password` **tidak pernah** dikembalikan (dikecualikan di `utils/sanitize.ts`).
- Multipart upload: field file bernama **`file`** (TravelDocument) atau **`file`** (nota reimbursement), max **10 MB**, mime yang diizinkan: `image/jpeg|png|webp`, `application/pdf`.

### 0.6 Enum

| Enum | Nilai |
|---|---|
| `UserRole` | `EMPLOYEE`, `MANAGER`, `DEPARTMENT_HEAD`, `HRD`, `FINANCE`, `TRAVEL_ADMIN`, `ADMIN`, `SUPER_ADMIN` |
| `TravelRequestStatus` | `DRAFT`, `SUBMITTED`, `IN_REVIEW`, `APPROVED`, `REJECTED`, `CANCELLED`, `COMPLETED` |
| `ApprovalStatus` | `PENDING`, `APPROVED`, `REJECTED` |
| `BookingType` | `TRANSPORT`, `HOTEL`, `OTHER` |
| `BookingStatus` | `PENDING`, `CONFIRMED`, `CANCELLED` |
| `ReimbursementStatus` | `DRAFT`, `SUBMITTED`, `IN_REVIEW`, `APPROVED`, `REJECTED`, `PAID` |
| `ReimbursementCategory` | `TRANSPORT`, `HOTEL`, `MEAL`, `ALLOWANCE`, `OTHER` |
| `DestinationTier` | `DOMESTIC`, `INTERNATIONAL` |
| `NotificationType` | `TRAVEL_SUBMITTED`, `APPROVAL_REQUIRED`, `TRAVEL_APPROVED`, `TRAVEL_REJECTED`, `REIMBURSEMENT_SUBMITTED`, `REIMBURSEMENT_APPROVED`, `REIMBURSEMENT_REJECTED`, `SYSTEM` |

---

## 1. Auth — `/api/auth`

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| POST | `/register` | Public | Registrasi user baru (role default `EMPLOYEE`) |
| POST | `/login` | Public | Login, dapat JWT token |
| GET | `/me` | Semua role | Data profil user yang login |

**POST /api/auth/register** → `201`
```json
// Request
{
  "name": "Azka",
  "email": "azka@andrea.co.id",
  "password": "min8char",
  "departmentId": 1,
  "positionId": 2
}
// Response
{
  "success": true,
  "data": {
    "user": {
      "id": 1, "name": "Azka", "email": "azka@andrea.co.id",
      "role": "EMPLOYEE", "isActive": true,
      "departmentId": 1, "positionId": 2, "externalEmployeeId": null
    },
    "token": "eyJhbGci..."
  }
}
```
Validasi: `name` 2–150 char, `email` valid & unik (409 kalau sudah ada), `password` 8–100 char,
`departmentId`/`positionId` opsional tapi harus exist di DB (400 kalau tidak).

**POST /api/auth/login** → `200`
```json
{ "email": "azka@andrea.co.id", "password": "min8char" }
```
Response sama seperti register. Akun `isActive: false` → `403 "Akun telah dinonaktifkan"`.

**GET /api/auth/me** → `200`
```json
{ "success": true, "data": { "id": 1, "name": "Azka", "email": "...", "role": "EMPLOYEE", "isActive": true, "departmentId": 1, "positionId": 2 } }
```

---

## 2. User & Master Data — `/api/users`

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/` | `SUPER_ADMIN`, `ADMIN` | List semua user (filter: `search`, `role`, `departmentId`) |
| GET | `/:id` | `SUPER_ADMIN`, `ADMIN` | Detail user |
| PUT | `/:id` | `SUPER_ADMIN` | Update data user (nama, departemen, jabatan) |
| PATCH | `/:id/role` | `SUPER_ADMIN` | Assign/ubah role user |
| DELETE | `/:id` | `SUPER_ADMIN` | Nonaktifkan user (soft delete → `isActive: false`) |
| GET | `/departments` | Semua role login | List departemen |
| POST | `/departments` | `SUPER_ADMIN` | Tambah departemen |
| PUT | `/departments/:id` | `SUPER_ADMIN` | Edit departemen |
| DELETE | `/departments/:id` | `SUPER_ADMIN` | Hapus departemen |
| GET | `/positions` | Semua role login | List jabatan |
| POST | `/positions` | `SUPER_ADMIN` | Tambah jabatan |
| PUT | `/positions/:id` | `SUPER_ADMIN` | Edit jabatan |
| DELETE | `/positions/:id` | `SUPER_ADMIN` | Hapus jabatan |

> Catatan routing: `/departments` & `/positions` didaftarkan **sebelum** `/:id` supaya tidak tertangkap
> sebagai param `id`.

**GET /api/users**
```json
// Query
{ "page": 1, "limit": 10, "search": "azka", "role": "EMPLOYEE", "departmentId": 1 }
// Response
{ "success": true, "data": { "data": [ { "id": 1, "name": "Azka", "email": "...", "role": "EMPLOYEE", "isActive": true, "department": { "id": 1, "name": "IT" }, "position": { "id": 2, "name": "Staf" } } ], "pagination": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 } } }
```

**PUT /api/users/:id**
```json
{ "name": "Azka R.", "departmentId": 3, "positionId": 4 }
```

**PATCH /api/users/:id/role**
```json
{ "role": "MANAGER" }
```

**DELETE /api/users/:id** → `200`, user di-nonaktifkan (bukan dihapus fisik).
Kalau punya data terkait (travel/approval aktif) Prisma P2003 dipetakan menjadi `400`.

**POST/PUT /api/users/departments** dan **positions** — body sama: `{ "name": "IT" }` (2–150 char).

---

## 3. Travel Request — `/api/travel`

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| POST | `/` | `EMPLOYEE` | Buat pengajuan (status: `DRAFT`) |
| GET | `/` | Semua role login | List pengajuan (scope berbeda per role, lihat di bawah) |
| GET | `/:id` | Pemilik, Approver terkait, `ADMIN`/`TRAVEL_ADMIN`/`SUPER_ADMIN` | Detail pengajuan + approvals + documents + bookings |
| PATCH | `/:id` | Pemilik, status `DRAFT` | Edit pengajuan |
| DELETE | `/:id` | Pemilik, status `DRAFT` | Hapus draft (hard delete) |
| POST | `/:id/submit` | Pemilik | Submit: `DRAFT` → `SUBMITTED`, generate baris Approval per level |
| POST | `/:id/cancel` | Pemilik | Batalkan pengajuan (`SUBMITTED`/`IN_REVIEW` → `CANCELLED`) |
| POST | `/:id/documents` | Pemilik | Upload dokumen pendukung (multipart) |
| GET | `/:id/documents` | Pemilik, Approver, Admin | List dokumen |
| DELETE | `/documents/:docId` | Pemilik | Hapus dokumen (+ hapus file fisik) |

**Scope `GET /api/travel`**
- `EMPLOYEE` → hanya miliknya sendiri.
- `MANAGER` / `DEPARTMENT_HEAD` / `HRD` → miliknya **atau** travel yang ada approval-nya.
- `SUPER_ADMIN` / `ADMIN` / `TRAVEL_ADMIN` → semua.

**POST /api/travel** → `201`
```json
{
  "destination": "Surabaya",
  "purpose": "Kunjungan klien & training tim sales",
  "startDate": "2026-10-01",
  "endDate": "2026-10-03",
  "estimatedCost": 4500000,
  "policyId": 2
}
```
Validasi: semua field wajib; `endDate >= startDate`; `estimatedCost > 0`; `policyId` harus exist (400 kalau tidak).
Response = objek travel lengkap dengan `approvals: []`, `documents: []`, `bookings: []`, `user`, `policy`.

**POST /api/travel/:id/submit**
Generate approval per level dari `APPROVAL_LEVEL_ROLES` (`approval.constants.ts`):

| Level | Role approver |
|---|---|
| 1 | `MANAGER` |
| 2 | `DEPARTMENT_HEAD` |
| 3 | `HRD` |

Untuk tiap level, service cari user aktif dengan role tsb (mencoba selain pemohon dulu, fallback ke pemohon);
level tanpa kandidat dilewati. Setelah submit, tiap approver dapat notifikasi `APPROVAL_REQUIRED`.

**POST /api/travel/:id/documents** — `multipart/form-data`, field `file`
```json
{ "success": true, "data": { "id": 7, "travelId": 3, "fileName": "surabaya.pdf", "filePath": "1712345-98765.pdf", "fileType": "application/pdf", "uploadedAt": "..." } }
```
Batas 10 MB. MIME di luar daftar → `400 "Tipe file tidak didukung"`.

### 3.1 Booking (sub-resource travel) — `/api/travel/...`

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/api/travel/:travelId/bookings` | Pemilik, `TRAVEL_ADMIN`, `ADMIN` | List booking untuk 1 travel request |
| POST | `/api/travel/:travelId/bookings` | `TRAVEL_ADMIN`, `ADMIN` | Buat booking (travel harus `APPROVED`) |
| PATCH | `/api/travel/bookings/:id/status` | `TRAVEL_ADMIN`, `ADMIN` | Update status booking |
| GET | `/api/travel/bookings/pending` | `TRAVEL_ADMIN`, `ADMIN` | Dashboard: travel `APPROVED` yang belum ada booking |

**POST /api/travel/:travelId/bookings** → `201`
```json
{
  "type": "HOTEL",
  "provider": "Aston Hotel",
  "bookingCode": "AST-12345",
  "description": "2 malam, include breakfast",
  "bookingDate": "2026-09-20",
  "amount": 1200000
}
```
`type`: `TRANSPORT|HOTEL|OTHER`; `amount >= 0`; `provider`/`bookingCode`/`description` opsional.

**PATCH /api/travel/bookings/:id/status**
```json
{ "status": "CONFIRMED" }   // PENDING | CONFIRMED | CANCELLED
```

### 3.2 Travel Policy — `/api/travel/policies`

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/api/travel/policies` | Semua role login | List semua kebijakan |
| GET | `/api/travel/policies/applicable` | Semua role login | Cari policy yang berlaku (query: `positionId`, `destinationTier`) |
| POST | `/api/travel/policies` | `SUPER_ADMIN` | Tambah kebijakan baru |
| PUT | `/api/travel/policies/:id` | `SUPER_ADMIN` | Edit kebijakan |
| DELETE | `/api/travel/policies/:id` | `SUPER_ADMIN` | Hapus kebijakan |

**POST /api/travel/policies** → `201`
```json
{
  "name": "Policy Jabatan Manager - Domestik",
  "positionId": 2,
  "destinationTier": "DOMESTIC",
  "hotelLimit": 1500000,
  "transportLimit": 2500000,
  "allowanceLimit": 750000
}
```
`positionId` boleh `null` → policy general untuk semua jabatan. Semua limit wajib & `>= 0`.

**GET /api/travel/policies/applicable?positionId=2&destinationTier=DOMESTIC**
Kedua query wajib. Dipakai form pengajuan untuk auto-fill `policyId`.

---

## 4. Approval — `/api/approvals`

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/pending` | `MANAGER`, `DEPARTMENT_HEAD`, `HRD` | Approval `PENDING` milik user login atau delegasi aktif |
| GET | `/travel/:travelId` | Pemilik, Approver, Admin | Timeline semua level approval untuk 1 travel request |
| PATCH | `/:id/decision` | Approver terkait / delegate aktif | Setujui/tolak 1 level approval |
| POST | `/delegations` | `MANAGER`, `DEPARTMENT_HEAD`, `HRD` | Buat delegasi wewenang ke user lain |
| GET | `/delegations` | `MANAGER`, `DEPARTMENT_HEAD`, `HRD` | List delegasi (diberikan & diterima) |
| DELETE | `/delegations/:id` | Pemilik delegasi | Batalkan delegasi (hanya sebelum tanggal mulai) |

**PATCH /api/approvals/:id/decision**
```json
{ "status": "APPROVED", "note": "Sesuai budget, disetujui" }
```
Efek samping:
- `REJECTED` → travel jadi `REJECTED`, approval lain tetap, notifikasi `TRAVEL_REJECTED` ke pemohon.
- `APPROVED` → jika tidak ada approval `PENDING` lagi, travel jadi `APPROVED` + notifikasi `TRAVEL_APPROVED`;
  jika masih ada, travel jadi `IN_REVIEW` + notifikasi `APPROVAL_REQUIRED` ke approver level berikutnya.

Ditolak `400` kalau travel sudah final (`APPROVED/REJECTED/CANCELLED`) atau approval sudah diputuskan.

**POST /api/approvals/delegations** → `201`
```json
{ "delegateId": 5, "startDate": "2026-10-05", "endDate": "2026-10-10", "reason": "Cuti tahunan" }
```
Validasi: `endDate >= startDate`; delegate harus exist & aktif; tidak boleh ke diri sendiri;
tidak boleh overlap dengan delegasi aktif lain milik si delegator (400).

**DELETE /api/approvals/delegations/:id** → `400` kalau `startDate <= today` (sudah aktif).

---

## 5. Reimbursement — `/api/reimbursements`

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| POST | `/` | Pemilik travel (status `COMPLETED`) | Mulai laporan reimbursement (buat header) |
| GET | `/` | Pemilik: milik sendiri; `FINANCE`/`SUPER_ADMIN`: semua | List reimbursement (filter `status`) |
| GET | `/:id` | Pemilik, `FINANCE`, `SUPER_ADMIN` | Detail + item-item |
| POST | `/:id/items` | Pemilik, status `DRAFT` | Tambah item pengeluaran (total di-recalculate) |
| DELETE | `/items/:itemId` | Pemilik, status `DRAFT` | Hapus item (total di-recalculate) |
| POST | `/:id/submit` | Pemilik, status `DRAFT` | Submit: `DRAFT` → `SUBMITTED` |
| PATCH | `/:id/verify` | `FINANCE`, `SUPER_ADMIN` | Verifikasi: isi `approvedAmount`, hitung `differenceAmount`, set `APPROVED`/`REJECTED` |
| PATCH | `/:id/pay` | `FINANCE`, `SUPER_ADMIN` | Tandai `PAID` + isi `externalJournalRef` |

**POST /api/reimbursements** → `201`
```json
{ "travelId": 3, "advanceAmount": 1000000 }
```
`travelId` unik (1 reimbursement per travel → `409` kalau duplikat);
travel harus milik pemohon dan berstatus `COMPLETED` (400 kalau belum).

**POST /api/reimbursements/:id/items** → `201`
```json
{
  "category": "HOTEL",
  "description": "Hotel Aston Surabaya 2 malam",
  "amount": 1200000,
  "transactionDate": "2026-10-02",
  "receiptPath": "1712345-98765.jpg"
}
```
`category`: `TRANSPORT|HOTEL|MEAL|ALLOWANCE|OTHER`. `receiptPath` = `fileName` hasil upload
(bukan path absolut) dan opsional. Response mengembalikan header reimbursement dengan `totalAmount` terbaru.

**POST /api/reimbursements/:id/submit** — butuh minimal 1 item (`totalAmount > 0`), kalau tidak `400`.

**PATCH /api/reimbursements/:id/verify**
```json
{ "approvedAmount": 4200000, "status": "APPROVED" }
```
Hanya untuk status `SUBMITTED` / `IN_REVIEW`. Server menghitung:
```
differenceAmount = approvedAmount - advanceAmount
```
dan mengisi `approvedAt`.

**PATCH /api/reimbursements/:id/pay**
```json
{ "externalJournalRef": "BKM-2026-10-001" }
```
Hanya untuk status `APPROVED` (400 kalau belum).

> Catatan: `note` tidak ada di schema `verifyReimbursementSchema` — kalau butuh catatan verifikasi,
> tambahkan field `note: z.string().max(1000).optional()` (model DB juga belum punya kolomnya).

---

## 6. Notification — `/api/notifications`

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/` | Semua role login | List notifikasi milik sendiri (filter `isRead`) |
| PATCH | `/:id/read` | Pemilik notifikasi | Tandai 1 notifikasi sudah dibaca |
| PATCH | `/read-all` | Pemilik notifikasi | Tandai semua sudah dibaca |
| GET | `/unread-count` | Semua role login | Jumlah notifikasi belum dibaca (badge UI) |

```json
// GET /api/notifications?page=1&limit=20&isRead=false
{ "success": true, "data": { "data": [ { "id": 9, "title": "Pengajuan disetujui", "message": "Pengajuan travel disetujui: Surabaya", "type": "TRAVEL_APPROVED", "isRead": false, "createdAt": "..." } ], "pagination": { ... } } }

// GET /api/notifications/unread-count
{ "success": true, "data": { "count": 3 } }

// PATCH /api/notifications/read-all
{ "success": true, "data": { "count": 3 } }
```

Tidak ada endpoint POST publik — notifikasi dibuat dari service lain:

| Event | Type | Penerima |
|---|---|---|
| Travel disubmit | `APPROVAL_REQUIRED` | tiap approver yang dipilih |
| Travel disetujui (level terakhir) | `TRAVEL_APPROVED` | pemohon |
| Travel ditolak | `TRAVEL_REJECTED` | pemohon |
| Masih ada level berikutnya | `IN_REVIEW` → `APPROVAL_REQUIRED` | approver level berikutnya |
| Reimbursement submit/verify | `REIMBURSEMENT_SUBMITTED` / `_APPROVED` / `_REJECTED` | **belum diimplementasikan** (TODO di `reimbursement.service.ts:68`) |

---

## 7. Reporting — `/api/reports`

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/dashboard` | `ADMIN`, `SUPER_ADMIN` | Ringkasan jumlah travel per status + upcoming/ongoing/completed |
| GET | `/expense-by-department` | `FINANCE`, `ADMIN` | Total pengeluaran per departemen (query `from`, `to`) |
| GET | `/expense-by-employee` | `FINANCE`, `ADMIN` | Total pengeluaran per karyawan (query `from`, `to`) |
| GET | `/expense-by-project` | `FINANCE`, `ADMIN` | Total pengeluaran per `purpose` (query `from`, `to`) |
| GET | `/export?format=pdf\|excel` | `FINANCE`, `ADMIN` | Export laporan (implementasi sekarang: CSV) |

Semua report menghitung `estimatedCost` dari travel berstatus `APPROVED` / `COMPLETED` dan memfilter
`endDate` antara `from`–`to`.

**GET /api/reports/dashboard**
```json
{
  "success": true,
  "data": {
    "total": 87,
    "byStatus": { "DRAFT": 4, "SUBMITTED": 2, "IN_REVIEW": 1, "APPROVED": 30, "REJECTED": 5, "CANCELLED": 3, "COMPLETED": 42 },
    "upcoming": 12,
    "ongoing": 3,
    "completed": 42,
    "totalEstimatedCost": 312500000
  }
}
```

**GET /api/reports/expense-by-department?from=2026-01-01&to=2026-12-31**
```json
{ "success": true, "data": [ { "departmentId": 1, "department": "IT", "total": 12500000 } ] }
```

**GET /api/reports/expense-by-employee** → `[{ "userId": 1, "name": "Azka", "email": "...", "total": 4500000 }]`
**GET /api/reports/expense-by-project** → `[{ "purpose": "Kunjungan klien", "total": 9800000 }]`

**GET /api/reports/export**
`format` diterima (`pdf`|`excel`, default `excel`) tapi implementasi sekarang **selalu mengembalikan CSV**
dengan `Content-Type: text/csv` dan `Content-Disposition: attachment; filename="report.csv"`, isinya
agregasi per departemen (`Departemen,Total`). Tidak ada dependency pdf/excel di `package.json`.

---

## 8. Ringkasan Role & Akses

| Role | Akses utama |
|---|---|
| `EMPLOYEE` | Buat/lihat/edit pengajuan sendiri, submit reimbursement sendiri |
| `MANAGER` / `DEPARTMENT_HEAD` / `HRD` | Approve/reject di levelnya, kelola delegasi |
| `FINANCE` | Verifikasi & bayar reimbursement, lihat laporan keuangan |
| `TRAVEL_ADMIN` | Booking travel + dashboard travel yang perlu dibooking |
| `ADMIN` | Semua travel, dashboard operasional, laporan keuangan |
| `SUPER_ADMIN` | Semua master data (user, department, position, policy) + semua akses di atas |

Endpoint tanpa `requireRole` (hanya butuh token): `GET /auth/me`, list `departments`/`positions`,
list & detail travel (scope dicek di service), `GET /travel/policies*`, semua `GET /notifications*`,
`GET /approvals/travel/:travelId`, `GET /travel/:travelId/bookings`.

### 8.1 Alur status utama

```
TravelRequest:  DRAFT ──submit──▶ SUBMITTED ──level 1 approved──▶ IN_REVIEW ──...──▶ APPROVED
                    │                  │                                              │
                    │                  └──reject──▶ REJECTED                          ├──▶ COMPLETED (setelah perjalanan)
                    ├──edit/delete (hanya DRAFT)                                      └──▶ Reimbursement (DRAFT→SUBMITTED→APPROVED/REJECTED→PAID)
                    └──cancel──▶ CANCELLED
Reimbursement:   DRAFT ──submit──▶ SUBMITTED ──verify──▶ APPROVED ──pay──▶ PAID
                                                 └──────▶ REJECTED
```

---

## 9. Status Implementasi & Pekerjaan yang Terbawa

Sudah ada & sesuai spec: auth, users/master data, travel (+ document, policy, booking), approval (+ delegasi),
notification, reporting.

Yang belum / perlu dikerjakan:

1. **Entry point kosong** — `src/app.ts` dan `src/server.ts` masih 0 byte. Belum ada router mounting
   (`/api/auth`, `/api/users`, `/api/travel`, `/api/approvals`, `/api/reimbursements`, `/api/notifications`,
   `/api/reports`), belum ada `cors`/`helmet`/`express.json()`, dan `errorMiddleware` belum terpasang
   (kalau tidak, `AppError` akan jadi 500 default Express). `package.json` juga belum punya script `dev`/`build`.
2. **`reimbursement.routes.ts` kosong** — controller/schema/service/repository sudah ada, tinggal daftarkan
   endpoint seperti tabel di section 5. Perlu `requireRole(['FINANCE','SUPER_ADMIN'])` untuk `verify` & `pay`
   (service sudah melakukan cek role, tapi bukan cek role untuk `verify`/`pay` — jadi andalkan middleware).
3. **Audit Log belum ada** — model `AuditLog` sudah ada di Prisma tapi tidak ada modul/service pencatatnya.
   Kalau mau dipakai: `GET /api/audit-logs?entityType=&entityId=&action=&from=&to=&page=&limit=` (Super Admin).
4. **Upload nota reimbursement** — `ReimbursementItem.receiptPath` hanya diisi lewat body (`receiptPath`),
   belum ada endpoint multipart untuk item (`POST /api/reimbursements/:id/items/receipt`/upload `file`).
   `utils/upload.ts` sudah siap & dipakai travel document, tinggal dipakai ulang.
5. **Export reporting** — hanya CSV; `format=pdf|excel` belum diimplementasikan (butuh `exceljs`/`pdfkit`).
6. **Notifikasi reimbursement** — belum dikirim (TODO di `reimbursement.service.ts:68`), dan `REIMBURSEMENT_*`
   sudah ada di enum `NotificationType`.
7. **Field `note` untuk verifikasi reimbursement** belum ada di schema & model.
8. **Seluruh travel harus di-`COMPLETED`** secara manual — belum ada endpoint/automation (mis. Based on
   `endDate` lewat atau oleh `TRAVEL_ADMIN`).
9. **Tidak ada tests** dan belum ada dokumentasi OpenAPI/Swagger — kalau perlu, bisa di-generate dari zod schema.
10. **Tidak ada pagination** pada `GET /approvals/travel/:travelId`, `GET /travel/policies`, dan seluruh
    reporting (agregat).

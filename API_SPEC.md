# API Specification — Corporate Travel Management System (PT Andrea)

Base URL: `/api`
Semua endpoint (kecuali `register` & `login`) butuh header:
```
Authorization: Bearer <token>
```
Response format standar:
```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "..." }
```

---

## 1. Auth — `/api/auth`

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| POST | `/register` | Public | Registrasi user baru |
| POST | `/login` | Public | Login, dapat JWT token |
| GET | `/me` | Semua role | Data profil user yang login |

**POST /api/auth/register**
```json
// Request
{ "name": "Azka", "email": "azka@andrea.co.id", "password": "min8char", "departmentId": 1, "positionId": 2 }
// Response 201
{ "success": true, "data": { "user": { "id": 1, "name": "Azka", "email": "...", "role": "EMPLOYEE" }, "token": "..." } }
```

**POST /api/auth/login**
```json
// Request
{ "email": "azka@andrea.co.id", "password": "min8char" }
// Response 200 -> sama shape dengan register
```

---

## 2. User & Master Data — `/api/users`

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/` | Admin, Super Admin | List semua user (filter: role, departmentId) |
| GET | `/:id` | Admin, Super Admin | Detail user |
| PUT | `/:id` | Super Admin | Update data user (nama, departemen, jabatan) |
| PATCH | `/:id/role` | Super Admin | Assign/ubah role user |
| DELETE | `/:id` | Super Admin | Nonaktifkan user |
| GET | `/departments` | Semua role login | List departemen |
| POST | `/departments` | Super Admin | Tambah departemen |
| PUT | `/departments/:id` | Super Admin | Edit departemen |
| DELETE | `/departments/:id` | Super Admin | Hapus departemen |
| GET | `/positions` | Semua role login | List jabatan |
| POST | `/positions` | Super Admin | Tambah jabatan |
| PUT | `/positions/:id` | Super Admin | Edit jabatan |
| DELETE | `/positions/:id` | Super Admin | Hapus jabatan |

**PATCH /api/users/:id/role**
```json
{ "role": "MANAGER" }
```

---

## 3. Travel Request — `/api/travel`

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| POST | `/` | Employee | Buat pengajuan (status: DRAFT) |
| GET | `/` | Semua role login | List pengajuan (Employee: milik sendiri; Admin/Approver: semua/filtered) |
| GET | `/:id` | Pemilik, Approver terkait, Admin | Detail pengajuan + timeline approval |
| PATCH | `/:id` | Employee (pemilik, status masih DRAFT) | Edit pengajuan |
| DELETE | `/:id` | Employee (pemilik, status masih DRAFT) | Hapus draft |
| POST | `/:id/submit` | Employee (pemilik) | Submit: DRAFT → SUBMITTED, generate baris Approval per level |
| POST | `/:id/cancel` | Employee (pemilik) | Batalkan pengajuan (status → CANCELLED) |
| POST | `/:id/documents` | Employee (pemilik) | Upload dokumen pendukung (multipart) |
| GET | `/:id/documents` | Pemilik, Approver, Admin | List dokumen |
| DELETE | `/documents/:docId` | Employee (pemilik) | Hapus dokumen |

**POST /api/travel**
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

### Booking (sub-resource travel) — `/api/travel/:travelId/bookings`

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/api/travel/:travelId/bookings` | Pemilik, Admin Travel | List booking untuk 1 travel request |
| POST | `/api/travel/:travelId/bookings` | Admin Travel | Buat booking (travel harus status APPROVED) |
| PATCH | `/api/travel/bookings/:id/status` | Admin Travel | Update status booking (PENDING/CONFIRMED/CANCELLED) |
| GET | `/api/travel/bookings/pending` | Admin Travel | Dashboard: travel APPROVED yang belum ada booking |

### Travel Policy — `/api/travel/policies`

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/api/travel/policies` | Semua role login | List semua kebijakan |
| GET | `/api/travel/policies/applicable` | Employee | Cari policy yang berlaku (query: `positionId`, `destinationTier`) — dipakai saat isi form pengajuan |
| POST | `/api/travel/policies` | Super Admin | Tambah kebijakan baru |
| PUT | `/api/travel/policies/:id` | Super Admin | Edit kebijakan |
| DELETE | `/api/travel/policies/:id` | Super Admin | Hapus kebijakan |

---

## 4. Approval — `/api/approvals`

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/pending` | Manager, Dept Head, HRD | List approval yang menunggu keputusan user login (termasuk yang didelegasikan ke dia) |
| GET | `/travel/:travelId` | Pemilik, Approver, Admin | Timeline semua level approval untuk 1 travel request |
| PATCH | `/:id/decision` | Approver terkait / delegate aktif | Setujui/tolak 1 level approval |
| POST | `/delegations` | Manager, Dept Head, HRD | Buat delegasi wewenang ke user lain |
| GET | `/delegations` | Manager, Dept Head, HRD | List delegasi (diberikan & diterima) |
| DELETE | `/delegations/:id` | Pemilik delegasi | Batalkan delegasi sebelum aktif |

**PATCH /api/approvals/:id/decision**
```json
{ "status": "APPROVED", "note": "Sesuai budget, disetujui" }
```

**POST /api/approvals/delegations**
```json
{ "delegateId": 5, "startDate": "2026-10-05", "endDate": "2026-10-10", "reason": "Cuti tahunan" }
```

---

## 5. Reimbursement — `/api/reimbursements`

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| POST | `/` | Employee (pemilik travel, status COMPLETED) | Mulai laporan reimbursement (buat header) |
| GET | `/` | Employee: milik sendiri; Finance: semua (filter status) | List reimbursement |
| GET | `/:id` | Pemilik, Finance | Detail + item-item |
| POST | `/:id/items` | Employee (pemilik, status masih DRAFT) | Tambah item pengeluaran (+ upload nota) |
| DELETE | `/items/:itemId` | Employee (pemilik) | Hapus item |
| POST | `/:id/submit` | Employee (pemilik) | Submit: DRAFT → SUBMITTED |
| PATCH | `/:id/verify` | Finance | Verifikasi: isi `approvedAmount`, hitung `differenceAmount`, set APPROVED/REJECTED |
| PATCH | `/:id/pay` | Finance | Tandai PAID + isi `externalJournalRef` |

**POST /api/reimbursements/:id/items**
```json
{
  "category": "HOTEL",
  "description": "Hotel Aston Surabaya 2 malam",
  "amount": 1200000,
  "transactionDate": "2026-10-02",
  "receiptPath": "uploads/receipts/xxx.jpg"
}
```

**PATCH /api/reimbursements/:id/verify**
```json
{ "approvedAmount": 4200000, "status": "APPROVED", "note": "Sesuai, 1 nota makan ditolak karena melebihi limit" }
// Server hitung: differenceAmount = approvedAmount - advanceAmount
```

---

## 6. Notification — `/api/notifications`

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/` | Semua role login | List notifikasi milik sendiri (filter: `isRead`) |
| PATCH | `/:id/read` | Pemilik notifikasi | Tandai 1 notifikasi sudah dibaca |
| PATCH | `/read-all` | Pemilik notifikasi | Tandai semua sudah dibaca |
| GET | `/unread-count` | Semua role login | Jumlah notifikasi belum dibaca (buat badge di UI) |

*Catatan: notifikasi dibuat otomatis dari service lain (approval, reimbursement) — tidak ada endpoint POST publik untuk membuat notifikasi dari luar.*

---

## 7. Reporting — `/api/reports`

| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/dashboard` | Admin, Super Admin | Ringkasan: jumlah travel per status (ongoing/upcoming/completed) |
| GET | `/expense-by-department` | Finance, Admin | Total pengeluaran per departemen (filter periode) |
| GET | `/expense-by-employee` | Finance, Admin | Total pengeluaran per karyawan (filter periode) |
| GET | `/expense-by-project` | Finance, Admin | Total pengeluaran per project/purpose (kalau ada tagging project) |
| GET | `/export?format=pdf\|excel` | Finance, Admin | Export laporan ke file |

---

## 8. Ringkasan Role & Akses

| Role | Akses utama |
|---|---|
| EMPLOYEE | Buat/lihat pengajuan sendiri, submit reimbursement sendiri |
| MANAGER / DEPARTMENT_HEAD / HRD | Approve/reject di levelnya, kelola delegasi |
| FINANCE | Verifikasi & bayar reimbursement, lihat laporan keuangan |
| ADMIN | Booking travel, dashboard operasional |
| SUPER_ADMIN | Semua master data (user, department, position, policy), lihat semua data |

---

## 9. Belum Tercakup / Perlu Diputuskan

- **Audit Log** — kalau mau dipakai (rekomendasi sebelumnya), butuh endpoint `GET /api/audit-logs` (Super Admin only) — belum ada di struktur folder terbaru kamu, cek apakah memang di-drop atau memang belum dibuatkan modulnya.
- **File upload endpoint generik** — dokumen pendukung & foto nota sama-sama butuh handler upload (multipart/form-data). Pastikan ada 1 utilitas upload yang dipakai bersama (`utils/upload.ts`) daripada ditulis ulang di setiap modul.
- **Booking** tidak punya folder modul sendiri di tree terbaru — di spec ini saya letakkan sebagai sub-resource dari `travel`. Kalau ternyata mau dipisah jadi modul sendiri, tinggal pindahkan endpoint-nya.

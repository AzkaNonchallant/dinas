# Bruno Collection — Dinas Travel API

Koleksi untuk ngobrak semua endpoint sesuai `API_SPEC.md`.

## Cara pakai
1. Install Bruno (VS Code extension atau desktop app), lalu **Open Collection** → pilih folder `bruno/`.
2. Pilih environment **Local** (kiri atas).
3. Run berurutan dari folder `00-auth` → `07-reports`.

## Environment
Semua variabel ada di `environments/Local.bru` dan ada yang otomatis keisi sendiri oleh script
(`token`, `userId`, `travelId`, `approvalId`, `policyId`, `departmentId`, `positionId`, `bookingId`, `docId`, `reimbursementId`, `itemId`, `notificationId`).

`baseUrl` default `http://localhost:3000`.

## Catatan penting sebelum run
- **`src/app.ts` dan `src/server.ts` masih kosong** — router belum di-mount, jadi semua request akan
  404 / connection refused. Collection ini sudah siap, tinggal backend-nya yang perlu di-wire
  (`/api/auth`, `/api/users`, `/api/travel`, `/api/approvals`, `/api/reimbursements`, `/api/notifications`, `/api/reports`).
- **`reimbursement.routes.ts` kosong** — folder `05-reimbursements` akan 404 sampai routes reimbursement didaftarkan.
- Login pertama butuh data master: minimal 1 user `SUPER_ADMIN` (untuk master data & policy),
  1 user `MANAGER`, 1 `DEPARTMENT_HEAD`, 1 `HRD` (untuk approval flow), 1 `FINANCE`, 1 `TRAVEL_ADMIN`,
  serta minimal 1 `Department`, `Position`, dan `TravelPolicy`.
- Sample file upload ada di `files/contoh-nota.pdf`.

## Skenario end-to-end
1. `00-auth/01-register` atau `02-login` → token tersimpan.
2. `03-booking-policy/05-list-policies` → `policyId` terisi.
3. `02-travel/01-create-travel` → `travelId` terisi (status DRAFT).
4. `02-travel/05-submit-travel` → `approvalId` level 1 terisi, travel jadi SUBMITTED.
5. Ganti environment `email` ke akun MANAGER → login → `04-approvals/01-pending-approvals` → `03-approve`.
   Ulangi untuk DEPARTMENT_HEAD lalu HRD sampai travel status APPROVED.
6. Ganti ke akun TRAVEL_ADMIN/ADMIN → `03-booking-policy/01-bookings-pending` → `03-create-booking` → `04-update-booking-status`.
7. Reimbursement butuh travel status `COMPLETED` (belum ada endpoint untuk itu — ubah manual di DB/studio Prisma),
   lalu `05-reimbursements/01-create` → `04-add-item` → `06-submit`; ganti ke FINANCE untuk `07-verify-approve` → `09-pay`.
8. Cek `06-notifications/*` di akun approver & pemohon.
9. `07-reports/*` memakai akun FINANCE/ADMIN/SUPER_ADMIN.

import 'dotenv/config';
import {
  ApprovalStatus,
  BookingStatus,
  BookingType,
  DestinationTier,
  NotificationType,
  Prisma,
  PrismaClient,
  ReimbursementCategory,
  ReimbursementStatus,
  TravelRequestStatus,
  UserRole,
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = 'Password123!';
const shouldReset = process.argv.slice(2).includes('--reset');

let passwordCache: string | null = null;

function defaultPasswordHash() {
  passwordCache ??= bcrypt.hashSync(DEFAULT_PASSWORD, SALT_ROUNDS);
  return passwordCache;
}

function date(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

async function resetDatabase() {
  console.log('⚠️  --reset aktif: mengosongkan seluruh tabel...');
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.reimbursementItem.deleteMany(),
    prisma.reimbursement.deleteMany(),
    prisma.booking.deleteMany(),
    prisma.travelDocument.deleteMany(),
    prisma.approval.deleteMany(),
    prisma.approvalDelegation.deleteMany(),
    prisma.travelRequest.deleteMany(),
    prisma.travelPolicy.deleteMany(),
    prisma.user.deleteMany(),
    prisma.department.deleteMany(),
    prisma.position.deleteMany(),
  ]);
}

async function seedDepartments() {
  const names = [
    'Bagian Sumber Daya Manusia',
    'Bagian Keuangan',
    'Bagian Perencanaan',
    'Bagian Hukum',
    'Tata Usaha',
  ];

  const result = {} as Record<string, { id: number; name: string }>;

  for (const name of names) {
    const existing = await prisma.department.findFirst({ where: { name } });
    result[name] = existing ?? (await prisma.department.create({ data: { name } }));
  }

  return result;
}

async function seedPositions() {
  const names = [
    'Pegawai',
    'Staf',
    'Manajer',
    'Kepala Bagian',
    'Kepala Dinas',
    'Admin Perjalanan Dinas',
  ];

  const result = {} as Record<string, { id: number; name: string }>;

  for (const name of names) {
    const existing = await prisma.position.findFirst({ where: { name } });
    result[name] = existing ?? (await prisma.position.create({ data: { name } }));
  }

  return result;
}

type PolicySeed = {
  name: string;
  positionId: number | null;
  destinationTier: DestinationTier;
  hotelLimit: string;
  transportLimit: string;
  allowanceLimit: string;
};

async function seedTravelPolicies(
  departments: Record<string, { id: number }>,
  positions: Record<string, { id: number }>,
) {
  void departments;

  const seeds: PolicySeed[] = [
    {
      name: 'Standar Pegawai - Domestik',
      positionId: positions['Pegawai']?.id ?? null,
      destinationTier: DestinationTier.DOMESTIC,
      hotelLimit: '750000.00',
      transportLimit: '1000000.00',
      allowanceLimit: '250000.00',
    },
    {
      name: 'Standar Staf - Domestik',
      positionId: positions['Staf']?.id ?? null,
      destinationTier: DestinationTier.DOMESTIC,
      hotelLimit: '1500000.00',
      transportLimit: '2000000.00',
      allowanceLimit: '350000.00',
    },
    {
      name: 'Manajer - Domestik',
      positionId: positions['Manajer']?.id ?? null,
      destinationTier: DestinationTier.DOMESTIC,
      hotelLimit: '2500000.00',
      transportLimit: '3500000.00',
      allowanceLimit: '500000.00',
    },
    {
      name: 'Manajer - Internasional',
      positionId: positions['Manajer']?.id ?? null,
      destinationTier: DestinationTier.INTERNATIONAL,
      hotelLimit: '5000000.00',
      transportLimit: '8000000.00',
      allowanceLimit: '900000.00',
    },
    {
      name: 'Kepala Bagian - Domestik',
      positionId: positions['Kepala Bagian']?.id ?? null,
      destinationTier: DestinationTier.DOMESTIC,
      hotelLimit: '3000000.00',
      transportLimit: '4000000.00',
      allowanceLimit: '600000.00',
    },
    {
      name: 'Kepala Bagian - Internasional',
      positionId: positions['Kepala Bagian']?.id ?? null,
      destinationTier: DestinationTier.INTERNATIONAL,
      hotelLimit: '6000000.00',
      transportLimit: '9000000.00',
      allowanceLimit: '1200000.00',
    },
    {
      name: 'Kepala Dinas - Domestik',
      positionId: positions['Kepala Dinas']?.id ?? null,
      destinationTier: DestinationTier.DOMESTIC,
      hotelLimit: '5000000.00',
      transportLimit: '6000000.00',
      allowanceLimit: '800000.00',
    },
    {
      name: 'Kepala Dinas - Internasional',
      positionId: positions['Kepala Dinas']?.id ?? null,
      destinationTier: DestinationTier.INTERNATIONAL,
      hotelLimit: '10000000.00',
      transportLimit: '15000000.00',
      allowanceLimit: '1800000.00',
    },
    {
      name: 'Admin Perjalanan Dinas - Domestik',
      positionId: positions['Admin Perjalanan Dinas']?.id ?? null,
      destinationTier: DestinationTier.DOMESTIC,
      hotelLimit: '2000000.00',
      transportLimit: '3000000.00',
      allowanceLimit: '400000.00',
    },
  ];

  const result = {} as Record<string, { id: number; name: string }>;

  for (const seed of seeds) {
    const existing = await prisma.travelPolicy.findFirst({ where: { name: seed.name } });
    result[seed.name] =
      existing ?? (await prisma.travelPolicy.create({ data: seed }));
  }

  return result;
}

type UserSeed = {
  name: string;
  email: string;
  role: UserRole;
  departmentId: number | null;
  positionId: number | null;
  isActive?: boolean;
  externalEmployeeId?: string;
};

async function seedUsers(
  departments: Record<string, { id: number }>,
  positions: Record<string, { id: number }>,
) {
  const seeds: UserSeed[] = [
    {
      name: 'Budi Santoso',
      email: 'super.admin@dinas.go.id',
      role: UserRole.SUPER_ADMIN,
      departmentId: null,
      positionId: positions['Kepala Dinas']?.id ?? null,
      externalEmployeeId: 'EMP-0001',
    },
    {
      name: 'Andi Prasetyo',
      email: 'admin@dinas.go.id',
      role: UserRole.ADMIN,
      departmentId: departments['Tata Usaha']?.id ?? null,
      positionId: positions['Kepala Bagian']?.id ?? null,
      externalEmployeeId: 'EMP-0002',
    },
    {
      name: 'Siti Rahayu',
      email: 'hrd@dinas.go.id',
      role: UserRole.HRD,
      departmentId: departments['Bagian Sumber Daya Manusia']?.id ?? null,
      positionId: positions['Kepala Bagian']?.id ?? null,
      externalEmployeeId: 'EMP-0003',
    },
    {
      name: 'Dewi Lestari',
      email: 'finance@dinas.go.id',
      role: UserRole.FINANCE,
      departmentId: departments['Bagian Keuangan']?.id ?? null,
      positionId: positions['Kepala Bagian']?.id ?? null,
      externalEmployeeId: 'EMP-0004',
    },
    {
      name: 'Rudi Hartono',
      email: 'travel.admin@dinas.go.id',
      role: UserRole.TRAVEL_ADMIN,
      departmentId: departments['Tata Usaha']?.id ?? null,
      positionId: positions['Admin Perjalanan Dinas']?.id ?? null,
      externalEmployeeId: 'EMP-0005',
    },
    {
      name: 'Rina Kartika',
      email: 'kepala.bagian@sdm.dinas.go.id',
      role: UserRole.DEPARTMENT_HEAD,
      departmentId: departments['Bagian Sumber Daya Manusia']?.id ?? null,
      positionId: positions['Kepala Bagian']?.id ?? null,
      externalEmployeeId: 'EMP-0006',
    },
    {
      name: 'Agus Setiawan',
      email: 'manajer@sdm.dinas.go.id',
      role: UserRole.MANAGER,
      departmentId: departments['Bagian Sumber Daya Manusia']?.id ?? null,
      positionId: positions['Manajer']?.id ?? null,
      externalEmployeeId: 'EMP-0007',
    },
    {
      name: 'Maya Sari',
      email: 'pegawai@sdm.dinas.go.id',
      role: UserRole.EMPLOYEE,
      departmentId: departments['Bagian Sumber Daya Manusia']?.id ?? null,
      positionId: positions['Staf']?.id ?? null,
      externalEmployeeId: 'EMP-0008',
    },
    {
      name: 'Rudi Susanto',
      email: 'nonaktif@dinas.go.id',
      role: UserRole.EMPLOYEE,
      departmentId: departments['Bagian Perencanaan']?.id ?? null,
      positionId: positions['Pegawai']?.id ?? null,
      isActive: false,
      externalEmployeeId: 'EMP-0009',
    },
  ];

  const result = {} as Record<string, { id: number; email: string }>;

  for (const seed of seeds) {
    result[seed.email] = await prisma.user.upsert({
      where: { email: seed.email },
      update: {},
      create: { ...seed, password: defaultPasswordHash() },
    });
  }

  return result;
}

type TravelSeed = {
  key: string;
  userId: number;
  policyId: number;
  destination: string;
  purpose: string;
  startDate: Date;
  endDate: Date;
  status: TravelRequestStatus;
  estimatedCost: string;
};

async function seedTravelRequests(
  users: Record<string, { id: number }>,
  policies: Record<string, { id: number }>,
) {
  const seeds: TravelSeed[] = [
    {
      key: 'draft',
      userId: users['pegawai@sdm.dinas.go.id']?.id ?? 0,
      policyId: policies['Standar Staf - Domestik']?.id ?? 0,
      destination: 'Bandar Lampung',
      purpose: 'Rapat koordinasi dan verifikasi data pensiunan',
      startDate: date('2026-11-10'),
      endDate: date('2026-11-12'),
      status: TravelRequestStatus.DRAFT,
      estimatedCost: '2750000.00',
    },
    {
      key: 'submitted',
      userId: users['pegawai@sdm.dinas.go.id']?.id ?? 0,
      policyId: policies['Standar Staf - Domestik']?.id ?? 0,
      destination: 'Yogyakarta',
      purpose: 'Pelatihan pengelolaan arsip dinamis',
      startDate: date('2026-11-18'),
      endDate: date('2026-11-21'),
      status: TravelRequestStatus.SUBMITTED,
      estimatedCost: '4200000.00',
    },
    {
      key: 'inReview',
      userId: users['pegawai@sdm.dinas.go.id']?.id ?? 0,
      policyId: policies['Standar Staf - Domestik']?.id ?? 0,
      destination: 'Surabaya',
      purpose: 'Pemeriksaan langsungapkan beneficiaries program bantuan',
      startDate: date('2026-12-01'),
      endDate: date('2026-12-04'),
      status: TravelRequestStatus.IN_REVIEW,
      estimatedCost: '5600000.00',
    },
    {
      key: 'approved',
      userId: users['pegawai@sdm.dinas.go.id']?.id ?? 0,
      policyId: policies['Manajer - Domestik']?.id ?? 0,
      destination: 'Jakarta',
      purpose: 'Penanganan Dialog Nasional Aparatur dosis',
      startDate: date('2026-12-10'),
      endDate: date('2026-12-13'),
      status: TravelRequestStatus.APPROVED,
      estimatedCost: '8300000.00',
    },
    {
      key: 'rejected',
      userId: users['pegawai@sdm.dinas.go.id']?.id ?? 0,
      policyId: policies['Standar Staf - Domestik']?.id ?? 0,
      destination: 'Medan',
      purpose: 'Sosialisasi prosedur procurement',
      startDate: date('2026-11-25'),
      endDate: date('2026-11-26'),
      status: TravelRequestStatus.REJECTED,
      estimatedCost: '3100000.00',
    },
    {
      key: 'completed',
      userId: users['pegawai@sdm.dinas.go.id']?.id ?? 0,
      policyId: policies['Manajer - Domestik']?.id ?? 0,
      destination: 'Denpasar, Bali',
      purpose: 'Bintek dan evaluasi kepatuhan terhadap standar layanan',
      startDate: date('2026-08-10'),
      endDate: date('2026-08-14'),
      status: TravelRequestStatus.COMPLETED,
      estimatedCost: '12750000.00',
    },
  ];

  const result = {} as Record<string, { id: number; destination: string }>;

  for (const seed of seeds) {
    const existing = await prisma.travelRequest.findFirst({
      where: {
        userId: seed.userId,
        destination: seed.destination,
        startDate: seed.startDate,
      },
    });
    result[seed.key] =
      existing ??
      (await prisma.travelRequest.create({
        data: {
          userId: seed.userId,
          policyId: seed.policyId,
          destination: seed.destination,
          purpose: seed.purpose,
          startDate: seed.startDate,
          endDate: seed.endDate,
          status: seed.status,
          estimatedCost: seed.estimatedCost,
        },
      }));
  }

  return result;
}

async function seedApprovals(
  travels: Record<string, { id: number }>,
  users: Record<string, { id: number }>,
) {
  const manajer = users['manajer@sdm.dinas.go.id']?.id ?? 0;
  const kepalaBagian = users['kepala.bagian@sdm.dinas.go.id']?.id ?? 0;
  const kepalaDinas = users['super.admin@dinas.go.id']?.id ?? 0;

  const seeds: {
    travelId: number;
    approverId: number;
    level: number;
    status: ApprovalStatus;
    note: string;
    approvedAt: Date | null;
  }[] = [
    {
      travelId: travels['submitted']?.id ?? 0,
      approverId: manajer,
      level: 1,
      status: ApprovalStatus.PENDING,
      note: 'Menunggu verifikasi biaya transport',
      approvedAt: null,
    },
    {
      travelId: travels['inReview']?.id ?? 0,
      approverId: manajer,
      level: 1,
      status: ApprovalStatus.APPROVED,
      note: 'Anggaran tersedia, disetujui',
      approvedAt: date('2026-10-20'),
    },
    {
      travelId: travels['inReview']?.id ?? 0,
      approverId: kepalaBagian,
      level: 2,
      status: ApprovalStatus.PENDING,
      note: 'Menunggu persetujuan Kepala Bagian',
      approvedAt: null,
    },
    {
      travelId: travels['approved']?.id ?? 0,
      approverId: manajer,
      level: 1,
      status: ApprovalStatus.APPROVED,
      note: 'Disetujui sesuai RKAP',
      approvedAt: date('2026-10-22'),
    },
    {
      travelId: travels['approved']?.id ?? 0,
      approverId: kepalaBagian,
      level: 2,
      status: ApprovalStatus.APPROVED,
      note: 'Disetujui',
      approvedAt: date('2026-10-23'),
    },
    {
      travelId: travels['rejected']?.id ?? 0,
      approverId: manajer,
      level: 1,
      status: ApprovalStatus.REJECTED,
      note: 'Anggaran tidak tersedia, disarankan revise anggaran',
      approvedAt: date('2026-10-24'),
    },
    {
      travelId: travels['completed']?.id ?? 0,
      approverId: manajer,
      level: 1,
      status: ApprovalStatus.APPROVED,
      note: 'Disetujui',
      approvedAt: date('2026-07-28'),
    },
    {
      travelId: travels['completed']?.id ?? 0,
      approverId: kepalaBagian,
      level: 2,
      status: ApprovalStatus.APPROVED,
      note: 'Disetujui',
      approvedAt: date('2026-07-29'),
    },
    {
      travelId: travels['completed']?.id ?? 0,
      approverId: kepalaDinas,
      level: 3,
      status: ApprovalStatus.APPROVED,
      note: 'Disetujui Kepala Dinas',
      approvedAt: date('2026-07-30'),
    },
  ];

  for (const seed of seeds) {
    await prisma.approval.upsert({
      where: { travelId_level: { travelId: seed.travelId, level: seed.level } },
      update: {
        approverId: seed.approverId,
        status: seed.status,
        note: seed.note,
        approvedAt: seed.approvedAt,
      },
      create: seed,
    });
  }
}

async function seedApprovalDelegations(users: Record<string, { id: number }>) {
  const delegator = users['kepala.bagian@sdm.dinas.go.id']?.id ?? 0;
  const delegate = users['manajer@sdm.dinas.go.id']?.id ?? 0;

  const existing = await prisma.approvalDelegation.findFirst({
    where: { delegatorId: delegator, delegateId: delegate },
  });

  if (existing) return;

  await prisma.approvalDelegation.create({
    data: {
      delegatorId: delegator,
      delegateId: delegate,
      startDate: date('2026-10-01'),
      endDate: date('2026-12-31'),
      reason: 'Cuti tahunan Kepala Bagian',
    },
  });
}

async function seedDocuments(travels: Record<string, { id: number }>) {
  const seeds = [
    { travelKey: 'approved', fileName: 'surat-permintaan.pdf', folder: '2026/12' },
    { travelKey: 'completed', fileName: 'nota-dinas.pdf', folder: '2026/08' },
    { travelKey: 'completed', fileName: 'rekap-biaya.xlsx', folder: '2026/08' },
  ];

  for (const seed of seeds) {
    const travelId = travels[seed.travelKey]?.id ?? 0;
    const filePath = `uploads/${seed.folder}/${seed.fileName}`;

    const existing = await prisma.travelDocument.findFirst({
      where: { travelId, fileName: seed.fileName },
    });
    if (existing) continue;

    await prisma.travelDocument.create({
      data: {
        travelId,
        fileName: seed.fileName,
        filePath,
        fileType: seed.fileName.endsWith('.pdf') ? 'application/pdf' : null,
      },
    });
  }
}

async function seedBookings(travels: Record<string, { id: number }>) {
  const seeds: {
    travelKey: string;
    type: BookingType;
    provider: string;
    bookingCode: string;
    description: string;
    bookingDate: string;
    amount: string;
    status: BookingStatus;
  }[] = [
    {
      travelKey: 'approved',
      type: BookingType.TRANSPORT,
      provider: 'PT Air Travel Nusantara',
      bookingCode: 'ATN-88213',
      description: 'Tiket pesawat ekonomi Jakarta - Surabaya - Jakarta',
      bookingDate: '2026-10-25',
      amount: '3200000.00',
      status: BookingStatus.CONFIRMED,
    },
    {
      travelKey: 'approved',
      type: BookingType.HOTEL,
      provider: 'Hotel Grand Harvest Surabaya',
      bookingCode: 'GHS-5521',
      description: 'Kamar superior 3 malam',
      bookingDate: '2026-10-25',
      amount: '3450000.00',
      status: BookingStatus.CONFIRMED,
    },
    {
      travelKey: 'completed',
      type: BookingType.TRANSPORT,
      provider: 'PT Lion Air',
      bookingCode: 'LION-10442',
      description: 'Tiket pesawat ekonomi Jakarta - Denpasar',
      bookingDate: '2026-07-31',
      amount: '4100000.00',
      status: BookingStatus.CONFIRMED,
    },
    {
      travelKey: 'completed',
      type: BookingType.HOTEL,
      provider: 'Hotel Nusa Dua Beach',
      bookingCode: 'NDB-7781',
      description: 'Kamar deluxe 4 malam',
      bookingDate: '2026-07-31',
      amount: '4600000.00',
      status: BookingStatus.CONFIRMED,
    },
    {
      travelKey: 'inReview',
      type: BookingType.TRANSPORT,
      provider: 'PT Garuda Indonesia',
      bookingCode: '',
      description: 'Menunggu persetujuan level 2',
      bookingDate: null,
      amount: '2600000.00',
      status: BookingStatus.PENDING,
    },
  ];

  for (const seed of seeds) {
    const travelId = travels[seed.travelKey]?.id ?? 0;

    const existing = await prisma.booking.findFirst({
      where: { travelId, type: seed.type },
    });
    if (existing) continue;

    await prisma.booking.create({
      data: {
        travelId,
        type: seed.type,
        provider: seed.provider,
        bookingCode: seed.bookingCode === '' ? null : seed.bookingCode,
        description: seed.description,
        bookingDate: seed.bookingDate === null ? null : date(seed.bookingDate),
        amount: seed.amount,
        status: seed.status,
      },
    });
  }
}

async function seedReimbursements(travels: Record<string, { id: number }>) {
  const completed = travels['completed']?.id ?? 0;
  const approved = travels['approved']?.id ?? 0;
  const inReview = travels['inReview']?.id ?? 0;

  const seeds: {
    travelId: number;
    advanceAmount: string;
    totalAmount: string;
    approvedAmount: string | null;
    differenceAmount: string | null;
    status: ReimbursementStatus;
    submittedAt: Date | null;
    approvedAt: Date | null;
    externalJournalRef: string | null;
    items: {
      category: ReimbursementCategory;
      description: string;
      amount: string;
      transactionDate: string;
      receiptPath: string | null;
    }[];
  }[] = [
    {
      travelId: completed,
      advanceAmount: '5000000.00',
      totalAmount: '12400000.00',
      approvedAmount: '11950000.00',
      differenceAmount: '-450000.00',
      status: ReimbursementStatus.PAID,
      submittedAt: date('2026-08-18'),
      approvedAt: date('2026-08-25'),
      externalJournalRef: 'JRN-2026-08-0142',
      items: [
        {
          category: ReimbursementCategory.TRANSPORT,
          description: 'Tiket pesawat ekonomi Jakarta - Denpasar - Jakarta',
          amount: '4100000.00',
          transactionDate: '2026-08-10',
          receiptPath: 'uploads/2026/08/tiket.pdf',
        },
        {
          category: ReimbursementCategory.HOTEL,
          description: 'Hotel Nusa Dua Beach, 4 malam',
          amount: '4600000.00',
          transactionDate: '2026-08-14',
          receiptPath: 'uploads/2026/08/hotel.pdf',
        },
        {
          category: ReimbursementCategory.MEAL,
          description: 'Makan 5 hari',
          amount: '1250000.00',
          transactionDate: '2026-08-14',
          receiptPath: 'uploads/2026/08/makan.pdf',
        },
        {
          category: ReimbursementCategory.ALLOWANCE,
          description: 'Uang saku harian',
          amount: '2450000.00',
          transactionDate: '2026-08-14',
          receiptPath: null,
        },
      ],
    },
    {
      travelId: approved,
      advanceAmount: '0',
      totalAmount: '8300000.00',
      approvedAmount: null,
      differenceAmount: null,
      status: ReimbursementStatus.DRAFT,
      submittedAt: null,
      approvedAt: null,
      externalJournalRef: null,
      items: [
        {
          category: ReimbursementCategory.TRANSPORT,
          description: 'Estimasi tiket pesawat',
          amount: '3200000.00',
          transactionDate: '2026-12-10',
          receiptPath: null,
        },
        {
          category: ReimbursementCategory.HOTEL,
          description: 'Estimasi hotel 3 malam',
          amount: '3450000.00',
          transactionDate: '2026-12-13',
          receiptPath: null,
        },
      ],
    },
    {
      travelId: inReview,
      advanceAmount: '0',
      totalAmount: '5600000.00',
      approvedAmount: null,
      differenceAmount: null,
      status: ReimbursementStatus.SUBMITTED,
      submittedAt: date('2026-09-30'),
      approvedAt: null,
      externalJournalRef: null,
      items: [
        {
          category: ReimbursementCategory.TRANSPORT,
          description: 'Tiket pesawat Surabaya',
          amount: '2600000.00',
          transactionDate: '2026-12-01',
          receiptPath: 'uploads/2026/12/tiket-surabaya.pdf',
        },
        {
          category: ReimbursementCategory.MEAL,
          description: 'Makan 4 hari',
          amount: '1400000.00',
          transactionDate: '2026-12-04',
          receiptPath: null,
        },
        {
          category: ReimbursementCategory.OTHER,
          description: 'Transport lokal',
          amount: '1600000.00',
          transactionDate: '2026-12-04',
          receiptPath: null,
        },
      ],
    },
  ];

  for (const seed of seeds) {
    const reimbursement = await prisma.reimbursement.upsert({
      where: { travelId: seed.travelId },
      update: {},
      create: {
        travelId: seed.travelId,
        advanceAmount: seed.advanceAmount,
        totalAmount: seed.totalAmount,
        approvedAmount: seed.approvedAmount,
        differenceAmount: seed.differenceAmount,
        status: seed.status,
        submittedAt: seed.submittedAt,
        approvedAt: seed.approvedAt,
        externalJournalRef: seed.externalJournalRef,
      },
    });

    for (const item of seed.items) {
      const existing = await prisma.reimbursementItem.findFirst({
        where: {
          reimbursementId: reimbursement.id,
          category: item.category,
          description: item.description,
        },
      });
      if (existing) continue;

      await prisma.reimbursementItem.create({
        data: {
          reimbursementId: reimbursement.id,
          category: item.category,
          description: item.description,
          amount: item.amount,
          transactionDate: date(item.transactionDate),
          receiptPath: item.receiptPath,
        },
      });
    }
  }
}

async function seedNotifications(
  users: Record<string, { id: number }>,
  travels: Record<string, { id: number }>,
) {
  const seeds: {
    userEmail: string;
    title: string;
    message: string;
    type: NotificationType;
    isRead: boolean;
  }[] = [
    {
      userEmail: 'manajer@sdm.dinas.go.id',
      title: 'Persetujuan diperlukan',
      message: `Permintaan dinas ke ${travels['submitted']?.destination ?? '-'} menunggu persetujuan Anda`,
      type: NotificationType.APPROVAL_REQUIRED,
      isRead: false,
    },
    {
      userEmail: 'kepala.bagian@sdm.dinas.go.id',
      title: 'Permintaan baru diajukan',
      message: 'Maya Sari mengajukan permintaan dinas baru',
      type: NotificationType.TRAVEL_SUBMITTED,
      isRead: false,
    },
    {
      userEmail: 'kepala.bagian@sdm.dinas.go.id',
      title: 'Persetujuan diperlukan',
      message: 'Permintaan dinas perlu persetujuan level 2 Anda',
      type: NotificationType.APPROVAL_REQUIRED,
      isRead: true,
    },
    {
      userEmail: 'pegawai@sdm.dinas.go.id',
      title: 'Permintaan disetujui',
      message: 'Permintaan dinas Anda telah disetujui',
      type: NotificationType.TRAVEL_APPROVED,
      isRead: true,
    },
    {
      userEmail: 'pegawai@sdm.dinas.go.id',
      title: 'Permintaan ditolak',
      message: 'Permintaan dinas Anda ditolak, silakan revise',
      type: NotificationType.TRAVEL_REJECTED,
      isRead: true,
    },
    {
      userEmail: 'travel.admin@dinas.go.id',
      title: 'Pengingat',
      message: 'Terdapat 1 permintaan dinas yang menunggu proses booking',
      type: NotificationType.SYSTEM,
      isRead: false,
    },
  ];

  for (const seed of seeds) {
    const userId = users[seed.userEmail]?.id ?? 0;

    const existing = await prisma.notification.findFirst({
      where: { userId, title: seed.title, message: seed.message },
    });
    if (existing) continue;

    await prisma.notification.create({
      data: {
        userId,
        title: seed.title,
        message: seed.message,
        type: seed.type,
        isRead: seed.isRead,
      },
    });
  }
}

async function seedAuditLogs(
  users: Record<string, { id: number }>,
  travels: Record<string, { id: number }>,
  policies: Record<string, { id: number }>,
) {
  const seeds: {
    userEmail: string;
    action: string;
    entityType: string;
    entityId: number;
    oldValue: Prisma.InputJsonValue | undefined;
    newValue: Prisma.InputJsonValue;
    ipAddress: string;
  }[] = [
    {
      userEmail: 'pegawai@sdm.dinas.go.id',
      action: 'SUBMIT_TRAVEL',
      entityType: 'TravelRequest',
      entityId: travels['submitted']?.id ?? 0,
      oldValue: undefined,
      newValue: { status: TravelRequestStatus.SUBMITTED },
      ipAddress: '103.28.14.77',
    },
    {
      userEmail: 'manajer@sdm.dinas.go.id',
      action: 'APPROVE_TRAVEL',
      entityType: 'TravelRequest',
      entityId: travels['approved']?.id ?? 0,
      oldValue: { status: TravelRequestStatus.IN_REVIEW },
      newValue: { status: TravelRequestStatus.APPROVED, level: 1 },
      ipAddress: '103.28.14.91',
    },
    {
      userEmail: 'super.admin@dinas.go.id',
      action: 'UPDATE_POLICY',
      entityType: 'TravelPolicy',
      entityId: policies['Kepala Dinas - Domestik']?.id ?? 0,
      oldValue: { hotelLimit: '4500000.00' },
      newValue: { hotelLimit: '5000000.00' },
      ipAddress: '103.28.14.10',
    },
    {
      userEmail: 'finance@dinas.go.id',
      action: 'APPROVE_REIMBURSEMENT',
      entityType: 'Reimbursement',
      entityId: 1,
      oldValue: { status: ReimbursementStatus.SUBMITTED },
      newValue: { status: ReimbursementStatus.PAID, approvedAmount: '11950000.00' },
      ipAddress: '103.28.14.55',
    },
  ];

  for (const seed of seeds) {
    const userId = users[seed.userEmail]?.id ?? null;

    const existing = await prisma.auditLog.findFirst({
      where: {
        userId,
        action: seed.action,
        entityType: seed.entityType,
        entityId: seed.entityId,
      },
    });
    if (existing) continue;

    await prisma.auditLog.create({
      data: {
        userId,
        action: seed.action,
        entityType: seed.entityType,
        entityId: seed.entityId,
        ...(seed.oldValue === undefined ? {} : { oldValue: seed.oldValue }),
        newValue: seed.newValue,
        ipAddress: seed.ipAddress,
      },
    });
  }
}

async function printSummary() {
  const [
    users,
    departments,
    positions,
    policies,
    travels,
    approvals,
    delegations,
    documents,
    bookings,
    reimbursements,
    reimbursementItems,
    notifications,
    auditLogs,
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.department.count(),
    prisma.position.count(),
    prisma.travelPolicy.count(),
    prisma.travelRequest.count(),
    prisma.approval.count(),
    prisma.approvalDelegation.count(),
    prisma.travelDocument.count(),
    prisma.booking.count(),
    prisma.reimbursement.count(),
    prisma.reimbursementItem.count(),
    prisma.notification.count(),
    prisma.auditLog.count(),
  ]);

  const rows: [string, number][] = [
    ['User', users],
    ['Department', departments],
    ['Position', positions],
    ['TravelPolicy', policies],
    ['TravelRequest', travels],
    ['Approval', approvals],
    ['ApprovalDelegation', delegations],
    ['TravelDocument', documents],
    ['Booking', bookings],
    ['Reimbursement', reimbursements],
    ['ReimbursementItem', reimbursementItems],
    ['Notification', notifications],
    ['AuditLog', auditLogs],
  ];

  console.log('\nRingkasan data:');
  for (const [label, total] of rows) {
    console.log(`  ${label.padEnd(20)} ${total}`);
  }

  console.log(`\nKredensial login (password semua: ${DEFAULT_PASSWORD})`);
  console.log('  super.admin@dinas.go.id   SUPER_ADMIN');
  console.log('  admin@dinas.go.id         ADMIN');
  console.log('  hrd@dinas.go.id           HRD');
  console.log('  finance@dinas.go.id       FINANCE');
  console.log('  travel.admin@dinas.go.id  TRAVEL_ADMIN');
  console.log('  kepala.bagian@sdm.dinas.go.id  DEPARTMENT_HEAD');
  console.log('  manajer@sdm.dinas.go.id   MANAGER');
  console.log('  pegawai@sdm.dinas.go.id   EMPLOYEE');
  console.log('  nonaktif@dinas.go.id      EMPLOYEE (isActive=false)');
}

async function main() {
  if (shouldReset) {
    await resetDatabase();
  }

  const departments = await seedDepartments();
  const positions = await seedPositions();
  const policies = await seedTravelPolicies(departments, positions);
  const users = await seedUsers(departments, positions);
  const travels = await seedTravelRequests(users, policies);

  await seedApprovals(travels, users);
  await seedApprovalDelegations(users);
  await seedDocuments(travels);
  await seedBookings(travels);
  await seedReimbursements(travels);
  await seedNotifications(users, travels);
  await seedAuditLogs(users, travels, policies);

  await printSummary();
  console.log('\n✅ Seed selesai.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error('❌ Seed gagal:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
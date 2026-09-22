import { BookingStatus, Prisma, TravelRequestStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import type { BookingInput } from './travel.schema';

export const travelBookingRepository = {
  create(travelId: number, data: BookingInput) {
    const create: Prisma.BookingUncheckedCreateInput = {
      travelId,
      type: data.type,
      amount: data.amount,
      ...(data.provider !== undefined ? { provider: data.provider } : {}),
      ...(data.bookingCode !== undefined ? { bookingCode: data.bookingCode } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.bookingDate !== undefined && data.bookingDate !== null
        ? { bookingDate: data.bookingDate }
        : {}),
    };
    return prisma.booking.create({ data: create });
  },

  findByTravel(travelId: number) {
    return prisma.booking.findMany({ where: { travelId }, orderBy: { createdAt: 'desc' } });
  },

  findById(id: number) {
    return prisma.booking.findUnique({ where: { id }, include: { travel: true } });
  },

  updateStatus(id: number, status: BookingStatus) {
    return prisma.booking.update({ where: { id }, data: { status } });
  },

  async listPendingBookings() {
    return prisma.travelRequest.findMany({
      where: { status: TravelRequestStatus.APPROVED, bookings: { none: {} } },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  },
};
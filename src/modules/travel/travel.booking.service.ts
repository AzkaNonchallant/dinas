import { TravelRequestStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { travelBookingRepository } from './travel.booking.repository';
import type { BookingInput, BookingStatusInput } from './travel.schema';

const ADMIN_BOOKING_ROLES = ['TRAVEL_ADMIN', 'ADMIN'];

export const travelBookingService = {
  listPending() {
    return travelBookingRepository.listPendingBookings();
  },

  async create(travelId: number, input: BookingInput) {
    const travel = await prisma.travelRequest.findUnique({ where: { id: travelId } });
    if (!travel) throw new AppError('Pengajuan travel tidak ditemukan', 404);
    if (travel.status !== TravelRequestStatus.APPROVED) {
      throw new AppError('Booking hanya dapat dibuat untuk travel berstatus APPROVED', 400);
    }
    return travelBookingRepository.create(travelId, input);
  },

  async list(userId: number, role: string, travelId: number) {
    const travel = await prisma.travelRequest.findUnique({ where: { id: travelId } });
    if (!travel) throw new AppError('Pengajuan travel tidak ditemukan', 404);
    if (travel.userId !== userId && !ADMIN_BOOKING_ROLES.includes(role)) {
      throw new AppError('Anda tidak memiliki akses ke booking ini', 403);
    }
    return travelBookingRepository.findByTravel(travelId);
  },

  async updateStatus(id: number, input: BookingStatusInput) {
    const booking = await travelBookingRepository.findById(id);
    if (!booking) throw new AppError('Booking tidak ditemukan', 404);
    return travelBookingRepository.updateStatus(id, input.status);
  },
};
import { DestinationTier, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import type { PolicyInput, UpdatePolicyInput } from './travel.schema';

export const travelPolicyRepository = {
  findAll() {
    return prisma.travelPolicy.findMany({ orderBy: { name: 'asc' } });
  },

  findById(id: number) {
    return prisma.travelPolicy.findUnique({ where: { id } });
  },

  findApplicable(positionId: number, destinationTier: DestinationTier) {
    return prisma.travelPolicy.findMany({
      where: {
        OR: [{ positionId: null }, { positionId }],
        destinationTier,
      },
      orderBy: { name: 'asc' },
    });
  },

  create(data: PolicyInput) {
    return prisma.travelPolicy.create({
      data: {
        name: data.name,
        destinationTier: data.destinationTier,
        hotelLimit: data.hotelLimit,
        transportLimit: data.transportLimit,
        allowanceLimit: data.allowanceLimit,
        ...(data.positionId !== undefined && data.positionId !== null
          ? { positionId: data.positionId }
          : {}),
      },
    });
  },

  update(id: number, data: UpdatePolicyInput) {
    const updates: Prisma.TravelPolicyUncheckedUpdateInput = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.positionId !== undefined) updates.positionId = data.positionId;
    if (data.destinationTier !== undefined) updates.destinationTier = data.destinationTier;
    if (data.hotelLimit !== undefined) updates.hotelLimit = data.hotelLimit;
    if (data.transportLimit !== undefined) updates.transportLimit = data.transportLimit;
    if (data.allowanceLimit !== undefined) updates.allowanceLimit = data.allowanceLimit;
    return prisma.travelPolicy.update({ where: { id }, data: updates });
  },

  delete(id: number) {
    return prisma.travelPolicy.delete({ where: { id } });
  },
};
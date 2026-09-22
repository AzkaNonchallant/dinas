import { AppError } from '../../middleware/error.middleware';
import { travelPolicyRepository } from './travel.policy.repository';
import type { ApplicablePolicyQuery, PolicyInput, UpdatePolicyInput } from './travel.schema';

export const travelPolicyService = {
  list() {
    return travelPolicyRepository.findAll();
  },

  listApplicable(query: ApplicablePolicyQuery) {
    return travelPolicyRepository.findApplicable(query.positionId, query.destinationTier);
  },

  create(input: PolicyInput) {
    return travelPolicyRepository.create(input);
  },

  async update(id: number, input: UpdatePolicyInput) {
    const policy = await travelPolicyRepository.findById(id);
    if (!policy) throw new AppError('Kebijakan travel tidak ditemukan', 404);
    return travelPolicyRepository.update(id, input);
  },

  async remove(id: number) {
    const policy = await travelPolicyRepository.findById(id);
    if (!policy) throw new AppError('Kebijakan travel tidak ditemukan', 404);
    return travelPolicyRepository.delete(id);
  },
};
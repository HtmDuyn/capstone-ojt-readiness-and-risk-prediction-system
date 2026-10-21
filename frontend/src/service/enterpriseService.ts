import API from './api';
import { EnterpriseProfileResponse } from '@/types/enterprise/enterpriseTypes';
import { UpdateProfileRequest, UpdateProfileResponse } from './authService';

export const enterpriseService = {
  getProfile: async (): Promise<EnterpriseProfileResponse> => {
    const response = await API.get<EnterpriseProfileResponse>('/enterprise/profile');
    return response.data;
  },
  updateAccountProfile: async (data: UpdateProfileRequest): Promise<UpdateProfileResponse> => {
    const response = await API.patch('/accounts/me/profile', data);
    return response.data as UpdateProfileResponse;
  },
};

export default enterpriseService;

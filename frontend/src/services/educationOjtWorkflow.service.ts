import API from './api';
import { apiData, getAllItems, getPage } from './educationApi';
import type { Query } from '@/types/education/api.types';
import type { Handoff, OjtFinalResult } from '@/types/education/ojtWorkflow.types';

export const educationOjtWorkflowService = {
  getHandoffs: (ojtSemesterId?: number, signal?: AbortSignal) =>
    getAllItems<Handoff>('/eligible-student-handoffs', ojtSemesterId ? { ojtSemesterId } : {}, signal),
  async handoff(payload: { ojtSemesterId: number; studentIds: number[]; reason: string; idempotencyKey: string }) {
    return apiData<{ handoffId: number; total: number; recipientRole: string }>(
      (await API.post('/eligible-student-handoffs', payload)).data,
    );
  },
  getFinalResults: (query: Query, signal?: AbortSignal) =>
    getPage<OjtFinalResult>('/ojt-results', query, signal),
  async confirmResult(id: number, reason: string, idempotencyKey: string) {
    apiData((await API.post(`/ojt-results/${id}/confirm`, { reason, idempotencyKey })).data);
  },
};

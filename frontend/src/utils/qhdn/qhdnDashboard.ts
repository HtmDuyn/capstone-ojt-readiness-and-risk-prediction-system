export interface QhdnDashboardSummary {
  hasRecruitmentRounds?: boolean;
  quotas: {companyId:number; capacity:number; remainingSlots:number}[];
  progress: { inProgress: number; completed: number; evaluated: number };
}

export interface DashboardPlacementSummary {
  stats: {
    handedOff: number;
    assigned: number;
    waiting: number;
    rejected: number;
    acceptanceRate: number;
  };
  companies: {id:number;name:string;actualCount:number}[];
}

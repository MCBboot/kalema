export interface Vote {
  voterPlayerId: string;
  targetPlayerId: string;
  submittedAt: number;
}

export function createVote(voterPlayerId: string, targetPlayerId: string): Vote {
  return {
    voterPlayerId,
    targetPlayerId,
    submittedAt: Date.now(),
  };
}

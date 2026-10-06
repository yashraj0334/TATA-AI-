// Risk service — frontend-only demo implementation.
// No backend connectivity. Data is served from local mock data.

import { risks as mockRisks, riskSummary as mockSummary, contractSummary as mockContract } from '../data/mockData';

export default {
  async getRiskAnalysis(documentId) {
    return {
      risks: [...mockRisks],
      summary: { ...mockSummary },
      contractSummary: mockContract,
    };
  },

  async getProcessingStatus(documentId) {
    return {
      currentStep: 0,
      progress: 0,
      status: 'pending',
    };
  },
};

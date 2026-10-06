// AI service — frontend-only demo implementation.
// No backend/AI connectivity. Data is served from local mock data.

import {
  risks as mockRisks,
  riskSummary as mockSummary,
  contractSummary as mockContract,
  processingSteps as mockSteps,
} from '../data/mockData';

export default {
  async getDocumentSummary(documentId) {
    return { summary: mockContract };
  },

  async getExtractedClauses(documentId) {
    return { clauses: mockRisks.map((r) => ({ id: r.id, title: r.title, clause: r.clause, page: r.page })) };
  },

  async getRiskAnalysis(documentId) {
    return {
      risks: [...mockRisks],
      summary: { ...mockSummary },
    };
  },

  async updateRiskStatus(documentId, riskId, action, note) {
    return { success: true, riskId, action, note };
  },

  async getProcessingStatus(documentId) {
    return {
      steps: mockSteps,
      currentStep: 0,
      progress: 0,
      status: 'pending',
    };
  },

  async getProcessingPipeline() {
    return [...mockSteps];
  },
};

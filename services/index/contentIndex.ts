import {
  listFraudReports,
  listReportingAuditEntries,
  listSimilarityEntries,
  saveFraudReport,
  saveReportingAuditEntry,
  syncVerificationToSimilarityIndex,
  updateFraudReportStatus
} from "@/lib/similarity-store";

export async function listIndexedContent() {
  return listSimilarityEntries();
}

export async function upsertIndexedVerification(record: Parameters<typeof syncVerificationToSimilarityIndex>[0]) {
  return syncVerificationToSimilarityIndex(record);
}

export async function createFraudReport(payload: Parameters<typeof saveFraudReport>[0]) {
  return saveFraudReport(payload);
}

export async function listReportingEvents() {
  return listFraudReports();
}

export async function createReportingAuditEntry(payload: Parameters<typeof saveReportingAuditEntry>[0]) {
  return saveReportingAuditEntry(payload);
}

export async function listReportingAuditHistory() {
  return listReportingAuditEntries();
}

export async function setReportingStatus(reportId: string, status: Parameters<typeof updateFraudReportStatus>[1]) {
  return updateFraudReportStatus(reportId, status);
}

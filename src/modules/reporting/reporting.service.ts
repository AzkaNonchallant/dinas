import { reportingRepository } from './reporting.repository';
import type { ExportReportQuery, ReportRangeQuery } from './reporting.schema';

export const reportingService = {
  getDashboard() {
    return reportingRepository.dashboard();
  },

  expenseByDepartment(query: ReportRangeQuery) {
    return reportingRepository.expenseByDepartment(query.from, query.to);
  },

  expenseByEmployee(query: ReportRangeQuery) {
    return reportingRepository.expenseByEmployee(query.from, query.to);
  },

  expenseByProject(query: ReportRangeQuery) {
    return reportingRepository.expenseByProject(query.from, query.to);
  },

  async export(query: ExportReportQuery) {
    const rows = await reportingRepository.expenseByDepartment(query.from, query.to);
    return buildCsv(rows);
  },
};

function buildCsv(rows: { department: string | null; total: number }[]) {
  const header = 'Departemen,Total';
  const lines = rows.map((row) => `${csvField(row.department)},${csvField(row.total)}`);
  return [header, ...lines].join('\n');
}

function csvField(value: unknown): string {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}
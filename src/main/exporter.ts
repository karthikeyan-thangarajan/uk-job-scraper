import ExcelJS from 'exceljs';
import { Job, ExportOptions } from './shared/types';
import { logger } from './logger';
import fs from 'fs';
import path from 'path';

export async function exportToExcel(jobs: Job[], options: ExportOptions): Promise<string> {
  const workbook = new ExcelJS.Workbook();

  if (options.mode === 'append' && fs.existsSync(options.filePath)) {
    try {
      await workbook.xlsx.readFile(options.filePath);
    } catch {
      // If file can't be read, start fresh
    }
  }

  let worksheet = workbook.getWorksheet('Jobs');
  if (!worksheet) {
    worksheet = workbook.addWorksheet('Jobs');

    // Define columns
    const columns: Partial<ExcelJS.Column>[] = [
      { header: 'Job Title', key: 'title', width: 35 },
      { header: 'Company', key: 'company', width: 25 },
      { header: 'Location', key: 'location', width: 20 },
      { header: 'Salary', key: 'salary', width: 20 },
      { header: 'Contract Type', key: 'contractType', width: 15 },
      { header: 'Work Mode', key: 'workMode', width: 12 },
      { header: 'Posted Date', key: 'postedDate', width: 15 },
      { header: 'Source', key: 'source', width: 12 },
      { header: 'URL', key: 'url', width: 50 },
      { header: 'Scraped At', key: 'scrapedAt', width: 20 },
    ];

    if (options.includeDescription) {
      columns.splice(7, 0, { header: 'Description', key: 'description', width: 60 });
    }

    worksheet.columns = columns;

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;
  }

  // Add job rows
  for (const job of jobs) {
    const rowData: Record<string, unknown> = {
      title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary,
      contractType: job.contractType || 'Not specified',
      workMode: job.workMode || 'Not specified',
      postedDate: job.postedDate,
      source: job.source,
      url: job.url,
      scrapedAt: new Date(job.scrapedAt).toLocaleDateString('en-GB'),
    };

    if (options.includeDescription) {
      rowData.description = job.description;
    }

    const row = worksheet.addRow(rowData);

    // Make URL clickable
    const urlColIndex = options.includeDescription ? 10 : 9;
    const urlCell = row.getCell(urlColIndex);
    urlCell.value = { text: job.url, hyperlink: job.url } as ExcelJS.CellHyperlinkValue;
    urlCell.font = { color: { argb: 'FF2563EB' }, underline: true };
  }

  // Auto-filter
  if (worksheet.rowCount > 1) {
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: worksheet.rowCount, column: worksheet.columnCount },
    };
  }

  // Alternate row coloring
  for (let i = 2; i <= worksheet.rowCount; i++) {
    if (i % 2 === 0) {
      const row = worksheet.getRow(i);
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F4F6' },
      };
    }
  }

  // Ensure directory exists
  const dir = path.dirname(options.filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  await workbook.xlsx.writeFile(options.filePath);
  logger.info(`Exported ${jobs.length} jobs to ${options.filePath}`);
  return options.filePath;
}

export async function exportToCsv(jobs: Job[], filePath: string, includeDescription: boolean): Promise<string> {
  const headers = [
    'Job Title', 'Company', 'Location', 'Salary', 'Contract Type',
    'Work Mode', 'Posted Date',
    ...(includeDescription ? ['Description'] : []),
    'Source', 'URL', 'Scraped At',
  ];

  const rows = jobs.map(job => {
    const fields = [
      escapeCsvField(job.title),
      escapeCsvField(job.company),
      escapeCsvField(job.location),
      escapeCsvField(job.salary),
      escapeCsvField(job.contractType),
      escapeCsvField(job.workMode),
      escapeCsvField(job.postedDate),
      ...(includeDescription ? [escapeCsvField(job.description)] : []),
      escapeCsvField(job.source),
      escapeCsvField(job.url),
      escapeCsvField(new Date(job.scrapedAt).toLocaleDateString('en-GB')),
    ];
    return fields.join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');

  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filePath, csv, 'utf-8');
  logger.info(`Exported ${jobs.length} jobs to CSV: ${filePath}`);
  return filePath;
}

function escapeCsvField(value: string): string {
  if (!value) return '""';
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

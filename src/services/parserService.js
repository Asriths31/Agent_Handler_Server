import { Readable } from 'stream';
import csv from 'csv-parser';
import xlsx from 'xlsx';

export const parseFile = async (buffer, filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  let rawData = [];

  if (ext === 'csv') {
    rawData = await parseCSV(buffer);
  } else if (ext === 'xlsx' || ext === 'xls') {
    rawData = parseExcel(buffer);
  } else {
    throw new Error('Unsupported file extension. Only CSV, XLS, and XLSX are allowed.');
  }

  if (rawData.length === 0) {
    throw new Error('The file is empty.');
  }

  const firstRow = rawData[0];
  const keys = Object.keys(firstRow).map(k => k.trim());
  
  const required = ['FirstName', 'Phone', 'Notes'];
  const missing = required.filter(col => !keys.includes(col));

  if (missing.length > 0) {
    throw new Error(`Missing required columns: ${missing.join(', ')}`);
  }

  return rawData.map(row => {
    const cleanedRow = {};
    Object.keys(row).forEach(key => {
      cleanedRow[key.trim()] = String(row[key] || '').trim();
    });
    return {
      firstName: cleanedRow['FirstName'],
      phone: cleanedRow['Phone'],
      notes: cleanedRow['Notes']
    };
  });
};

const parseCSV = (buffer) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from(buffer);
    stream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
};

const parseExcel = (buffer) => {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(sheet, { defval: '' });
};

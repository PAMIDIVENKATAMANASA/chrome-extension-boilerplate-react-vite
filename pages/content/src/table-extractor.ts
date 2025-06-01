// Content script for table extraction functionality

interface TableData {
  headers: string[];
  rows: string[][];
  tableIndex: number;
  tableElement: HTMLTableElement;
}

const findAllTables = (): TableData[] => {
  const tables = document.querySelectorAll('table');
  const tableData: TableData[] = [];

  tables.forEach((table, index) => {
    const data = extractTableData(table as HTMLTableElement, index);
    if (data.rows.length > 0) {
      tableData.push(data);
    }
  });

  return tableData;
};

const extractTableData = (table: HTMLTableElement, index: number): TableData => {
  const headers: string[] = [];
  const rows: string[][] = [];

  // Extract headers
  const headerRow = table.querySelector('thead tr, tr:first-child');
  if (headerRow) {
    const headerCells = headerRow.querySelectorAll('th, td');
    headerCells.forEach(cell => {
      headers.push(cleanCellText(cell.textContent || ''));
    });
  }

  // Extract data rows
  const dataRows = table.querySelectorAll('tbody tr, tr');
  dataRows.forEach((row, rowIndex) => {
    // Skip header row if it's the first row and we already processed headers
    if (rowIndex === 0 && !table.querySelector('thead') && headers.length > 0) {
      return;
    }

    const cells = row.querySelectorAll('td, th');
    const rowData: string[] = [];

    cells.forEach(cell => {
      rowData.push(cleanCellText(cell.textContent || ''));
    });

    if (rowData.some(cell => cell.trim() !== '')) {
      rows.push(rowData);
    }
  });

  return {
    headers,
    rows,
    tableIndex: index,
    tableElement: table,
  };
};

const tableToCSV = (tableData: TableData): string => {
  const csvRows: string[] = [];

  // Add headers if they exist
  if (tableData.headers.length > 0) {
    csvRows.push(tableData.headers.map(escapeCSVField).join(','));
  }

  // Add data rows
  tableData.rows.forEach(row => {
    csvRows.push(row.map(escapeCSVField).join(','));
  });

  return csvRows.join('\n');
};

const tableToJSON = (tableData: TableData): string => {
  const jsonData = tableData.rows.map(row => {
    const obj: Record<string, string> = {};
    row.forEach((cell, index) => {
      const header = tableData.headers[index] || `Column_${index + 1}`;
      obj[header] = cell;
    });
    return obj;
  });

  return JSON.stringify(jsonData, null, 2);
};

const cleanCellText = (text: string): string =>
  text
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/\n/g, ' ') // Replace newlines with space
    .trim();

const escapeCSVField = (field: string): string => {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}";`;
  }
  return field;
};

// ✅ All exports at the bottom
export type { TableData };
export { findAllTables, extractTableData, tableToCSV, tableToJSON };

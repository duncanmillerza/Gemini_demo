import { google, sheets_v4 } from 'googleapis';

// A cache for the Google Sheets API object to avoid re-creating it on every request
let sheets: sheets_v4.Sheets | null;

/**
 * Authenticates with the Google Sheets API and returns a Sheets API object.
 * Caches the object for subsequent calls.
 */
async function getSheetsApi() {
  if (sheets) {
    return sheets;
  }

  const stripWrappedQuotes = (s: string | undefined | null): string => {
    const t = (s ?? '').trim();
    if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
      return t.slice(1, -1);
    }
    return t;
  };

  const clientEmail = stripWrappedQuotes(process.env.SHEETS_CLIENT_EMAIL);
  const rawKey = stripWrappedQuotes(process.env.SHEETS_PRIVATE_KEY);
  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  // Normalize private key from common .env formats:
  // - Escaped newlines (\n)
  // - Literal multiline
  // - Base64-encoded PEM (no header present)
  function normalizePrivateKey(input: string): string {
    let key = input.trim();
    // Normalize CRLF to LF
    key = key.replace(/\r\n/g, '\n');
    if (!key) return '';
    // Replace escaped newlines first
    if (key.includes('\\n')) key = key.replace(/\\n/g, '\n');
    // If still no PEM header, try base64 decode
    if (!/BEGIN [A-Z ]+ PRIVATE KEY/.test(key)) {
      try {
        const decoded = Buffer.from(key, 'base64').toString('utf8');
        if (/BEGIN [A-Z ]+ PRIVATE KEY/.test(decoded)) key = decoded;
      } catch {
        // ignore
      }
    }
    return key;
  }

  // If a key file is provided, prefer it (easiest to configure locally)
  if (keyFile) {
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      keyFile,
    });
    const authClient = await auth.getClient();
    sheets = google.sheets({ version: 'v4', auth: authClient });
    return sheets;
  }

  const privateKey = normalizePrivateKey(rawKey);

  // Temporary debug guards (remove after verifying envs)
  if (!clientEmail) throw new Error('Missing SHEETS_CLIENT_EMAIL');
  if (!rawKey) throw new Error('Missing SHEETS_PRIVATE_KEY');
  if (!privateKey.includes('-----BEGIN')) throw new Error('Private key missing BEGIN header after normalization');

  if (!clientEmail || !privateKey) {
    throw new Error('Missing Google Sheets credentials (SHEETS_CLIENT_EMAIL / SHEETS_PRIVATE_KEY)');
  }

  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
  });

  const authClient = await auth.getClient();
  sheets = google.sheets({ version: 'v4', auth: authClient });
  return sheets;
}

/**
 * Fetches all data from the "Referrals" sheet.
 */
async function _getRows() {
  const sheetsApi = await getSheetsApi();
  const spreadsheetId = process.env.SHEETS_SPREADSHEET_ID as string;
  if (!spreadsheetId) {
    throw new Error('Missing SHEETS_SPREADSHEET_ID');
  }
  const response = await sheetsApi.spreadsheets.values.get({
    spreadsheetId,
    // Includes columns A through L (id..updatedAt)
    range: 'Referrals!A:L',
  });
  return response.data.values;
}

/**
 * Appends a new row to the "Referrals" sheet.
 */
async function _appendRow(rowData: string[]) {
  const sheetsApi = await getSheetsApi();
  const spreadsheetId = process.env.SHEETS_SPREADSHEET_ID as string;
  if (!spreadsheetId) {
    throw new Error('Missing SHEETS_SPREADSHEET_ID');
  }
  await sheetsApi.spreadsheets.values.append({
    spreadsheetId,
    range: 'Referrals!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [rowData],
    },
  });
}

/**
 * Updates a specific row in the "Referrals" sheet.
 */
async function _updateRow(rowIndex: number, rowData: string[]) {
  const sheetsApi = await getSheetsApi();
  const spreadsheetId = process.env.SHEETS_SPREADSHEET_ID as string;
  if (!spreadsheetId) {
    throw new Error('Missing SHEETS_SPREADSHEET_ID');
  }
  await sheetsApi.spreadsheets.values.update({
    spreadsheetId,
    range: `Referrals!A${rowIndex}:L${rowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [rowData],
    },
  });
}

/**
 * Fetches a user from the "Users" sheet by their email.
 */
async function _getUserByEmail(email: string) {
  const sheetsApi = await getSheetsApi();
  const spreadsheetId = process.env.SHEETS_SPREADSHEET_ID as string;
  if (!spreadsheetId) {
    throw new Error('Missing SHEETS_SPREADSHEET_ID');
  }
  const response = await sheetsApi.spreadsheets.values.get({
    spreadsheetId,
    range: 'Users!A:C',
  });

  const users = response.data.values;
  if (!users) {
    return null;
  }

  const userRow = users.find(row => row[0] === email);
  if (!userRow) {
    return null;
  }

  return {
    email: userRow[0],
    name: userRow[1],
    department: userRow[2],
  };
}

/**
 * Fetches a unique list of all departments from the "Users" sheet.
 */
async function _getAllDepartments() {
  const sheetsApi = await getSheetsApi();
  const spreadsheetId = process.env.SHEETS_SPREADSHEET_ID as string;
  if (!spreadsheetId) {
    throw new Error('Missing SHEETS_SPREADSHEET_ID');
  }
  const response = await sheetsApi.spreadsheets.values.get({
    spreadsheetId,
    range: 'Users!C:C', // Only get the department column
  });

  const departments = response.data.values;
  if (!departments) {
    return [];
  }

  // Flatten the array, remove the header, and get unique values
  const uniqueDepartments = [...new Set(departments.slice(1).flat())];
  return uniqueDepartments;
}


export const getRows = _getRows;
export const appendRow = _appendRow;
export const updateRow = _updateRow;
export const getUserByEmail = _getUserByEmail;
export const getAllDepartments = _getAllDepartments;

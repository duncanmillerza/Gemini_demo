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

  // Use the environment variable for credentials JSON
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (!credentialsJson) {
    throw new Error('Missing GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable.');
  }

  // Parse the JSON string into an object
  let credentials: { client_email: string; private_key: string; };
  try {
    credentials = JSON.parse(credentialsJson);
  } catch (e) {
    throw new Error('Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON format.' + e);
  }

  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
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
  const spreadsheetId = process.env.GOOGLE_SHEET_ID as string;
  if (!spreadsheetId) {
    throw new Error('Missing GOOGLE_SHEET_ID');
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
  const spreadsheetId = process.env.GOOGLE_SHEET_ID as string;
  if (!spreadsheetId) {
    throw new Error('Missing GOOGLE_SHEET_ID');
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
  const spreadsheetId = process.env.GOOGLE_SHEET_ID as string;
  if (!spreadsheetId) {
    throw new Error('Missing GOOGLE_SHEET_ID');
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
  const spreadsheetId = process.env.GOOGLE_SHEET_ID as string;
  if (!spreadsheetId) {
    throw new Error('Missing GOOGLE_SHEET_ID');
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
  const spreadsheetId = process.env.GOOGLE_SHEET_ID as string;
  if (!spreadsheetId) {
    throw new Error('Missing GOOGLE_SHEET_ID');
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

/**
 * Adds a new user to the "Users" sheet.
 */
async function _createUser(email: string, name: string, department: string) {
  const sheetsApi = await getSheetsApi();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID as string;
  if (!spreadsheetId) {
    throw new Error('Missing GOOGLE_SHEET_ID');
  }
  
  await sheetsApi.spreadsheets.values.append({
    spreadsheetId,
    range: 'Users!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[email, name, department]],
    },
  });
  
  return {
    email,
    name,
    department,
  };
}


export const getRows = _getRows;
export const appendRow = _appendRow;
export const updateRow = _updateRow;
export const getUserByEmail = _getUserByEmail;
export const getAllDepartments = _getAllDepartments;
export const createUser = _createUser;
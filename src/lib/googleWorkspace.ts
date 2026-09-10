import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from './firebase';

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/forms.body.readonly',
  'https://www.googleapis.com/auth/forms.responses.readonly',
];

export const workspaceProvider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach(scope => {
  workspaceProvider.addScope(scope);
});
workspaceProvider.setCustomParameters({
  prompt: 'consent',
  access_type: 'offline',
});

// Cache the access token purely in memory (never localStorage or sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initWorkspaceAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleWorkspaceSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, workspaceProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve access token with Google Sheets & Forms permissions. Please ensure you grant the requested permissions.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Workspace Google Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getWorkspaceAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setWorkspaceAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const workspaceLogout = async (): Promise<void> => {
  cachedAccessToken = null;
  await signOut(auth);
};

// ==================== GOOGLE SHEETS API ====================

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
}

export interface SheetMetadata {
  id: string;
  title: string;
  sheets: {
    sheetId: number;
    title: string;
    index: number;
    rowCount?: number;
    columnCount?: number;
  }[];
  spreadsheetUrl: string;
}

export interface SheetValuesResult {
  range: string;
  majorDimension: string;
  values: string[][];
}

/**
 * List Google Spreadsheets from user's Google Drive
 */
export async function listSpreadsheets(accessToken: string): Promise<GoogleDriveFile[]> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,modifiedTime,webViewLink,iconLink)&pageSize=30&orderBy=modifiedTime desc`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to list spreadsheets (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Get details & tab names of a spreadsheet
 */
export async function getSpreadsheetDetails(accessToken: string, spreadsheetId: string): Promise<SheetMetadata> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId,properties.title,spreadsheetUrl,sheets.properties(sheetId,title,index,gridProperties)`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to fetch spreadsheet details: ${err}`);
  }

  const data = await res.json();
  return {
    id: data.spreadsheetId,
    title: data.properties?.title || 'Untitled Spreadsheet',
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    sheets: (data.sheets || []).map((s: any) => ({
      sheetId: s.properties?.sheetId,
      title: s.properties?.title || 'Sheet1',
      index: s.properties?.index,
      rowCount: s.properties?.gridProperties?.rowCount,
      columnCount: s.properties?.gridProperties?.columnCount,
    })),
  };
}

/**
 * Read range values from a spreadsheet
 */
export async function getSheetValues(
  accessToken: string,
  spreadsheetId: string,
  range: string
): Promise<SheetValuesResult> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to read sheet values: ${err}`);
  }

  const data = await res.json();
  return {
    range: data.range || range,
    majorDimension: data.majorDimension || 'ROWS',
    values: data.values || [],
  };
}

/**
 * Create a new spreadsheet in user's Drive
 */
export async function createSpreadsheet(
  accessToken: string,
  title: string,
  initialSheetTitle: string = 'Sheet1',
  headers?: string[][]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets`;

  const body = {
    properties: {
      title,
    },
    sheets: [
      {
        properties: {
          title: initialSheetTitle,
        },
      },
    ],
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create spreadsheet: ${err}`);
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  if (headers && headers.length > 0) {
    await appendSheetValues(accessToken, spreadsheetId, `${initialSheetTitle}!A1`, headers);
  }

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Append rows to a spreadsheet
 */
export async function appendSheetValues(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: string[][]
): Promise<any> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    range
  )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to append sheet rows: ${err}`);
  }

  return await res.json();
}

/**
 * Update rows or cells in a spreadsheet
 */
export async function updateSheetValues(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: string[][]
): Promise<any> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    range
  )}?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to update sheet rows: ${err}`);
  }

  return await res.json();
}

/**
 * Clear a specific range in a spreadsheet
 */
export async function clearSheetValues(
  accessToken: string,
  spreadsheetId: string,
  range: string
): Promise<any> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to clear sheet range: ${err}`);
  }

  return await res.json();
}

// ==================== GOOGLE FORMS API ====================

export interface GoogleFormItem {
  itemId: string;
  title: string;
  description?: string;
  questionItem?: {
    question: {
      questionId: string;
      required?: boolean;
      textQuestion?: {
        paragraph?: boolean;
      };
      choiceQuestion?: {
        type: string; // 'RADIO', 'CHECKBOX', 'DROP_DOWN'
        options: { value: string }[];
      };
      scaleQuestion?: {
        low: number;
        high: number;
        lowLabel?: string;
        highLabel?: string;
      };
    };
  };
}

export interface GoogleFormDetails {
  formId: string;
  info: {
    title: string;
    documentTitle?: string;
    description?: string;
  };
  settings?: any;
  items: GoogleFormItem[];
  responderUri?: string;
  revisionId?: string;
}

export interface GoogleFormResponseAnswer {
  questionId: string;
  textAnswers?: {
    answers: { value: string }[];
  };
}

export interface GoogleFormResponse {
  responseId: string;
  createTime: string;
  lastSubmittedTime: string;
  respondentEmail?: string;
  answers?: Record<string, GoogleFormResponseAnswer>;
}

/**
 * List Google Forms from user's Google Drive
 */
export async function listForms(accessToken: string): Promise<GoogleDriveFile[]> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.form' and trashed=false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,modifiedTime,webViewLink,iconLink)&pageSize=30&orderBy=modifiedTime desc`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to list forms (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Get Form details & question items
 */
export async function getFormDetails(accessToken: string, formId: string): Promise<GoogleFormDetails> {
  const url = `https://forms.googleapis.com/v1/forms/${formId}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to fetch form details: ${err}`);
  }

  const data = await res.json();
  return {
    formId: data.formId,
    info: data.info || { title: 'Untitled Form' },
    settings: data.settings,
    items: data.items || [],
    responderUri: data.responderUri || `https://docs.google.com/forms/d/e/${formId}/viewform`,
    revisionId: data.revisionId,
  };
}

/**
 * Get all submitted responses for a Google Form
 */
export async function getFormResponses(
  accessToken: string,
  formId: string
): Promise<{ responses: GoogleFormResponse[] }> {
  const url = `https://forms.googleapis.com/v1/forms/${formId}/responses`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to fetch form responses: ${err}`);
  }

  const data = await res.json();
  return {
    responses: data.responses || [],
  };
}

/**
 * Create a new Google Form
 */
export async function createGoogleForm(
  accessToken: string,
  title: string,
  documentTitle?: string
): Promise<GoogleFormDetails> {
  const url = `https://forms.googleapis.com/v1/forms`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      info: {
        title,
        documentTitle: documentTitle || title,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create Google Form: ${err}`);
  }

  return await res.json();
}

/**
 * Add questions or update items in a Google Form
 */
export async function addQuestionsToForm(
  accessToken: string,
  formId: string,
  questions: {
    title: string;
    description?: string;
    required?: boolean;
    type: 'TEXT' | 'PARAGRAPH' | 'RADIO' | 'CHECKBOX';
    options?: string[];
  }[]
): Promise<any> {
  const url = `https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`;

  const requests = questions.map((q, index) => {
    if (q.type === 'TEXT' || q.type === 'PARAGRAPH') {
      return {
        createItem: {
          item: {
            title: q.title,
            description: q.description,
            questionItem: {
              question: {
                required: q.required ?? true,
                textQuestion: {
                  paragraph: q.type === 'PARAGRAPH',
                },
              },
            },
          },
          location: {
            index,
          },
        },
      };
    } else {
      return {
        createItem: {
          item: {
            title: q.title,
            description: q.description,
            questionItem: {
              question: {
                required: q.required ?? true,
                choiceQuestion: {
                  type: q.type,
                  options: (q.options || ['Option 1', 'Option 2']).map((opt) => ({ value: opt })),
                },
              },
            },
          },
          location: {
            index,
          },
        },
      };
    }
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to add questions to form: ${err}`);
  }

  return await res.json();
}

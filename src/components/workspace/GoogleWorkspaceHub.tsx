import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Plus,
  ExternalLink,
  RefreshCw,
  Table,
  CheckCircle2,
  AlertCircle,
  Download,
  Search,
  Layers,
  Sparkles,
  ArrowRight,
  LogOut,
  HelpCircle,
  Copy,
  Check,
  FolderOpen
} from 'lucide-react';
import {
  googleWorkspaceSignIn,
  getWorkspaceAccessToken,
  setWorkspaceAccessToken,
  workspaceLogout,
  initWorkspaceAuth,
  listSpreadsheets,
  getSpreadsheetDetails,
  getSheetValues,
  createSpreadsheet,
  appendSheetValues,
  listForms,
  getFormDetails,
  getFormResponses,
  createGoogleForm,
  addQuestionsToForm,
  GoogleDriveFile,
  SheetMetadata,
  GoogleFormDetails,
  GoogleFormResponse
} from '../../lib/googleWorkspace';
import { User } from 'firebase/auth';

export const GoogleWorkspaceHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sheets' | 'forms'>('sheets');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sheets state
  const [spreadsheetsList, setSpreadsheetsList] = useState<GoogleDriveFile[]>([]);
  const [isLoadingSheetsList, setIsLoadingSheetsList] = useState(false);
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState<string>('');
  const [spreadsheetMetadata, setSpreadsheetMetadata] = useState<SheetMetadata | null>(null);
  const [selectedSheetTab, setSelectedSheetTab] = useState<string>('');
  const [sheetValues, setSheetValues] = useState<string[][]>([]);
  const [isLoadingSheetData, setIsLoadingSheetData] = useState(false);
  const [sheetSearchQuery, setSheetSearchQuery] = useState('');

  // New Sheet Modal
  const [showCreateSheetModal, setShowCreateSheetModal] = useState(false);
  const [newSheetTitle, setNewSheetTitle] = useState('');
  const [newSheetTemplate, setNewSheetTemplate] = useState<'cricket' | 'members' | 'custom'>('cricket');
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);

  // Add Row Modal
  const [showAddRowModal, setShowAddRowModal] = useState(false);
  const [newRowValues, setNewRowValues] = useState<string[]>([]);
  const [isAddingRow, setIsAddingRow] = useState(false);

  // Forms state
  const [formsList, setFormsList] = useState<GoogleDriveFile[]>([]);
  const [isLoadingFormsList, setIsLoadingFormsList] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [formDetails, setFormDetails] = useState<GoogleFormDetails | null>(null);
  const [formResponses, setFormResponses] = useState<GoogleFormResponse[]>([]);
  const [isLoadingFormData, setIsLoadingFormData] = useState(false);
  const [formViewMode, setFormViewMode] = useState<'questions' | 'responses'>('questions');

  // New Form Modal
  const [showCreateFormModal, setShowCreateFormModal] = useState(false);
  const [newFormTitle, setNewFormTitle] = useState('');
  const [newFormTemplate, setNewFormTemplate] = useState<'cricket_reg' | 'feedback' | 'blank'>('cricket_reg');
  const [isCreatingForm, setIsCreatingForm] = useState(false);

  // Confirmation Modal for mutating/destructive operations (strictly required by skill)
  const [confirmationConfig, setConfirmationConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    onConfirm: () => {},
  });

  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Auth initialization
  useEffect(() => {
    const unsub = initWorkspaceAuth(
      (currentUser, cachedTok) => {
        setUser(currentUser);
        if (cachedTok) {
          setToken(cachedTok);
        }
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsub();
  }, []);

  // Fetch file lists whenever token becomes available
  useEffect(() => {
    if (token) {
      loadSpreadsheetsList();
      loadFormsList();
    }
  }, [token]);

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const res = await googleWorkspaceSignIn();
      setUser(res.user);
      setToken(res.accessToken);
      showNotification('success', `Signed in as ${res.user.displayName || res.user.email} with Google Workspace permissions.`);
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      setAuthError(err.message || 'Failed to authenticate with Google. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await workspaceLogout();
    setUser(null);
    setToken(null);
    setSpreadsheetsList([]);
    setSpreadsheetMetadata(null);
    setSheetValues([]);
    setFormsList([]);
    setFormDetails(null);
    setFormResponses([]);
    showNotification('info', 'Signed out from Google Workspace.');
  };

  // Load user spreadsheets from Drive
  const loadSpreadsheetsList = async () => {
    if (!token) return;
    setIsLoadingSheetsList(true);
    try {
      const files = await listSpreadsheets(token);
      setSpreadsheetsList(files);
      if (files.length > 0 && !selectedSpreadsheetId) {
        handleSelectSpreadsheet(files[0].id);
      }
    } catch (err: any) {
      console.error('Error listing sheets:', err);
      showNotification('error', `Could not load spreadsheets: ${err.message}`);
    } finally {
      setIsLoadingSheetsList(false);
    }
  };

  // Select and load spreadsheet details
  const handleSelectSpreadsheet = async (sheetId: string) => {
    if (!token || !sheetId) return;
    setSelectedSpreadsheetId(sheetId);
    setIsLoadingSheetData(true);
    try {
      const meta = await getSpreadsheetDetails(token, sheetId);
      setSpreadsheetMetadata(meta);
      const defaultTab = meta.sheets[0]?.title || 'Sheet1';
      setSelectedSheetTab(defaultTab);
      await loadSheetValues(sheetId, defaultTab);
    } catch (err: any) {
      console.error('Error fetching sheet metadata:', err);
      showNotification('error', `Could not load spreadsheet: ${err.message}`);
    } finally {
      setIsLoadingSheetData(false);
    }
  };

  // Load values for a specific tab
  const loadSheetValues = async (sheetId: string, tabName: string) => {
    if (!token) return;
    setIsLoadingSheetData(true);
    try {
      const result = await getSheetValues(token, sheetId, `${tabName}!A1:Z100`);
      setSheetValues(result.values || []);
    } catch (err: any) {
      console.error('Error fetching sheet values:', err);
      showNotification('error', `Could not load cell data: ${err.message}`);
    } finally {
      setIsLoadingSheetData(false);
    }
  };

  // Change tab inside the current spreadsheet
  const handleTabChange = async (tabName: string) => {
    setSelectedSheetTab(tabName);
    if (selectedSpreadsheetId) {
      await loadSheetValues(selectedSpreadsheetId, tabName);
    }
  };

  // Request Confirmation before creating spreadsheet
  const promptCreateSpreadsheet = () => {
    if (!newSheetTitle.trim()) {
      showNotification('error', 'Please provide a title for the new Google Spreadsheet.');
      return;
    }

    setConfirmationConfig({
      isOpen: true,
      title: 'Create Google Spreadsheet in Drive?',
      message: `This will create a new Google Spreadsheet titled "${newSheetTitle.trim()}" directly in your connected Google Drive account. Do you wish to continue?`,
      confirmLabel: 'Create Spreadsheet',
      onConfirm: async () => {
        setConfirmationConfig(prev => ({ ...prev, isOpen: false }));
        await executeCreateSpreadsheet();
      },
    });
  };

  const executeCreateSpreadsheet = async () => {
    if (!token) return;
    setIsCreatingSheet(true);
    try {
      let initialHeaders: string[][] = [];
      let initialTab = 'Sheet1';

      if (newSheetTemplate === 'cricket') {
        initialTab = 'Matches & Scores';
        initialHeaders = [
          ['Match ID', 'Date', 'Tournament', 'Team 1', 'Team 2', 'Toss Winner', 'Result / Margin', 'Man of the Match', 'Created At']
        ];
      } else if (newSheetTemplate === 'members') {
        initialTab = 'Directory';
        initialHeaders = [
          ['Reg ID', 'Full Name', 'Role / Category', 'Mobile Number', 'City / Village', 'Status', 'Date Registered']
        ];
      } else {
        initialHeaders = [['Column A', 'Column B', 'Column C', 'Column D']];
      }

      const created = await createSpreadsheet(token, newSheetTitle.trim(), initialTab, initialHeaders);
      showNotification('success', `Created spreadsheet "${newSheetTitle}" successfully!`);
      setShowCreateSheetModal(false);
      setNewSheetTitle('');
      await loadSpreadsheetsList();
      handleSelectSpreadsheet(created.spreadsheetId);
    } catch (err: any) {
      console.error('Error creating spreadsheet:', err);
      showNotification('error', `Failed to create spreadsheet: ${err.message}`);
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Request confirmation before appending a row
  const promptAddRow = () => {
    if (!selectedSpreadsheetId || !selectedSheetTab) return;
    setConfirmationConfig({
      isOpen: true,
      title: 'Add New Row to Spreadsheet?',
      message: `You are about to append a new data row to "${spreadsheetMetadata?.title || 'Spreadsheet'}" (${selectedSheetTab}). Proceed with updating your Google Sheet?`,
      confirmLabel: 'Add Row',
      onConfirm: async () => {
        setConfirmationConfig(prev => ({ ...prev, isOpen: false }));
        await executeAddRow();
      },
    });
  };

  const executeAddRow = async () => {
    if (!token || !selectedSpreadsheetId || !selectedSheetTab) return;
    setIsAddingRow(true);
    try {
      await appendSheetValues(token, selectedSpreadsheetId, `${selectedSheetTab}!A1`, [newRowValues]);
      showNotification('success', 'Row appended to spreadsheet successfully!');
      setShowAddRowModal(false);
      setNewRowValues([]);
      await loadSheetValues(selectedSpreadsheetId, selectedSheetTab);
    } catch (err: any) {
      console.error('Error appending row:', err);
      showNotification('error', `Failed to append row: ${err.message}`);
    } finally {
      setIsAddingRow(false);
    }
  };

  // ==================== FORMS LOGIC ====================

  const loadFormsList = async () => {
    if (!token) return;
    setIsLoadingFormsList(true);
    try {
      const files = await listForms(token);
      setFormsList(files);
      if (files.length > 0 && !selectedFormId) {
        handleSelectForm(files[0].id);
      }
    } catch (err: any) {
      console.error('Error listing forms:', err);
      showNotification('error', `Could not load forms: ${err.message}`);
    } finally {
      setIsLoadingFormsList(false);
    }
  };

  const handleSelectForm = async (formId: string) => {
    if (!token || !formId) return;
    setSelectedFormId(formId);
    setIsLoadingFormData(true);
    try {
      const details = await getFormDetails(token, formId);
      setFormDetails(details);
      const resps = await getFormResponses(token, formId);
      setFormResponses(resps.responses || []);
    } catch (err: any) {
      console.error('Error fetching form details:', err);
      showNotification('error', `Could not load form: ${err.message}`);
    } finally {
      setIsLoadingFormData(false);
    }
  };

  // Request Confirmation before creating a form
  const promptCreateForm = () => {
    if (!newFormTitle.trim()) {
      showNotification('error', 'Please provide a title for the new Google Form.');
      return;
    }

    setConfirmationConfig({
      isOpen: true,
      title: 'Create Google Form in Drive?',
      message: `This will create a new Google Form titled "${newFormTitle.trim()}" in your connected Google Drive account with predefined questions. Do you wish to continue?`,
      confirmLabel: 'Create Form',
      onConfirm: async () => {
        setConfirmationConfig(prev => ({ ...prev, isOpen: false }));
        await executeCreateForm();
      },
    });
  };

  const executeCreateForm = async () => {
    if (!token) return;
    setIsCreatingForm(true);
    try {
      const created = await createGoogleForm(token, newFormTitle.trim());

      // Add preset questions according to template
      let questionsToAdd: any[] = [];
      if (newFormTemplate === 'cricket_reg') {
        questionsToAdd = [
          { title: 'Player Full Name', type: 'TEXT', required: true },
          { title: 'Contact Phone Number', type: 'TEXT', required: true },
          { title: 'Playing Role', type: 'RADIO', options: ['Top-order Batter', 'Middle-order Batter', 'All-rounder', 'Pace Bowler', 'Spin Bowler', 'Wicketkeeper Batter'], required: true },
          { title: 'Batting Style', type: 'RADIO', options: ['Right-hand bat', 'Left-hand bat'], required: true },
          { title: 'Bowling Style', type: 'RADIO', options: ['Right-arm Fast', 'Right-arm Medium', 'Right-arm Spin', 'Left-arm Fast', 'Left-arm Spin', 'None'], required: true },
          { title: 'Club / Village / Town Name', type: 'TEXT', required: true },
          { title: 'T-Shirt / Jersey Size', type: 'RADIO', options: ['S', 'M', 'L', 'XL', 'XXL'], required: false },
        ];
      } else if (newFormTemplate === 'feedback') {
        questionsToAdd = [
          { title: 'Your Name (Optional)', type: 'TEXT', required: false },
          { title: 'Email Address', type: 'TEXT', required: true },
          { title: 'How satisfied are you with our services?', type: 'RADIO', options: ['Extremely Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied'], required: true },
          { title: 'Detailed Feedback or Suggestions', type: 'PARAGRAPH', required: true },
        ];
      }

      if (questionsToAdd.length > 0) {
        await addQuestionsToForm(token, created.formId, questionsToAdd);
      }

      showNotification('success', `Created Google Form "${newFormTitle}" with questions!`);
      setShowCreateFormModal(false);
      setNewFormTitle('');
      await loadFormsList();
      handleSelectForm(created.formId);
    } catch (err: any) {
      console.error('Error creating form:', err);
      showNotification('error', `Failed to create form: ${err.message}`);
    } finally {
      setIsCreatingForm(false);
    }
  };

  // Export Form Responses to Google Sheets
  const promptExportFormToSheet = () => {
    if (!formDetails || !formResponses.length) {
      showNotification('info', 'No responses available to export yet.');
      return;
    }

    setConfirmationConfig({
      isOpen: true,
      title: 'Export Responses to Google Sheets?',
      message: `This will create a new Google Spreadsheet titled "${formDetails.info.title} (Responses)" and populate ${formResponses.length} submission(s) into your Google Drive. Proceed?`,
      confirmLabel: 'Export to Sheet',
      onConfirm: async () => {
        setConfirmationConfig(prev => ({ ...prev, isOpen: false }));
        await executeExportFormToSheet();
      },
    });
  };

  const executeExportFormToSheet = async () => {
    if (!token || !formDetails) return;
    try {
      const questions = formDetails.items.filter(i => i.questionItem);
      const headers = [
        'Submission Timestamp',
        'Respondent Email',
        ...questions.map(q => q.title || 'Question')
      ];

      const rows: string[][] = formResponses.map(r => {
        const row = [
          new Date(r.lastSubmittedTime || r.createTime).toLocaleString(),
          r.respondentEmail || 'Anonymous'
        ];
        questions.forEach(q => {
          const qId = q.questionItem?.question.questionId;
          const ansObj = qId && r.answers ? r.answers[qId] : null;
          const val = ansObj?.textAnswers?.answers?.map(a => a.value).join(', ') || '-';
          row.push(val);
        });
        return row;
      });

      const sheetTitle = `${formDetails.info.title} - Responses`;
      const created = await createSpreadsheet(token, sheetTitle, 'Form Responses', [headers, ...rows]);
      showNotification('success', `Exported to new spreadsheet! Opening sheet...`);
      await loadSpreadsheetsList();
      setSelectedSpreadsheetId(created.spreadsheetId);
      setActiveTab('sheets');
      handleSelectSpreadsheet(created.spreadsheetId);
    } catch (err: any) {
      console.error('Export error:', err);
      showNotification('error', `Failed to export responses: ${err.message}`);
    }
  };

  // Helper to copy links
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Filter sheet values
  const filteredSheetRows = React.useMemo(() => {
    if (sheetValues.length <= 1) return sheetValues;
    const [header, ...dataRows] = sheetValues;
    if (!sheetSearchQuery.trim()) return sheetValues;
    const query = sheetSearchQuery.toLowerCase();
    const filtered = dataRows.filter(row =>
      row.some(cell => String(cell || '').toLowerCase().includes(query))
    );
    return [header, ...filtered];
  }, [sheetValues, sheetSearchQuery]);

  return (
    <div id="google-workspace-hub" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast Notification */}
      {notification && (
        <div
          id="workspace-notification-toast"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium transition-all transform animate-in slide-in-from-bottom duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : notification.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-indigo-50 text-indigo-800 border-indigo-200'
          }`}
        >
          {notification.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
          {notification.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
          {notification.type === 'info' && <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <Sparkles className="w-3.5 h-3.5" /> Official Google Workspace Integrations
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                OAuth Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Google Sheets & Google Forms Hub
            </h1>
            <p className="text-slate-600 text-sm sm:text-base mt-1 max-w-2xl">
              Seamlessly read, create, update spreadsheets and build Google Forms with live responses synchronization directly in your application.
            </p>
          </div>

          {/* Account Authentication Card */}
          <div className="shrink-0 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {user && token ? (
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google User'}
                    className="w-10 h-10 rounded-full border border-slate-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                    {user.email?.charAt(0).toUpperCase() || 'G'}
                  </div>
                )}
                <div className="text-left pr-2">
                  <div className="text-xs font-semibold text-slate-800 truncate max-w-[160px]">
                    {user.displayName || 'Google User'}
                  </div>
                  <div className="text-xs text-slate-500 truncate max-w-[160px]">{user.email}</div>
                </div>
                <button
                  id="workspace-sign-out-btn"
                  onClick={handleSignOut}
                  title="Sign out of Google"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="workspace-google-signin-btn"
                onClick={handleSignIn}
                disabled={isLoggingIn}
                className="gsi-material-button inline-flex items-center justify-center gap-3 px-5 py-2.5 rounded-xl bg-white border border-slate-300 shadow-sm hover:bg-slate-50 transition-all text-sm font-medium text-slate-700 disabled:opacity-60 cursor-pointer"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                </div>
                <span>{isLoggingIn ? 'Connecting...' : 'Connect Google Workspace'}</span>
              </button>
            )}
          </div>
        </div>

        {authError && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* Feature Navigation Tabs */}
        <div className="flex border-b border-slate-200 mt-6 gap-2">
          <button
            id="tab-btn-sheets"
            onClick={() => setActiveTab('sheets')}
            className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'sheets'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Google Sheets Studio</span>
            {spreadsheetsList.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800">
                {spreadsheetsList.length}
              </span>
            )}
          </button>

          <button
            id="tab-btn-forms"
            onClick={() => setActiveTab('forms')}
            className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'forms'
                ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-purple-600" />
            <span>Google Forms Builder & Responses</span>
            {formsList.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800">
                {formsList.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {!token ? (
        /* Sign-in prompt state */
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Authorize Google Sheets & Forms</h2>
          <p className="text-slate-600 text-sm max-w-md mx-auto mt-2 mb-6">
            Click the button below to connect your Google account. You will be able to create, read, and append to Google Sheets as well as create and inspect Google Forms.
          </p>
          <button
            id="workspace-connect-cta-btn"
            onClick={handleSignIn}
            disabled={isLoggingIn}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all text-sm cursor-pointer disabled:opacity-60"
          >
            <span>{isLoggingIn ? 'Connecting...' : 'Sign in with Google to Begin'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : activeTab === 'sheets' ? (
        /* ==================== SHEETS STUDIO ==================== */
        <div className="space-y-6">
          {/* Controls bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Spreadsheet Selector */}
            <div className="flex flex-1 items-center gap-3">
              <FolderOpen className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="flex-1 min-w-[200px]">
                <label htmlFor="spreadsheet-select" className="sr-only">Select Spreadsheet</label>
                <select
                  id="spreadsheet-select"
                  value={selectedSpreadsheetId}
                  onChange={(e) => handleSelectSpreadsheet(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="" disabled>-- Select a Spreadsheet from Drive --</option>
                  {spreadsheetsList.map((file) => (
                    <option key={file.id} value={file.id}>
                      {file.name} {file.modifiedTime ? `(Modified: ${new Date(file.modifiedTime).toLocaleDateString()})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <button
                id="refresh-sheets-list-btn"
                onClick={loadSpreadsheetsList}
                disabled={isLoadingSheetsList}
                title="Refresh Drive Spreadsheets"
                className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingSheetsList ? 'animate-spin text-emerald-600' : ''}`} />
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                id="new-sheet-modal-btn"
                onClick={() => setShowCreateSheetModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Spreadsheet</span>
              </button>

              {spreadsheetMetadata && (
                <>
                  <button
                    id="add-row-modal-btn"
                    onClick={() => {
                      const colCount = sheetValues[0]?.length || 4;
                      setNewRowValues(new Array(colCount).fill(''));
                      setShowAddRowModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-emerald-600" />
                    <span>Add Row</span>
                  </button>

                  <a
                    id="open-in-google-sheets-link"
                    href={spreadsheetMetadata.spreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/50 rounded-lg text-sm font-medium transition-colors"
                  >
                    <span>Open in Sheets</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Active Spreadsheet Workspace */}
          {selectedSpreadsheetId && spreadsheetMetadata ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Sheet Header & Tab Selector */}
              <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                    <Table className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{spreadsheetMetadata.title}</h3>
                    <div className="text-xs text-slate-500">ID: {spreadsheetMetadata.id}</div>
                  </div>
                </div>

                {/* Tab Switcher (Sheet tabs) */}
                <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-lg">
                  <span className="text-xs font-semibold text-slate-600 px-2">Tab:</span>
                  {spreadsheetMetadata.sheets.map((sheet) => (
                    <button
                      key={sheet.sheetId}
                      onClick={() => handleTabChange(sheet.title)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                        selectedSheetTab === sheet.title
                          ? 'bg-white text-emerald-800 shadow-sm font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {sheet.title}
                    </button>
                  ))}
                </div>

                {/* Search in Sheet */}
                <div className="relative min-w-[180px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search in sheet..."
                    value={sheetSearchQuery}
                    onChange={(e) => setSheetSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Data Table */}
              {isLoadingSheetData ? (
                <div className="p-16 text-center text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                  <p className="text-sm">Fetching cell data from Google Sheets...</p>
                </div>
              ) : filteredSheetRows.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <p className="text-sm font-medium">This sheet is currently empty.</p>
                  <p className="text-xs text-slate-400 mt-1">Use the "Add Row" button to write initial data.</p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 border-b border-slate-200 z-10">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center text-slate-400 border-r border-slate-200 font-mono">#</th>
                        {filteredSheetRows[0]?.map((colHeader, idx) => (
                          <th key={idx} className="py-2.5 px-4 border-r border-slate-200 last:border-r-0 whitespace-nowrap">
                            {colHeader || `Column ${idx + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSheetRows.slice(1).map((row, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 text-center text-slate-400 font-mono border-r border-slate-100">
                            {rowIdx + 1}
                          </td>
                          {filteredSheetRows[0]?.map((_, colIdx) => (
                            <td key={colIdx} className="py-2.5 px-4 border-r border-slate-100 last:border-r-0 text-slate-800 whitespace-nowrap">
                              {row[colIdx] !== undefined ? String(row[colIdx]) : ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Table Footer */}
              <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                <span>
                  Showing {Math.max(0, filteredSheetRows.length - 1)} row(s) in tab "{selectedSheetTab}"
                </span>
                <span className="text-emerald-700 font-medium">Google Sheets Live Sync Enabled</span>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
              <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-medium text-slate-700">No Spreadsheet Selected</p>
              <p className="text-xs text-slate-400 mt-1">
                Select an existing sheet from your Google Drive above or create a new one.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* ==================== FORMS STUDIO ==================== */
        <div className="space-y-6">
          {/* Controls bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Forms Selector */}
            <div className="flex flex-1 items-center gap-3">
              <FileText className="w-5 h-5 text-purple-600 shrink-0" />
              <div className="flex-1 min-w-[200px]">
                <label htmlFor="form-select" className="sr-only">Select Form</label>
                <select
                  id="form-select"
                  value={selectedFormId}
                  onChange={(e) => handleSelectForm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="" disabled>-- Select a Form from Drive --</option>
                  {formsList.map((file) => (
                    <option key={file.id} value={file.id}>
                      {file.name} {file.modifiedTime ? `(Modified: ${new Date(file.modifiedTime).toLocaleDateString()})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <button
                id="refresh-forms-list-btn"
                onClick={loadFormsList}
                disabled={isLoadingFormsList}
                title="Refresh Drive Forms"
                className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingFormsList ? 'animate-spin text-purple-600' : ''}`} />
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                id="new-form-modal-btn"
                onClick={() => setShowCreateFormModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Google Form</span>
              </button>

              {formDetails && (
                <button
                  id="export-responses-to-sheets-btn"
                  onClick={promptExportFormToSheet}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Export to Sheets</span>
                </button>
              )}
            </div>
          </div>

          {/* Form Details Workspace */}
          {selectedFormId && formDetails ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Form Banner */}
              <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{formDetails.info.title}</h2>
                    {formDetails.info.description && (
                      <p className="text-sm text-slate-600 mt-1">{formDetails.info.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                      <span>Form ID: {formDetails.formId}</span>
                      <span>•</span>
                      <span>Questions: {formDetails.items.length}</span>
                      <span>•</span>
                      <span className="font-semibold text-purple-700">{formResponses.length} Submissions</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      id="view-public-form-link"
                      href={formDetails.responderUri || `https://docs.google.com/forms/d/e/${formDetails.formId}/viewform`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
                    >
                      <span>Public Form</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <a
                      id="edit-in-google-forms-link"
                      href={`https://docs.google.com/forms/d/${formDetails.formId}/edit`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                    >
                      <span>Edit in Google</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      id="copy-form-url-btn"
                      onClick={() => copyToClipboard(formDetails.responderUri || `https://docs.google.com/forms/d/e/${formDetails.formId}/viewform`)}
                      className="p-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors"
                      title="Copy Public Form URL"
                    >
                      {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Sub-tabs: Questions vs Responses */}
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => setFormViewMode('questions')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      formViewMode === 'questions'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-white/80 text-slate-600 hover:bg-white'
                    }`}
                  >
                    Questions ({formDetails.items.length})
                  </button>

                  <button
                    onClick={() => setFormViewMode('responses')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      formViewMode === 'responses'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-white/80 text-slate-600 hover:bg-white'
                    }`}
                  >
                    Live Responses ({formResponses.length})
                  </button>
                </div>
              </div>

              {/* View Content */}
              {isLoadingFormData ? (
                <div className="p-16 text-center text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-600 mb-2" />
                  <p className="text-sm">Fetching form configuration & responses...</p>
                </div>
              ) : formViewMode === 'questions' ? (
                <div className="p-6 space-y-3">
                  {formDetails.items.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      <p className="text-sm">No questions in this form yet.</p>
                    </div>
                  ) : (
                    formDetails.items.map((item, idx) => (
                      <div
                        key={item.itemId || idx}
                        className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-purple-200 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-400">Q{idx + 1}.</span>
                              <h4 className="font-semibold text-slate-900 text-sm">{item.title}</h4>
                              {item.questionItem?.question.required && (
                                <span className="text-rose-500 text-xs font-bold">*</span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs text-slate-500 mt-1 pl-6">{item.description}</p>
                            )}

                            {/* Options preview for choices */}
                            {item.questionItem?.question.choiceQuestion?.options && (
                              <div className="mt-2.5 pl-6 flex flex-wrap gap-1.5">
                                {item.questionItem.question.choiceQuestion.options.map((opt, oIdx) => (
                                  <span
                                    key={oIdx}
                                    className="inline-block px-2.5 py-0.5 bg-white border border-slate-200 rounded-md text-xs text-slate-700"
                                  >
                                    {opt.value}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-md text-[11px] font-medium shrink-0">
                            {item.questionItem?.question.choiceQuestion?.type ||
                              (item.questionItem?.question.textQuestion?.paragraph ? 'Paragraph' : 'Short Answer')}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* Submissions table */
                <div className="p-6">
                  {formResponses.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                      <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-700">No Responses Submitted Yet</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Share the Public Form link to begin collecting responses. Submissions will automatically appear here!
                      </p>
                      <a
                        href={formDetails.responderUri}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-medium shadow-sm hover:bg-purple-700"
                      >
                        <span>Open Public Form</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3 border-r border-slate-200">#</th>
                            <th className="py-2.5 px-3 border-r border-slate-200">Submitted At</th>
                            <th className="py-2.5 px-3 border-r border-slate-200">Respondent</th>
                            {formDetails.items.filter(i => i.questionItem).map((q, idx) => (
                              <th key={idx} className="py-2.5 px-4 border-r border-slate-200 last:border-r-0 whitespace-nowrap">
                                {q.title}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {formResponses.map((r, rIdx) => (
                            <tr key={r.responseId || rIdx} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-mono text-slate-400 border-r border-slate-100">{rIdx + 1}</td>
                              <td className="py-2.5 px-3 text-slate-600 border-r border-slate-100 whitespace-nowrap">
                                {new Date(r.lastSubmittedTime || r.createTime).toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-slate-700 border-r border-slate-100 whitespace-nowrap">
                                {r.respondentEmail || 'Anonymous'}
                              </td>
                              {formDetails.items.filter(i => i.questionItem).map((q, qIdx) => {
                                const qId = q.questionItem?.question.questionId;
                                const ans = qId && r.answers ? r.answers[qId] : null;
                                const val = ans?.textAnswers?.answers?.map(a => a.value).join(', ') || '-';
                                return (
                                  <td key={qIdx} className="py-2.5 px-4 border-r border-slate-100 last:border-r-0 text-slate-800 whitespace-nowrap">
                                    {val}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-medium text-slate-700">No Google Form Selected</p>
              <p className="text-xs text-slate-400 mt-1">
                Select an existing form from your Google Drive above or create a new one.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ==================== CREATE SPREADSHEET MODAL ==================== */}
      {showCreateSheetModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Create Google Spreadsheet</h3>
              </div>
              <button
                onClick={() => setShowCreateSheetModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Spreadsheet Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cricket Tournament Scores 2026"
                  value={newSheetTitle}
                  onChange={(e) => setNewSheetTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Starter Template & Headers
                </label>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="sheetTemplate"
                      checked={newSheetTemplate === 'cricket'}
                      onChange={() => setNewSheetTemplate('cricket')}
                      className="mt-1 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Cricket Tournament Match Ledger</div>
                      <div className="text-[11px] text-slate-500">Headers: Match ID, Date, Teams, Toss, Result, Man of the Match</div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="sheetTemplate"
                      checked={newSheetTemplate === 'members'}
                      onChange={() => setNewSheetTemplate('members')}
                      className="mt-1 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Player / Member Registration Directory</div>
                      <div className="text-[11px] text-slate-500">Headers: Reg ID, Full Name, Role, Mobile, Village, Status</div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="sheetTemplate"
                      checked={newSheetTemplate === 'custom'}
                      onChange={() => setNewSheetTemplate('custom')}
                      className="mt-1 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Blank Spreadsheet</div>
                      <div className="text-[11px] text-slate-500">Generic columns A, B, C, D</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateSheetModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={promptCreateSpreadsheet}
                disabled={isCreatingSheet || !newSheetTitle.trim()}
                className="px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-60 cursor-pointer shadow-sm"
              >
                {isCreatingSheet ? 'Creating...' : 'Create Spreadsheet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CREATE GOOGLE FORM MODAL ==================== */}
      {showCreateFormModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-base">Create Google Form</h3>
              </div>
              <button
                onClick={() => setShowCreateFormModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Form Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cricket Tournament Player Registration"
                  value={newFormTitle}
                  onChange={(e) => setNewFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Template with Preset Questions
                </label>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="formTemplate"
                      checked={newFormTemplate === 'cricket_reg'}
                      onChange={() => setNewFormTemplate('cricket_reg')}
                      className="mt-1 text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Cricket Tournament Registration</div>
                      <div className="text-[11px] text-slate-500">Player Name, Mobile, Role (Batter/Bowler/Allrounder), Style, Village</div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="formTemplate"
                      checked={newFormTemplate === 'feedback'}
                      onChange={() => setNewFormTemplate('feedback')}
                      className="mt-1 text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Feedback & Rating Survey</div>
                      <div className="text-[11px] text-slate-500">Respondent Name, Rating Choice, Detailed Suggestions</div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="formTemplate"
                      checked={newFormTemplate === 'blank'}
                      onChange={() => setNewFormTemplate('blank')}
                      className="mt-1 text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Blank Form</div>
                      <div className="text-[11px] text-slate-500">Empty form to customize manually in Google Forms editor</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateFormModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={promptCreateForm}
                disabled={isCreatingForm || !newFormTitle.trim()}
                className="px-4 py-2 text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-60 cursor-pointer shadow-sm"
              >
                {isCreatingForm ? 'Creating...' : 'Create Form'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ADD ROW MODAL ==================== */}
      {showAddRowModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Table className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Append Row to {spreadsheetMetadata?.title} ({selectedSheetTab})
                </h3>
              </div>
              <button
                onClick={() => setShowAddRowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {(sheetValues[0] || ['Col 1', 'Col 2', 'Col 3', 'Col 4']).map((colName, idx) => (
                <div key={idx}>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {colName || `Column ${idx + 1}`}
                  </label>
                  <input
                    type="text"
                    value={newRowValues[idx] || ''}
                    onChange={(e) => {
                      const updated = [...newRowValues];
                      updated[idx] = e.target.value;
                      setNewRowValues(updated);
                    }}
                    placeholder={`Enter ${colName || 'value'}...`}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddRowModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={promptAddRow}
                disabled={isAddingRow}
                className="px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-60 cursor-pointer shadow-sm"
              >
                {isAddingRow ? 'Appending...' : 'Confirm & Append'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MANDATORY DESTRUCTIVE/MUTATING OPERATION CONFIRMATION MODAL ==================== */}
      {confirmationConfig.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <div className="p-2 bg-amber-50 rounded-xl border border-amber-200">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">{confirmationConfig.title}</h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
              {confirmationConfig.message}
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmationConfig(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmationConfig.onConfirm}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                {confirmationConfig.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

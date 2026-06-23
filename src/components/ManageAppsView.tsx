import React, { useState, FormEvent, DragEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppItem, UserItem } from '../types';
import { getGoogleAccessToken, loginWithGoogle } from '../firebase';
import {
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  X,
  ExternalLink,
  Laptop,
  Check,
  Rocket,
  FileSpreadsheet,
  Download,
  RefreshCw,
  FileText,
  AlertTriangle,
  UploadCloud,
  Info,
  Layers,
  Database
} from 'lucide-react';
import AppIcon from './AppIcon';

interface ManageAppsViewProps {
  apps: AppItem[];
  currentUser: UserItem;
  onAddApp: (app: Omit<AppItem, 'id' | 'createdAt'>) => void;
  onEditApp: (appId: string, updatedFields: Partial<AppItem>) => void;
  onDeleteApp: (appId: string) => void;
  onQuickToggleStatus: (appId: string) => void;
  isOpenAddDirectly: boolean;
  onCloseDirectAdd: () => void;
}

const AVAILABLE_ICONS = [
  'BookOpen',
  'DollarSign',
  'FileText',
  'Library',
  'CheckSquare',
  'GraduationCap',
  'Sparkles',
  'Award',
  'Calendar',
  'Layers',
  'LineChart',
  'Grid',
  'Users',
  'Security',
  'Laptop'
];

const PRESET_CATEGORIES = [
  'Pembelajaran',
  'Administrasi',
  'Evaluasi',
  'Perpustakaan',
  'Utilitas',
  'Lainnya'
];

export default function ManageAppsView({
  apps,
  currentUser,
  onAddApp,
  onEditApp,
  onDeleteApp,
  onQuickToggleStatus,
  isOpenAddDirectly,
  onCloseDirectAdd,
}: ManageAppsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Sub-Tab Navigation
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'spreadsheet'>('list');

  // Spreadsheet Sync States
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [isFetchingSheet, setIsFetchingSheet] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [pastedSheetText, setPastedSheetText] = useState('');
  const [parsedApps, setParsedApps] = useState<Omit<AppItem, 'id' | 'createdAt'>[]>([]);
  const [selectedSyncIndices, setSelectedSyncIndices] = useState<number[]>([]);
  const [syncConflictResolution, setSyncConflictResolution] = useState<'update' | 'skip'>('update');
  const [sheetSyncError, setSheetSyncError] = useState<string | null>(null);
  const [sheetSyncSuccess, setSheetSyncSuccess] = useState<string | null>(null);
  const [isDragOverSheet, setIsDragOverSheet] = useState(false);

  // Helper parser for sheets row arrays
  const parseRowsToApps = (rows: string[][]) => {
    setSheetSyncError(null);
    setSheetSyncSuccess(null);
    if (!rows || rows.length === 0) {
      setSheetSyncError('Teks data kosong! Sila isikan baris kolum spreadsheet.');
      return;
    }

    try {
      // Check if first row is a header
      let startIdx = 0;
      const firstRowStr = rows[0].join(' ').toLowerCase();
      const hasHeader = firstRowStr.includes('nama') || 
                        firstRowStr.includes('aplikasi') || 
                        firstRowStr.includes('kategori') || 
                        firstRowStr.includes('deskripsi') || 
                        firstRowStr.includes('url') || 
                        firstRowStr.includes('tautan');
      
      if (hasHeader) {
        startIdx = 1; // skip header row
      }

      const tempApps: Omit<AppItem, 'id' | 'createdAt'>[] = [];
      
      for (let i = startIdx; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 2) continue; // skip rows with too few cells

        // Map cells intelligently
        const appName = row[0]?.trim();
        if (!appName) continue;

        // Default or fallbacks
        const appCategory = row[1]?.trim() || 'Pembelajaran';
        const appDesc = row[2]?.trim() || 'Daftar modul aplikasi diimpor luar.';
        const appUrl = row[3]?.trim() || 'https://';
        const appIcon = row[4]?.trim() || 'BookOpen';

        const categoryValidated = PRESET_CATEGORIES.includes(appCategory) ? appCategory : 'Lainnya';
        const iconValidated = AVAILABLE_ICONS.includes(appIcon) ? appIcon : 'BookOpen';

        tempApps.push({
          name: appName,
          category: categoryValidated,
          description: appDesc,
          url: appUrl,
          status: 'active',
          icon: iconValidated,
        });
      }

      if (tempApps.length === 0) {
        setSheetSyncError('Format tidak sesuai. Pastikan kolom pertama adalah Nama Aplikasi, kolom kedua Kategori, dst.');
      } else {
        setParsedApps(tempApps);
        // select all indices by default
        setSelectedSyncIndices(tempApps.map((_, index) => index));
        setSheetSyncSuccess(`Berhasil mem-parsing ${tempApps.length} aplikasi dari spreadsheet! Sila periksa pratinjau di bawah.`);
      }
    } catch (err: any) {
      setSheetSyncError(`Gagal membaca data: ${err?.message || err}`);
    }
  };

  // Parse raw tab-separated or comma-separated CSV text
  const parseRawTextToApps = (text: string) => {
    setSheetSyncError(null);
    setSheetSyncSuccess(null);
    if (!text.trim()) {
      setSheetSyncError('Teks data kosong! Sila isikan baris kolum spreadsheet.');
      return;
    }

    try {
      const rows: string[][] = [];
      const lines = text.split(/\r?\n/);
      
      for (const line of lines) {
        if (!line.trim()) continue;
        const tabsCount = (line.match(/\t/g) || []).length;
        const commasCount = (line.match(/,/g) || []).length;
        
        let parts: string[] = [];
        if (tabsCount > commasCount) {
          parts = line.split('\t');
        } else {
          // split commas but ignore commas inside double-quotes
          const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
          parts = matches.map(p => p.replace(/^"|"$/g, '').trim());
        }
        rows.push(parts);
      }

      parseRowsToApps(rows);
    } catch (err: any) {
      setSheetSyncError(`Gagal membaca data spreadsheet: ${err?.message || err}`);
    }
  };

  const handleFetchSpreadsheet = async () => {
    if (!spreadsheetUrl.trim()) {
      alert('Sila masukkan tautan link spreadsheet atau Spreadsheet ID terlebih dahulu!');
      return;
    }
    
    setIsFetchingSheet(true);
    setSheetSyncError(null);
    setSheetSyncSuccess(null);

    const match = spreadsheetUrl.trim().match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const spreadsheetId = match ? match[1] : spreadsheetUrl.trim();

    const token = getGoogleAccessToken();

    if (token) {
      // Use official Google Sheets API securely
      try {
        const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:E150`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error('Akses Google Sheets ditolak. Sesi otorisasi Anda mungkin kedaluwarsa. Silakan hubungkan ulang akun Google Sheets.');
          }
          throw new Error(`Google Sheets API mengembalikan status error ${response.status}`);
        }

        const data = await response.json();
        const rows: string[][] = data.values;
        if (!rows || rows.length === 0) {
          throw new Error('Tidak ada baris data ditemukan di dokumen spreadsheet.');
        }

        parseRowsToApps(rows);
      } catch (e: any) {
        console.error(e);
        setSheetSyncError(e.message || 'Gagal memuat spreadsheet privat Anda menggunakan Google API.');
      } finally {
        setIsFetchingSheet(false);
      }
    } else {
      // Fallback: Public export download path
      let targetUrl = spreadsheetUrl.trim();
      if (match && match[1]) {
        targetUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
      }
      try {
        const response = await fetch(targetUrl);
        if (!response.ok) {
          throw new Error('Gagal mengunduh berkas Spreadsheet publik. Pastikan diset "Siapa saja yang memiliki link" (Public).');
        }
        const rawText = await response.text();
        parseRawTextToApps(rawText);
      } catch (e: any) {
        console.error(e);
        setSheetSyncError(
          `CORS / Akses Terblokir: ${e?.message || 'Koneksi gagal'} - Ini dipicu karena Google Sheets bersifat privat atau pembatasan CORS browser. Silakan lakukan otorisasi Google Sheets di pojok kanan atas agar dapat membaca dokumen privat secara instan menggunakan token otorisasi.`
        );
      } finally {
        setIsFetchingSheet(false);
      }
    }
  };

  const handleExportToGoogleSheets = async () => {
    const token = getGoogleAccessToken();
    if (!token) {
      alert("Silakan hubungkan/otorisasi akun Google Firebase Anda (di pojok kanan atas) terlebih dahulu untuk mengisi token Google Sheets Anda.");
      return;
    }

    const confirmExport = confirm(`Apakah Anda yakin ingin mengekspor seluruh ${apps.length} daftar aplikasi terdaftar ke dalam Google Sheets baru di akun Drive Anda?`);
    if (!confirmExport) return;

    try {
      setIsExporting(true);
      setSheetSyncError(null);
      setSheetSyncSuccess(null);

      // 1. Create a spreadsheet
      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            title: `EduDigital - Daftar Aplikasi (${new Date().toLocaleDateString('id-ID')})`
          }
        })
      });

      if (!createRes.ok) {
        const errDetail = await createRes.text();
        throw new Error(`Gagal membuat Spreadsheet: ${createRes.status} ${errDetail || createRes.statusText}`);
      }

      const createdSheet = await createRes.json();
      const spreadsheetId = createdSheet.spreadsheetId;
      const spreadsheetUrl = createdSheet.spreadsheetUrl;

      // 2. Prepare rows
      const header = ["Nama Aplikasi", "Kategori", "Deskripsi Singkat", "Tautan URL", "Preset Ikon"];
      const rows = apps.map(app => [app.name, app.category, app.description, app.url, app.icon]);
      const values = [header, ...rows];

      // 3. Write data
      const writeRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: values
        })
      });

      if (!writeRes.ok) {
        const errDetail = await writeRes.text();
        throw new Error(`Gagal mengisi Spreadsheet: ${writeRes.status} ${errDetail}`);
      }

      setSheetSyncSuccess(`Sukses mengekspor daftar aplikasi! Google Spreadsheet baru Anda telah berhasil dibuat di Google Drive. URL: ${spreadsheetUrl}`);
      
      // Open sheet in a new tab elegantly
      if (window.confirm(`Spreadsheet berhasil dibuat!\nApakah Anda ingin membukanya sekarang?\n\nURL: ${spreadsheetUrl}`)) {
        window.open(spreadsheetUrl, '_blank');
      }
    } catch (err: any) {
      console.error(err);
      setSheetSyncError(`Gagal mengekspor data ke Google Sheets: ${err.message || err}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDragOverSheet = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragOverSheet(true);
    } else if (e.type === 'dragleave') {
      setIsDragOverSheet(false);
    }
  };

  const handleDropSheet = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverSheet(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt') && !file.name.endsWith('.tsv')) {
        alert('Format berkas tidak didukung! Sila unggah berkas .csv, .tsv, atau .txt.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === 'string') {
          parseRawTextToApps(event.target.result);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileChangeSheet = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === 'string') {
          parseRawTextToApps(event.target.result);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleToggleSelectIndex = (idx: number) => {
    if (selectedSyncIndices.includes(idx)) {
      setSelectedSyncIndices(selectedSyncIndices.filter(i => i !== idx));
    } else {
      setSelectedSyncIndices([...selectedSyncIndices, idx]);
    }
  };

  const handleSyncAllApps = () => {
    if (selectedSyncIndices.length === 0) {
      alert('Sila pilih setidaknya satu aplikasi untuk disinkronisasi.');
      return;
    }

    let addedCount = 0;
    let editedCount = 0;

    selectedSyncIndices.forEach((idx) => {
      const parsed = parsedApps[idx];
      // Check if an app with this name already exists
      const existingMatch = apps.find(
        (a) => a.name.toLowerCase().trim() === parsed.name.toLowerCase().trim()
      );

      if (existingMatch) {
        if (syncConflictResolution === 'update') {
          onEditApp(existingMatch.id, parsed);
          editedCount++;
        }
        // if skip, do nothing
      } else {
        onAddApp(parsed);
        addedCount++;
      }
    });

    alert(
      `Sinkronisasi berhasil! Berhasil menambahkan ${addedCount} aplikasi baru, memodifikasi/memperbarui ${editedCount} aplikasi yang cocok.`
    );
    
    // reset parsed list and go switch back to normal list subtab
    setParsedApps([]);
    setSelectedSyncIndices([]);
    setPastedSheetText('');
    setSpreadsheetUrl('');
    setActiveSubTab('list');
  };
  
  // Interactive form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [deleteConfirmApp, setDeleteConfirmApp] = useState<AppItem | null>(null);
  
  // App Schema form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Pembelajaran');
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [icon, setIcon] = useState('BookOpen');

  // Trigger modal for New App
  const openNewAppModal = () => {
    setEditingAppId(null);
    setName('');
    setDescription('');
    setCategory('Pembelajaran');
    setUrl('');
    setStatus('active');
    setIcon('BookOpen');
    setIsModalOpen(true);
  };

  // Trigger modal for Edit App
  const openEditAppModal = (app: AppItem) => {
    setEditingAppId(app.id);
    setName(app.name);
    setDescription(app.description);
    setCategory(app.category);
    setUrl(app.url);
    setStatus(app.status);
    setIcon(app.icon);
    setIsModalOpen(true);
  };

  // Handle outside direct open triggers
  React.useEffect(() => {
    if (isOpenAddDirectly) {
      onCloseDirectAdd();
      openNewAppModal();
    }
  }, [isOpenAddDirectly, onCloseDirectAdd]);

  // Handle Form Submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('Masukkan Nama Aplikasi');
    if (!description.trim()) return alert('Masukkan Deskripsi Singkat');
    if (!url.trim()) return alert('Masukkan Tautan URL');

    const appData = {
      name: name.trim(),
      description: description.trim(),
      category,
      url: url.trim(),
      status,
      icon,
    };

    if (editingAppId) {
      onEditApp(editingAppId, appData);
    } else {
      onAddApp(appData);
    }

    setIsModalOpen(false);
  };

  // Filter application table lists
  const filteredApps = apps.filter((app) =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12" id="manage-apps-container">
      {/* Sub tabs navigation */}
      <div className="flex border border-slate-200/60 bg-slate-50 p-1 rounded-2xl gap-2 max-w-md">
        <button
          onClick={() => setActiveSubTab('list')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeSubTab === 'list'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-650 hover:bg-slate-200/50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Daftar Aplikasi ({apps.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('spreadsheet')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeSubTab === 'spreadsheet'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-650 hover:bg-slate-200/50'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Sinkronisasi Spreadsheet</span>
        </button>
      </div>

      {activeSubTab === 'list' ? (
        <>
          {/* Search and Action Bar */}
          <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 text-slate-400" />
              </span>
              <input
                type="text"
                placeholder="Cari nama atau kategori aplikasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm transition-all text-slate-700"
                id="manage-apps-search-input"
              />
            </div>

            {currentUser.role !== 'Viewer' ? (
              <button
                onClick={openNewAppModal}
                className="px-4 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition flex items-center justify-center cursor-pointer shadow-sm shadow-blue-500/10"
                id="btn-trigger-add-app"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Tambah Aplikasi
              </button>
            ) : (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 px-3 py-2 rounded-xl font-medium">
                Hak akses Viewer hanya mengizinkan pembacaan data.
              </p>
            )}
          </section>

          {/* Applications list Table container */}
          <section className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" id="manage-apps-table">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-4 pl-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Aplikasi</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Kategori</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Tautan Target</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Tanggal Dibuat</th>
                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Status</th>
                    <th className="p-4 pr-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredApps.map((app) => {
                    const isActive = app.status === 'active';
                    return (
                      <tr key={app.id} className="hover:bg-slate-50/65 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="flex items-center space-x-3.5">
                            <div className={`p-2.5 rounded-xl ${
                              isActive ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'
                            }`}>
                              <AppIcon name={app.icon} className="w-5.5 h-5.5" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm leading-tight">{app.name}</p>
                              <p className="text-xs text-slate-500 mt-1 max-w-[280px] truncate">{app.description}</p>
                            </div>
                          </div>
                        </td>
                        
                        <td className="p-4">
                          <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 border border-slate-200 text-slate-500 rounded-full">
                            {app.category}
                          </span>
                        </td>

                        <td className="p-4 text-xs text-slate-500 font-mono">
                          <a href={app.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 flex items-center space-x-1 hover:underline">
                            <span className="truncate max-w-[150px]">{app.url}</span>
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </a>
                        </td>

                        <td className="p-4 text-xs text-slate-500">
                          {new Date(app.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </td>

                        <td className="p-4 text-center">
                          <button
                            onClick={() => currentUser.role !== 'Viewer' && onQuickToggleStatus(app.id)}
                            disabled={currentUser.role === 'Viewer'}
                            className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide transition uppercase shadow-xs ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100'
                            } ${currentUser.role === 'Viewer' ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
                          >
                            {isActive ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Aktif</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Nonaktif</span>
                              </>
                            )}
                          </button>
                        </td>

                        <td className="p-4 pr-6 text-right">
                          {currentUser.role !== 'Viewer' ? (
                            <div className="inline-flex space-x-1">
                              <button
                                onClick={() => openEditAppModal(app)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Aplikasi"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmApp(app)}
                                className="p-1.5 text-slate-400 hover:text-red-650 hover:text-red-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Aplikasi"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No access</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredApps.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 p-4 text-slate-400">
                        <Rocket className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="text-sm font-semibold">Tidak ada modul aplikasi ditemukan</p>
                        <p className="text-xs text-slate-400 mt-1">Coba bersihkan atau gunakan string pencarian lain.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <div className="space-y-6 animate-fade-in" id="spreadsheet-sync-wrapper">
          {/* Guide section */}
          <div className="bg-slate-50 border border-slate-200/70 p-5 rounded-2xl flex flex-col md:flex-row gap-5 items-start">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-850 text-sm">Panduan Format Kolom Spreadsheet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
                Untuk sinkronisasi yang sukses, susun kolom dokumen Excel atau Google Sheets Anda seperti skema berikut ini (atau unduh template CSV). Program akan memetakan baris secara otomatis:
              </p>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                <div className="p-2 bg-white rounded-xl border border-slate-100"><p className="text-[10px] text-slate-400 uppercase font-bold">Kolom A (1)</p><p className="text-xs font-bold text-blue-650 mt-0.5">Nama Aplikasi</p></div>
                <div className="p-2 bg-white rounded-xl border border-slate-100"><p className="text-[10px] text-slate-400 uppercase font-bold">Kolom B (2)</p><p className="text-xs font-bold text-slate-700 mt-0.5">Kategori</p></div>
                <div className="p-2 bg-white rounded-xl border border-slate-100"><p className="text-[10px] text-slate-400 uppercase font-bold">Kolom C (3)</p><p className="text-xs font-bold text-slate-700 mt-0.5">Deskripsi Singkat</p></div>
                <div className="p-2 bg-white rounded-xl border border-slate-100"><p className="text-[10px] text-slate-400 uppercase font-bold">Kolom D (4)</p><p className="text-xs font-bold text-slate-700 mt-0.5">Tautan URL</p></div>
                <div className="p-2 bg-white rounded-xl border border-slate-100"><p className="text-[10px] text-slate-400 uppercase font-bold">Kolom E (5)</p><p className="text-xs font-bold text-slate-700 mt-0.5">Ikon (Lucide)</p></div>
              </div>
            </div>
          </div>

          {/* Input sources side-by-side grids */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Box: Online Google Sheet URL Fetch */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Database className="w-5 h-5 text-blue-650" />
                  <h4 className="font-bold text-slate-850 text-sm">Metode A: Hubungkan Google Sheets secara Instan</h4>
                </div>
                {getGoogleAccessToken() ? (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-extrabold uppercase rounded-full tracking-wider animate-pulse border border-emerald-100">
                    Sesi Aktif
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-extrabold uppercase rounded-full tracking-wider border border-amber-105">
                    Mode Terbatas
                  </span>
                )}
              </div>

              {getGoogleAccessToken() ? (
                <p className="text-xs text-slate-500 bg-emerald-50/40 border border-emerald-100 p-3 rounded-xl leading-relaxed">
                  <strong>Otorisasi Google Terhubung!</strong> Anda dapat memasukkan tautan Google Sheets privat milik Anda sendiri secara langsung. Sistem akan menarik data secara aman menggunakan API resmi Google Sheets.
                </p>
              ) : (
                <p className="text-xs text-slate-400 leading-normal">
                  Pastikan dokumen Google Sheets Anda diset ke status akses <strong>&ldquo;Siapa saja yang memiliki link&rdquo; (Public)</strong> agar sistem dapat memuat isinya secara publik, ATAU hubungkan email Anda menggunakan Google Sign-In (di pojok kanan atas) untuk akses instan ke sheet privat Anda.
                </p>
              )}
              
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tautan Google Sheets / URL CSV</label>
                <div className="flex gap-2 font-sans">
                  <input
                    type="text"
                    value={spreadsheetUrl}
                    onChange={(e) => setSpreadsheetUrl(e.target.value)}
                    placeholder="Masukkan Tautan URL Google Sheets..."
                    className="block flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-sans"
                  />
                  <button
                    onClick={handleFetchSpreadsheet}
                    disabled={isFetchingSheet}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs rounded-xl transition flex items-center cursor-pointer shadow-xs"
                  >
                    {isFetchingSheet ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                        Sedang Menghubungi...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-1.5" />
                        Tarik Data
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Export to Google Sheets Actions */}
              <div className="pt-2 border-t border-slate-100/70">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Aksi Ekspor Aplikasi</p>
                <button
                  onClick={handleExportToGoogleSheets}
                  disabled={isExporting}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs rounded-xl transition flex items-center justify-center cursor-pointer shadow-sm shadow-emerald-500/10"
                >
                  {isExporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                      Mengekspor seluruh aplikasi ke Google Sheets...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Ekspor Seluruh {apps.length} Aplikasi ke Google Sheets Baru
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Box: Drag and drop manual CSV / TSV file or Paste Data */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center space-x-2.5">
                <UploadCloud className="w-5 h-5 text-indigo-600" />
                <h4 className="font-bold text-slate-850 text-sm">Metode B: Unggah .CSV atau Tempel Baris Spreadsheet</h4>
              </div>
              
              {/* Drag and drop area */}
              <div
                onDragEnter={handleDragOverSheet}
                onDragOver={handleDragOverSheet}
                onDragLeave={handleDragOverSheet}
                onDrop={handleDropSheet}
                className={`border-2 border-dashed rounded-xl p-4 text-center transition cursor-pointer relative ${
                  isDragOverSheet
                    ? 'border-indigo-500 bg-indigo-50/50'
                    : 'border-slate-200 hover:border-indigo-400 bg-slate-50/30'
                }`}
              >
                <input
                  type="file"
                  accept=".csv,.txt,.tsv"
                  onChange={handleFileChangeSheet}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                  title=""
                />
                <p className="text-xs font-bold text-slate-700">Seret file .CSV di sini atau <span className="text-indigo-600 underline">Pilih berkas</span></p>
                <p className="text-[10px] text-slate-400 mt-0.5">Format file dokumen CSV dipisahkan koma atau tab.</p>
              </div>

              {/* Paste box Area */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-400 tracking-wider uppercase">Atau Paste baris langsung dari Google Sheets / Excel</label>
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={pastedSheetText}
                    onChange={(e) => setPastedSheetText(e.target.value)}
                    placeholder="Salin baris dari Google Sheets anda lalu paste di sini..."
                    className="block flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                  <button
                    onClick={() => parseRawTextToApps(pastedSheetText)}
                    className="px-3 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center cursor-pointer shadow-xs self-end"
                  >
                    Proses
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Error and Success notifications */}
          {sheetSyncError && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold">Gagal memproses data:</p>
                <p className="mt-0.5 leading-relaxed">{sheetSyncError}</p>
              </div>
            </div>
          )}

          {sheetSyncSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs flex items-start gap-2.5">
              <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold">Berhasil Diuraikan!</p>
                <p className="mt-0.5 leading-relaxed">{sheetSyncSuccess}</p>
              </div>
            </div>
          )}

          {/* Match & Parse result preview table panel */}
          {parsedApps.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden pb-4 space-y-4">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Pratinjau Sinkronisasi Aplikasi ({selectedSyncIndices.length} terpilih dari {parsedApps.length})</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Beri tanda centang untuk menyalin atau mengedit langsung.</p>
                </div>

                {/* Conflict handler policy options */}
                <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bila nama cocok:</span>
                  <select
                    value={syncConflictResolution}
                    onChange={(e) => setSyncConflictResolution(e.target.value as 'update' | 'skip')}
                    className="text-xs border-0 py-0.5 pl-1 pr-6 font-bold text-slate-700 bg-white focus:outline-hidden cursor-pointer"
                  >
                    <option value="update">Perbarui Aplikasi Lama (Edit)</option>
                    <option value="skip">Bypass / Lewati Saja</option>
                  </select>
                </div>
              </div>

              {/* Data candidates table */}
              <div className="overflow-x-auto px-5">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-widest font-extrabold text-[10px]">
                      <th className="p-3 pl-1 text-center w-12">Pilih</th>
                      <th className="p-3 font-bold">Nama Modul</th>
                      <th className="p-3">Kategori</th>
                      <th className="p-3">Deskripsi Singkat</th>
                      <th className="p-3">URL</th>
                      <th className="p-3 w-28">Ikon Preset</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {parsedApps.map((candidate, idx) => {
                      const isSelected = selectedSyncIndices.includes(idx);
                      const isConflict = apps.some(a => a.name.toLowerCase().trim() === candidate.name.toLowerCase().trim());
                      return (
                        <tr key={idx} className={`hover:bg-slate-50/60 transition ${isSelected ? 'bg-blue-50/25' : ''}`}>
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectIndex(idx)}
                              className="w-4.5 h-4.5 text-blue-600 bg-slate-100 rounded-lg cursor-pointer"
                            />
                          </td>
                          <td className="p-3 font-bold text-slate-800">
                            <span className="flex items-center gap-1.5">
                              {candidate.name}
                              {isConflict && (
                                <span className="px-1.5 py-0.2 bg-amber-150 text-amber-800 font-extrabold text-[8px] rounded uppercase tracking-wider" title="Nama modul ini sudah terdaftar. Akan diperbarui jika disetujui.">
                                  Tabrakan Nama
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-slate-100 border border-slate-250/20 rounded-full text-[10px] text-slate-650 font-bold block w-fit">
                              {candidate.category}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 max-w-xs truncate">{candidate.description}</td>
                          <td className="p-3 text-slate-450 font-mono truncate max-w-[120px]">{candidate.url}</td>
                          <td className="p-3 text-slate-500 font-mono flex items-center gap-1.5">
                            <AppIcon name={candidate.icon} className="w-4 h-4 text-slate-500 flex-shrink-0" />
                            <span className="truncate max-w-[65px]">{candidate.icon}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Confirm submit pane */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 px-5">
                <button
                  onClick={() => {
                    setParsedApps([]);
                    setSelectedSyncIndices([]);
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Bersihkan Pratinjau
                </button>
                <button
                  onClick={handleSyncAllApps}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl transition flex items-center shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  Sinkronisasikan {selectedSyncIndices.length} Item Terpilih
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dynamic Modal Overlay for Add / Edit App */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden"
              id="app-management-modal"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-slate-800 text-base">
                  {editingAppId ? 'Sesuaikan Informasi Aplikasi' : 'Tambah Modul Aplikasi Baru'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Nama Aplikasi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: EduLearn, Presensi Online"
                    className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-700"
                    id="form-app-name"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Deskripsi Ringkas <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Maksimal 2 kalimat singkat mengenai kegunaan aplikasi ini..."
                    className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-700"
                    id="form-app-description"
                  />
                </div>

                {/* Sub row: Category, Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Kategori <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-700 bg-white"
                      id="form-app-category"
                    >
                      {PRESET_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Status Modul <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                      className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-700 bg-white"
                      id="form-app-status"
                    >
                      <option value="active">Aktif (Tersedia)</option>
                      <option value="inactive">Nonaktif (Draft)</option>
                    </select>
                  </div>
                </div>

                {/* URL */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Tautan Akses URL / API <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com atau #endpoint"
                    className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-700 font-mono"
                    id="form-app-url"
                  />
                </div>

                {/* Icon Picker list */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Pilih Representasi Ikon <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50 style-scrollbar" id="form-app-icon-grid">
                    {AVAILABLE_ICONS.map((icName) => {
                      const selected = icon === icName;
                      return (
                        <button
                          key={icName}
                          type="button"
                          onClick={() => setIcon(icName)}
                          className={`p-2.5 rounded-lg flex flex-col items-center justify-center border transition cursor-pointer ${
                            selected
                              ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100/50'
                          }`}
                          title={icName}
                        >
                          <AppIcon name={icName} className="w-5 h-5" />
                          <span className="text-[8px] mt-1 truncate max-w-full">{icName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Actions Bottom panel */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3 bg-slate-50/50 -mx-6 -mb-6 p-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-100 transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition flex items-center shadow-xs cursor-pointer"
                  >
                    <Check className="w-4 h-4 mr-1.5" />
                    {editingAppId ? 'Simpan Perubahan' : 'Daftarkan Modul'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" id="app-delete-confirm-overlay">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full overflow-hidden p-6 text-center space-y-4"
              id="app-delete-confirm-modal"
            >
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center mx-auto" id="app-delete-icon">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base" id="app-delete-title">Hapus Aplikasi?</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed" id="app-delete-desc">
                  Apakah Anda benar-benar yakin ingin menghapus aplikasi <strong className="text-slate-800 font-bold">&ldquo;{deleteConfirmApp.name}&rdquo;</strong>? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
              <div className="flex items-center justify-center space-x-3 pt-2" id="app-delete-actions">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmApp(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition cursor-pointer"
                  id="btn-cancel-delete-app"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteApp(deleteConfirmApp.id);
                    setDeleteConfirmApp(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition cursor-pointer shadow-sm shadow-rose-500/10"
                  id="btn-confirm-delete-app"
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

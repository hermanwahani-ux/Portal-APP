import React, { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserItem } from '../types';
import { getGoogleAccessToken } from '../firebase';
import {
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
  Check,
  User,
  Users,
  FileSpreadsheet
} from 'lucide-react';

interface ManageUsersViewProps {
  users: UserItem[];
  currentUser: UserItem;
  onAddUser: (user: Omit<UserItem, 'id' | 'createdAt'>) => void;
  onEditUser: (userId: string, updatedFields: Partial<UserItem>) => void;
  onDeleteUser: (userId: string) => void;
}

export default function ManageUsersView({
  users,
  currentUser,
  onAddUser,
  onEditUser,
  onDeleteUser,
}: ManageUsersViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  
  const handleExportUsersToSheets = async () => {
    const token = getGoogleAccessToken();
    if (!token) {
      alert("Silakan hubungkan/otorisasi akun Google Anda (di pojok kanan atas) terlebih dahulu untuk mengisi token Google Sheets.");
      return;
    }

    const confirmExport = confirm(`Apakah Anda yakin ingin mengekspor seluruh ${users.length} daftar pengguna ke Google Sheets baru di Drive Anda?`);
    if (!confirmExport) return;

    try {
      setIsExporting(true);

      // 1. Create a spreadsheet
      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            title: `EduDigital - Daftar Pengguna (${new Date().toLocaleDateString('id-ID')})`
          }
        })
      });

      if (!createRes.ok) {
        throw new Error(`Gagal membuat Spreadsheet: ${createRes.statusText}`);
      }

      const createdSheet = await createRes.json();
      const spreadsheetId = createdSheet.spreadsheetId;
      const spreadsheetUrl = createdSheet.spreadsheetUrl;

      // 2. Prepare values to write
      const header = ["Nama Lengkap", "Alamat Email", "Tingkat Hak Akses", "Status Sesi", "Tanggal Terdaftar"];
      const rows = users.map(u => [u.name, u.email, u.role, u.status === 'active' ? 'Aktif' : 'Ditangguhkan', new Date(u.createdAt).toLocaleDateString()]);
      const values = [header, ...rows];

      // 3. Write values
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
        throw new Error(`Gagal menulis data ke Spreadsheet: ${writeRes.statusText}`);
      }

      alert(`Sukses mengekspor daftar pengguna! Google Spreadsheet baru Anda telah berhasil dibuat di Google Drive.`);
      if (window.confirm(`Spreadsheet berhasil dibuat!\nApakah Anda ingin membukanya sekarang?\n\nURL: ${spreadsheetUrl}`)) {
        window.open(spreadsheetUrl, '_blank');
      }
    } catch (err: any) {
      console.error(err);
      alert(`Gagal mengekspor data pengguna: ${err.message || err}`);
    } finally {
      setIsExporting(false);
    }
  };
  
  // Modal toggle state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserItem | null>(null);

  // Form single fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Admin' | 'Editor' | 'Viewer'>('Viewer');
  const [status, setStatus] = useState<'active' | 'suspended'>('active');

  // Trigger modal for New User
  const openNewUserModal = () => {
    setEditingUserId(null);
    setName('');
    setEmail('');
    setRole('Viewer');
    setStatus('active');
    setIsModalOpen(true);
  };

  // Trigger modal for Edit User
  const openEditUserModal = (u: UserItem) => {
    setEditingUserId(u.id);
    setName(u.name);
    setEmail(u.email);
    setRole(u.role);
    setStatus(u.status);
    setIsModalOpen(true);
  };

  // Handle Form submit
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('Masukkan Nama Lengkap');
    if (!email.trim() || !email.includes('@')) return alert('Masukkan Alamat Email yang Valid');

    const userData = {
      name: name.trim(),
      email: email.trim(),
      role,
      status,
    };

    if (editingUserId) {
      if (editingUserId === currentUser.id && role !== currentUser.role) {
        const confirmDemote = confirm('Peringatan: Anda sedang mengubah level akses akun Anda sendiri! Lanjutkan?');
        if (!confirmDemote) return;
      }
      onEditUser(editingUserId, userData);
    } else {
      onAddUser(userData);
    }

    setIsModalOpen(false);
  };

  // Filter lists based on input queries
  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12" id="manage-users-container">
      {/* Search & Action Bar */}
      <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 h-5 text-slate-400" />
          </span>
          <input
            type="text"
            placeholder="Cari nama, email, atau tingkat jabatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm transition-all text-slate-700"
            id="manage-users-search-input"
          />
        </div>

        {currentUser.role !== 'Viewer' ? (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleExportUsersToSheets}
              disabled={isExporting}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs rounded-xl transition flex items-center justify-center cursor-pointer shadow-sm shadow-emerald-500/10"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              {isExporting ? 'Mengekspor...' : 'Ekspor ke Google Sheets'}
            </button>
            <button
              onClick={openNewUserModal}
              className="px-4 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition flex items-center justify-center cursor-pointer shadow-sm shadow-blue-500/10"
              id="btn-trigger-add-user"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Tambah Pengguna
            </button>
          </div>
        ) : (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 px-3 py-2 rounded-xl font-medium">
            Hanya Admin & Editor yang dapat memodifikasi daftar pengguna.
          </p>
        )}
      </section>

      {/* Users List Data Table Grid */}
      <section className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="manage-users-table">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-4 pl-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Nama & Akun</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Tingkatan Hak Akses</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Tanggal Ditambahkan</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Status Sesi</th>
                <th className="p-4 pr-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const isActive = u.status === 'active';
                const isSelf = u.id === currentUser.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/65 transition-colors">
                    {/* User profile with initials or simple icon branding */}
                    <td className="p-4 pl-6">
                      <div className="flex items-center space-x-3.5">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center relative shadow-xs font-semibold text-xs border overflow-hidden ${
                          u.role === 'Admin'
                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                            : u.role === 'Editor'
                            ? 'bg-purple-50 text-purple-700 border-purple-100'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }`}>
                          {u.avatarUrl ? (
                            <img referrerPolicy="no-referrer" src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border border-white flex items-center justify-center text-[7px] text-white font-bold bg-blue-600">
                            {u.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm flex items-center">
                            {u.name}
                            {isSelf && (
                              <span className="ml-2 px-1.5 py-0.5 text-[8px] bg-blue-100 text-blue-700 font-extrabold rounded-md uppercase">
                                Anda
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Permission Role visual coloring indicator */}
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
                        u.role === 'Admin'
                          ? 'bg-blue-50 text-blue-700 font-bold border border-blue-100'
                          : u.role === 'Editor'
                          ? 'bg-purple-50 text-purple-700 font-bold border border-purple-100'
                          : 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-100'
                      }`}>
                        {u.role}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="p-4 text-xs text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </td>

                    {/* User level status */}
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide transition uppercase shadow-xs border ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-10 border-emerald-100'
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {isActive ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Aktif</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Ditangguhkan</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Actions dropdown simulated list */}
                    <td className="p-4 pr-6 text-right">
                      {currentUser.role !== 'Viewer' ? (
                        <div className="inline-flex space-x-1">
                          <button
                            onClick={() => openEditUserModal(u)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Pengguna"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => {
                              if (isSelf) {
                                return alert('Pencegahan keamanan: Anda tidak diizinkan untuk menghapus akun yang saat ini aktif digunakan untuk masuk!');
                              }
                              setDeleteConfirmUser(u);
                            }}
                            disabled={isSelf}
                            className={`p-1.5 rounded-lg transition-all ${
                              isSelf
                                ? 'text-slate-200 cursor-not-allowed'
                                : 'text-slate-400 hover:text-red-650 hover:text-red-500 hover:bg-red-50 cursor-pointer'
                            }`}
                            title="Hapus Pengguna"
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

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 p-4 text-slate-400">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-semibold">Tidak ada pengguna ditemukan</p>
                    <p className="text-xs text-slate-400 mt-1">Gunakan kata kunci pencarian yang tersimpan berbeda.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Adding / Editing Modal Popup */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden"
              id="user-management-modal"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-slate-800 text-base">
                  {editingUserId ? 'Ubah Informasi Pengguna' : 'Tambahkan Pengguna Baru'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masukkan nama lengkap..."
                    className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-700"
                    id="form-user-name"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Alamat Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Contoh: user@edudigital.id"
                    className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-700"
                    id="form-user-email"
                  />
                </div>

                {/* Dropdowns Row: Role & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Tingkat Jabatan <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as 'Admin' | 'Editor' | 'Viewer')}
                      className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-700 bg-white"
                      id="form-user-role"
                    >
                      <option value="Admin">Administrator</option>
                      <option value="Editor">Editor</option>
                      <option value="Viewer">Viewer (Pembaca)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Status Sesi <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as 'active' | 'suspended')}
                      className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-700 bg-white"
                      id="form-user-status"
                    >
                      <option value="active">Aktif (Bisa Masuk)</option>
                      <option value="suspended">Ditangguhkan / Kunci</option>
                    </select>
                  </div>
                </div>

                {/* Bottom Actions Row */}
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
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition flex items-center shadow-xs cursor-pointer animate-fade-in"
                  >
                    <Check className="w-4 h-4 mr-1.5" />
                    {editingUserId ? 'Simpan Perubahan' : 'Daftarkan Akun'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom User Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" id="user-delete-confirm-overlay">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full overflow-hidden p-6 text-center space-y-4"
              id="user-delete-confirm-modal"
            >
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center mx-auto" id="user-delete-icon">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base" id="user-delete-title">Hapus Pengguna?</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed" id="user-delete-desc">
                  Apakah Anda benar-benar yakin ingin menghapus akun pengguna <strong className="text-slate-800 font-bold">&ldquo;{deleteConfirmUser.name}&rdquo;</strong>? Pengguna tidak akan dapat masuk kembali ke portal.
                </p>
              </div>
              <div className="flex items-center justify-center space-x-3 pt-2" id="user-delete-actions">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmUser(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition cursor-pointer"
                  id="btn-cancel-delete-user"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteUser(deleteConfirmUser.id);
                    setDeleteConfirmUser(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition cursor-pointer shadow-sm shadow-rose-500/10"
                  id="btn-confirm-delete-user"
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

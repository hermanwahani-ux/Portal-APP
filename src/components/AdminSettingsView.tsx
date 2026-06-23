import React, { useState, FormEvent, DragEvent, ChangeEvent } from 'react';
import { motion } from 'motion/react';
import { UserItem, SystemSettings } from '../types';
import {
  Save,
  Camera,
  Settings,
  Image,
  RefreshCw,
  User,
  ShieldCheck,
  Check,
  Building,
  Mail,
  Calendar,
  Sparkles,
  Link as LinkIcon,
  UploadCloud,
  Trash2
} from 'lucide-react';

interface AdminSettingsViewProps {
  currentUser: UserItem;
  users: UserItem[];
  systemSettings: SystemSettings;
  onUpdateCurrentUser: (updatedUser: Partial<UserItem>) => void;
  onUpdateSystemSettings: (updatedSettings: Partial<SystemSettings>) => void;
  onLogAction: (actionName: string, details: string, type: 'info' | 'success' | 'warn' | 'error') => void;
}

export default function AdminSettingsView({
  currentUser,
  systemSettings,
  onUpdateCurrentUser,
  onUpdateSystemSettings,
  onLogAction,
}: AdminSettingsViewProps) {
  // State for Admin Profile editing
  const [adminName, setAdminName] = useState(currentUser.name);
  const [adminEmail, setAdminEmail] = useState(currentUser.email);
  const [adminAvatar, setAdminAvatar] = useState(currentUser.avatarUrl || '');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  // State for System Settings editing
  const [portalName, setPortalName] = useState(systemSettings.portalName);
  const [schoolYear, setSchoolYear] = useState(systemSettings.schoolYear);
  const [contactEmail, setContactEmail] = useState(systemSettings.contactEmail);
  const [logoUrl, setLogoUrl] = useState(systemSettings.logoUrl);

  const [allowPesertaDashboard, setAllowPesertaDashboard] = useState(
    systemSettings.allowPesertaDashboard ?? true
  );
  const [allowPesertaPortal, setAllowPesertaPortal] = useState(
    systemSettings.allowPesertaPortal ?? true
  );
  const [allowPesertaLogs, setAllowPesertaLogs] = useState(
    systemSettings.allowPesertaLogs ?? false
  );

  const [isSavedNotify, setIsSavedNotify] = useState(false);
  const [isSystemSavedNotify, setIsSystemSavedNotify] = useState(false);

  // Drag and Drop File Upload States and Handlers
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Sistem hanya mendukung berkas berupa gambar!');
      return;
    }
    // Limit file size to 2MB to keep Base64 strings fast in localStorage
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran berkas melebihi batas maksimum (2MB)! Silakan unggah gambar yang lebih ringkas.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        setAdminAvatar(e.target.result);
        onLogAction('mengunggah foto profil baru', file.name, 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Trigger profile updates
  const handleSaveProfile = (e: FormEvent) => {
    e.preventDefault();
    if (!adminName.trim()) return alert('Nama Administrator tidak boleh kosong!');
    if (!adminEmail.trim()) return alert('Email Administrator tidak boleh kosong!');

    onUpdateCurrentUser({
      name: adminName.trim(),
      email: adminEmail.trim(),
      avatarUrl: adminAvatar || undefined,
    });

    onLogAction(
      'memperbarui profil & foto admin',
      `"${adminName}" (${currentUser.role})`,
      'success'
    );

    setIsSavedNotify(true);
    setTimeout(() => setIsSavedNotify(false), 3000);
  };

  // Trigger system update variables
  const handleSaveSystem = (e: FormEvent) => {
    e.preventDefault();
    if (!portalName.trim()) return alert('Nama Portal Sekolah tidak boleh kosong!');

    onUpdateSystemSettings({
      portalName: portalName.trim(),
      schoolYear: schoolYear.trim(),
      contactEmail: contactEmail.trim(),
      logoUrl: logoUrl.trim(),
      allowPesertaDashboard,
      allowPesertaPortal,
      allowPesertaLogs,
    });

    onLogAction(
      'memperbarui variabel sistem portal',
      `"${portalName}" - Tahun Ajaran: ${schoolYear}`,
      'info'
    );

    setIsSystemSavedNotify(true);
    setTimeout(() => setIsSystemSavedNotify(false), 3000);
  };

  // Generate automated Dicebear photo avatar based on current name
  const handleGenerateRobotAvatar = () => {
    const seed = encodeURIComponent(adminName || 'admin');
    const roboUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;
    setAdminAvatar(roboUrl);
    onLogAction('menghasilkan avatar ilustrasi otomatis', `dengan seed: ${adminName}`, 'info');
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in" id="admin-settings-container">
      {/* Introduction Hero Section */}
      <section className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-pink-600 mb-1">
              <Settings className="w-5 h-5 animate-spin-slow" />
              <span className="text-xs font-bold uppercase tracking-wider">Konfigurasi Administrator</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
              Pusat Kendali Profil & Portal
            </h2>
            <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Atur hak kepemilikan visual Anda, pasang foto profil representatif Anda, serta kendalikan branding sekolah di seluruh sub-aplikasi yang terhubung.
            </p>
          </div>
          <div className="p-3 bg-pink-50 text-pink-600 rounded-2xl hidden sm:block">
            <Camera className="w-6 h-6" />
          </div>
        </div>
      </section>

      {/* Main Two-column Configuration layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Admin Profile Photo Setting (8 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            {/* Form Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2.5">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-base">Atur Profil & Ikon Foto Saya</h3>
              </div>
              <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase text-blue-600 bg-blue-50 rounded-full">
                Sesi Aktif
              </span>
            </div>

            {/* Form Body */}
            <div className="p-6 space-y-6">
              
              {/* Photo Avatar Interactive Display with Focal Indicator */}
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
                <div className="relative group">
                  {/* Photo Circular Window */}
                  <div className="w-28 h-28 rounded-full border-4 border-slate-100 shadow-lg overflow-hidden bg-slate-50 flex items-center justify-center relative">
                    {adminAvatar ? (
                      <img
                        referrerPolicy="no-referrer"
                        src={adminAvatar}
                        alt="Pratinjau Foto Admin"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                        id="admin-profile-photo-preview"
                      />
                    ) : (
                      <div className="text-slate-300 flex flex-col items-center justify-center text-center">
                        <User className="w-12 h-12" />
                        <span className="text-[9px] font-semibold tracking-wider text-slate-400 mt-1 uppercase">Tanpa Foto</span>
                      </div>
                    )}

                    {/* Camera icon decoration overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer">
                      <Camera className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Absolute Badge showing role info */}
                  <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-white shadow-md" title="Akun Terotentikasi">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                </div>

                {/* Photo details description & instant trigger generators */}
                <div className="flex-1 space-y-2.5 text-center sm:text-left">
                  <h4 className="font-bold text-slate-800 text-sm">Logo / Foto Profil Saat Ini</h4>
                  <p className="text-xs text-slate-400 max-w-sm leading-normal font-medium">
                    Silakan seret & lepas gambar Anda ke dropzone di bawah, telusuri berkas dari perangkat Anda, atau hasilkan avatar digital acak secara instan:
                  </p>
                  
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
                    <button
                      type="button"
                      onClick={handleGenerateRobotAvatar}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 transition-colors text-slate-600 font-bold text-[10px] rounded-lg tracking-wide uppercase flex items-center shadow-2xs border border-slate-200/55 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1" />
                      Gunakan Avatar Kreatif
                    </button>
                    {adminAvatar && (
                      <button
                        type="button"
                        onClick={() => {
                          setAdminAvatar('');
                          onLogAction('menghapus foto profil admin', '', 'info');
                        }}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors font-bold text-[10px] rounded-lg tracking-wide uppercase flex items-center cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Hapus Foto
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Interactive Drag & Drop File Upload Area */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Unggah Berkas Foto Profil (Drag & Drop)
                </label>
                
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-2xl p-6 transition-all duration-200 text-center flex flex-col items-center justify-center cursor-pointer ${
                    isDragActive
                      ? 'border-blue-500 bg-blue-50/40 scale-[0.99]'
                      : 'border-slate-200 hover:border-blue-400 bg-slate-50/40 hover:bg-white'
                  }`}
                  id="photo-upload-dropzone"
                >
                  <input
                    type="file"
                    id="admin-photo-file-input"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    title=""
                  />
                  
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-3 shadow-2xs">
                    <UploadCloud className="w-6 h-6 animate-pulse" />
                  </div>
                  
                  <p className="text-xs font-bold text-slate-700">
                    Seret & Letakkan gambar Anda di sini, atau <span className="text-blue-600 underline">Pilih Berkas</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Mendukung format PNG, JPG, JPEG, atau GIF (Maks. 2MB)
                  </p>
                </div>
              </div>

              {/* Manual Custom Photo URL Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Atau Tempel Tautan Foto Eksternal (URL)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LinkIcon className="h-4 w-4 text-slate-400" />
                    </span>
                    <input
                      type="text"
                      placeholder="Masukkan URL foto valid (https://...)"
                      value={customAvatarUrl}
                      onChange={(e) => setCustomAvatarUrl(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!customAvatarUrl.trim()) return alert('Masukkan URL foto luar terlebih dahulu!');
                      if (!customAvatarUrl.match(/^https?:\/\//i)) {
                        return alert('Sistem menuntut tautan URL yang diawali dengan http:// atau https:// untuk memuat foto.');
                      }
                      setAdminAvatar(customAvatarUrl.trim());
                      setCustomAvatarUrl('');
                      onLogAction('memasang tautan foto profil eksternal', customAvatarUrl, 'info');
                    }}
                    className="px-3.5 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition cursor-pointer"
                  >
                    Terapkan
                  </button>
                </div>
              </div>

              {/* Text Fields: Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Nama Administrator <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Alamat Surat Elektronik (Email) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Save Buttons Panel */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex-1">
                {isSavedNotify && (
                  <span className="text-xs font-bold text-emerald-600 animate-pulse flex items-center">
                    <Check className="w-4 h-4 mr-1" />
                    Profil Admin & Ikon Foto berhasil disinkronkan!
                  </span>
                )}
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition flex items-center shadow-xs cursor-pointer"
              >
                <Save className="w-4 h-4 mr-1.5" />
                Simpan Profil Saya
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Portal Custom branding (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleSaveSystem} className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            {/* Form Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2.5">
                <Building className="w-5 h-5 text-pink-600" />
                <h3 className="font-bold text-slate-800 text-base">Branding Portal & Sistem</h3>
              </div>
            </div>

            {/* Form Body */}
            <div className="p-6 space-y-4">
              {/* Institution Logo Hotlink */}
              <div className="space-y-4 pb-4 border-b border-slate-100">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Logo / Lambang Digital Portal
                </label>
                
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-center overflow-hidden p-1.5">
                    {logoUrl ? (
                      <img referrerPolicy="no-referrer" src={logoUrl} alt="Logo Sekolah" className="w-full h-full object-contain" />
                    ) : (
                      <Image className="w-7 h-7 text-slate-300" />
                    )}
                  </div>
                  
                  <div className="flex-1 text-xs text-slate-400 leading-normal">
                    <p className="font-semibold text-slate-700">Pratinjau Lambang</p>
                    <p>Mempengaruhi lambang di peluncur induk atau dashboard.</p>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="https://... logo-sekolah.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-pink-100 focus:border-pink-500 font-mono"
                />
              </div>

              {/* Portal Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Nama Portal Utama <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-4 w-4 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    required
                    value={portalName}
                    onChange={(e) => setPortalName(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Academic school year */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Tahun Ajaran Aktif
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    placeholder="2026/2027"
                    value={schoolYear}
                    onChange={(e) => setSchoolYear(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Portal Support Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Surat Dukungan (Support Email)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </span>
                  <input
                    type="email"
                    placeholder="helpdesk@edudigital.id"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Batasan Akses Fitur Peserta */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex items-center space-x-1.5 text-indigo-600 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">Akses Fitur Kontrol Peserta</span>
                </div>
                
                {/* Switch 1: Dashboard */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex-1 pr-4">
                    <p className="text-xs font-bold text-slate-700">Akses Utama Dashboard</p>
                    <p className="text-[10px] text-slate-400 leading-normal">Buka tab Dashboard grafik & statistik rujukan untuk peserta.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAllowPesertaDashboard(!allowPesertaDashboard)}
                    className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                      allowPesertaDashboard ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      allowPesertaDashboard ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Switch 2: Portal */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex-1 pr-4">
                    <p className="text-xs font-bold text-slate-700">Akses Portal Aplikasi</p>
                    <p className="text-[10px] text-slate-400 leading-normal">Buka tab Portal peluncuran sub-aplikasi belajar mandiri peserta.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAllowPesertaPortal(!allowPesertaPortal)}
                    className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                      allowPesertaPortal ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      allowPesertaPortal ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Switch 3: Log Aktivitas */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex-1 pr-4">
                    <p className="text-xs font-bold text-slate-700">Akses Catatan Aktivitas</p>
                    <p className="text-[10px] text-slate-400 leading-normal">Izinkan peserta mengintip log server riwayat koordinasi sistem.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAllowPesertaLogs(!allowPesertaLogs)}
                    className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                      allowPesertaLogs ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      allowPesertaLogs ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Save Buttons Panel */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
              <div className="min-h-[16px]">
                {isSystemSavedNotify && (
                  <span className="text-xs font-bold text-emerald-600 animate-pulse flex items-center">
                    <Check className="w-4 h-4 mr-1" />
                    Branding Portal diperbarui sepenuhnya!
                  </span>
                )}
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-pink-600 text-white font-bold text-xs rounded-xl hover:bg-pink-700 transition flex items-center justify-center shadow-xs cursor-pointer"
              >
                <Save className="w-4 h-4 mr-1.5" />
                Simpan Branding Portal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

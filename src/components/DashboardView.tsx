import { motion } from 'motion/react';
import { AppItem, UserItem, ActivityLog, CurrentTab, SystemSettings } from '../types';
import { Grid, CheckCircle, Users, ArrowUpRight, ShieldAlert, Sparkles, Plus, Clock } from 'lucide-react';
import AppIcon from './AppIcon';

interface DashboardViewProps {
  apps: AppItem[];
  users: UserItem[];
  currentUser: UserItem;
  activityLogs: ActivityLog[];
  setTab: (tab: CurrentTab) => void;
  onQuickToggleStatus: (appId: string) => void;
  onOpenAddAppModal: () => void;
  systemSettings?: SystemSettings;
}

export default function DashboardView({
  apps,
  users,
  currentUser,
  activityLogs,
  setTab,
  onQuickToggleStatus,
  onOpenAddAppModal,
  systemSettings,
}: DashboardViewProps) {
  // Statistics calculated dynamically from central state
  const totalAppsCount = apps.length;
  const activeAppsCount = apps.filter((app) => app.status === 'active').length;
  const totalUsersCount = users.length;

  // Group applications by category for clean mini-visual statistics bars
  const categoryCounts = apps.reduce((acc, app) => {
    acc[app.category] = (acc[app.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categories = Object.keys(categoryCounts).map(cat => ({
    name: cat,
    count: categoryCounts[cat],
    percentage: Math.round((categoryCounts[cat] / totalAppsCount) * 100),
  }));

  // Stagger animation rules
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-12"
      id="dashboard-container"
    >
      {/* Welcome Hero Banner Card */}
      <motion.section
        variants={itemVariants}
        className="bg-white p-6 md:p-10 rounded-2xl border border-slate-100 shadow-xs relative overflow-hidden"
        data-purpose="welcome-hero"
        id="dashboard-welcome-banner"
      >
        {/* Soft decorative background circles */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50/30 rounded-full blur-3xl -z-10 translate-x-20 -translate-y-20" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-indigo-50/20 rounded-full blur-2xl -z-10 translate-y-10" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
              Selamat Datang, <span className="text-blue-600 font-extrabold">{currentUser.name}</span>!
            </h2>
            <p className="text-slate-500 mt-2.5 text-base md:text-lg font-normal">
              Ini adalah pusat akses aplikasi digital Anda. Kelola dan pantau aplikasi institusi dengan mulus.
            </p>
          </div>
          
          {/* Quick Stats overview widget for current interactive user role */}
          <div className="bg-slate-50/80 border border-slate-100 p-4 rounded-xl flex items-center space-x-3.5 self-start md:self-auto">
            <div className={`p-2.5 rounded-lg ${
              currentUser.role === 'Admin' 
                ? 'bg-blue-100 text-blue-700' 
                : currentUser.role === 'Editor' 
                ? 'bg-purple-100 text-purple-700' 
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Level Hak Akses</p>
              <p className="text-sm font-bold text-slate-700">{currentUser.role === 'Admin' ? 'Akses Penuh (Administrator)' : currentUser.role === 'Editor' ? 'Akses Editor' : 'Akses Viewer'}</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Statistics Cards Grid */}
      <motion.section
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        data-purpose="stats-overview"
        id="dashboard-stats-grid"
      >
        {/* Stat Card: Total Aplikasi */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center space-x-5 transition-all hover:shadow-md hover:border-slate-200">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border border-blue-100/50">
            <Grid className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-none mb-1.5">Total Aplikasi</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalAppsCount}</p>
          </div>
        </div>

        {/* Stat Card: Aplikasi Aktif */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center space-x-5 transition-all hover:shadow-md hover:border-slate-200">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border border-emerald-100/50">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-none mb-1.5">Aplikasi Aktif</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{activeAppsCount}</p>
          </div>
        </div>

        {/* Stat Card: Total Pengguna */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center space-x-5 transition-all hover:shadow-md hover:border-slate-200">
          <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border border-purple-100/50">
            <Users className="w-8 h-8 text-purple-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-none mb-1.5 leading-tight mb-1.5">Total Pengguna</p>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalUsersCount}</p>
          </div>
        </div>
      </motion.section>

      {/* Main Layout Grid row: Quick Portal Access on left, Metadata details & activity logs on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: 2 columns wide - Quick shortcuts to apps */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">Akses Cepat Aplikasi Portal</h3>
              <p className="text-xs text-slate-500 mt-1">Gunakan tautan cepat untuk menggunakan produk aktif kami</p>
            </div>
            <button
              onClick={() => setTab('portal')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center transition-all cursor-pointer"
            >
              Lihat Portal
              <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...apps]
              .filter((app) => app.status === 'active')
              .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
              .map((app) => (
              <div
                key={app.id}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md hover:border-blue-100 transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-slate-50 rounded-xl text-blue-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      <AppIcon name={app.icon} className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase text-slate-400 bg-slate-50 border border-slate-100 rounded-full">
                      {app.category}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-base leading-snug group-hover:text-blue-600 transition-colors">
                    {app.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {app.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-50 flex items-center justify-between text-xs font-semibold">
                  <a
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                    onClick={(e) => {
                      if (app.url.startsWith('#')) {
                        e.preventDefault();
                        alert(`Membuka simulasi aplikasi: ${app.name}.\nAlamat API: ${app.url}`);
                      }
                    }}
                  >
                    Buka Aplikasi
                    <ArrowUpRight className="w-3.5 h-3.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                  
                  {currentUser.role !== 'Viewer' && (
                    <button
                      onClick={() => onQuickToggleStatus(app.id)}
                      className="text-slate-400 hover:text-red-500 hover:underline transition-colors cursor-pointer"
                    >
                      Matikan
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Empty block if too few active apps */}
            {apps.filter((app) => app.status === 'active').length === 0 && (
              <div className="col-span-2 bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center flex flex-col items-center justify-center">
                <ShieldAlert className="w-10 h-10 text-slate-400 mb-2" />
                <p className="text-sm font-semibold text-slate-600">Tidak ada aplikasi aktif</p>
                <p className="text-xs text-slate-400 max-w-sm mt-1">Semua aplikasi digital dinonaktifkan sementara oleh administrator.</p>
                {currentUser.role !== 'Viewer' && (
                  <button
                    onClick={() => setTab('manage-apps')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white font-medium text-xs rounded-xl hover:bg-blue-700 transition"
                  >
                    Nyalakan Aplikasi di Kelola Aplikasi
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions Card */}
          {currentUser.role !== 'Viewer' && (
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-600/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h4 className="font-bold text-base">Butuh menambahkan modul belajar atau alat baru?</h4>
                <p className="text-xs text-blue-100 mt-1 max-w-md leading-relaxed">
                  Gunakan menu pintasan ini untuk mendaftarkan aplikasi digital mandiri ke dalam portal EduDigital.
                </p>
              </div>
              <button
                onClick={onOpenAddAppModal}
                className="px-4 py-2.5 bg-white text-blue-700 font-bold text-xs rounded-xl hover:bg-blue-50 transition-all flex items-center justify-center shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Tambah Aplikasi Baru
              </button>
            </div>
          )}
        </motion.div>

        {/* Right Side: 1 columns wide - Audit logs & Category stats */}
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Category Distribution progress widget */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
            <h3 className="font-bold text-slate-800 text-base mb-1">Kategori Aplikasi</h3>
            <p className="text-[11px] text-slate-400 mb-4">Grafik pembagian kategori aplikasi aktif dan draf</p>
            
            <div className="space-y-4">
              {categories.map((cat) => (
                <div key={cat.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{cat.name}</span>
                    <span className="text-slate-500">{cat.count} modul ({cat.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100/30">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}

              {categories.length === 0 && (
                <p className="text-xs text-slate-400 py-4 text-center">Belum ada kategori terdaftar.</p>
              )}
            </div>
          </div>

          {/* Audit trail log panel */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-slate-800 text-base">Aktivitas Sistem</h3>
                </div>
                <span className="px-2 py-0.5 text-[9px] bg-slate-100 text-slate-500 font-semibold rounded">
                  Live Log
                </span>
              </div>

              {currentUser.role !== 'Viewer' || (systemSettings?.allowPesertaLogs ?? false) ? (
                <div className="space-y-3.5 max-h-[260px] overflow-y-auto style-scrollbar pr-1">
                  {activityLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="text-xs flex items-start space-x-3 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        log.type === 'success' ? 'bg-emerald-500' : log.type === 'warn' ? 'bg-amber-500' : log.type === 'error' ? 'bg-rose-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1">
                        <p className="text-slate-700 leading-snug">
                          <span className="font-bold text-slate-800">{log.user}</span> {log.action}{' '}
                          <span className="text-slate-500 italic font-medium">{log.details}</span>
                        </p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {log.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}

                  {activityLogs.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-6">Belum ada aktivitas tercatat.</p>
                  )}
                </div>
              ) : (
                <div className="py-8 px-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">Catatan Dinonaktifkan</p>
                  <p className="text-[9px] text-slate-400 mt-1 max-w-xs mx-auto">Akses log aktivitas dinonaktifkan oleh Administrator untuk peran Peserta.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

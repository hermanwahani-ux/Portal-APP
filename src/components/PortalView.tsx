import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppItem, UserItem } from '../types';
import { Search, ExternalLink, ShieldAlert, Sparkles, SlidersHorizontal, Grid } from 'lucide-react';
import AppIcon from './AppIcon';

interface PortalViewProps {
  apps: AppItem[];
  currentUser: UserItem;
  onQuickToggleStatus: (appId: string) => void;
}

export default function PortalView({ apps, currentUser, onQuickToggleStatus }: PortalViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [showOnlyActive, setShowOnlyActive] = useState(true);

  // Get unique categories for filter pills
  const categoriesList = useMemo(() => {
    const list = new Set(apps.map((app) => app.category));
    return ['Semua', ...Array.from(list)];
  }, [apps]);

  // Filter apps based on search, selected category, and active state
  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const matchesSearch =
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'Semua' || app.category === selectedCategory;
      const matchesAvailability = !showOnlyActive || app.status === 'active';

      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [apps, searchQuery, selectedCategory, showOnlyActive]);

  // Launch Simulated App confirmation
  const handleLaunchApp = (app: AppItem) => {
    if (app.status === 'inactive') {
      alert(`Aplikasi "${app.name}" sedang dinonaktifkan oleh administrator.`);
      return;
    }
    alert(
      `Meluncurkan Aplikasi EduDigital: "${app.name}"\nLink Eksternal / API: ${app.url}\n\nSistem simulasi berhasil mengantarkan token enkripsi sesi pengguna "${currentUser.name}" (${currentUser.role}) ke service tujuan!`
    );
  };

  return (
    <div className="space-y-8 pb-12" id="portal-view-container">
      {/* Intro & Search Panel */}
      <section className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Portal Akses Aplikasi</h2>
            <p className="text-xs text-slate-500 mt-1">
              Pusat peluncuran seluruh instrumen digital terintegrasi EduDigital
            </p>
          </div>
          
          {/* Quick Visibility option for Admin roles */}
          {currentUser.role !== 'Viewer' && (
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-100 p-1.5 rounded-xl self-start md:self-auto">
              <button
                onClick={() => setShowOnlyActive(true)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  showOnlyActive
                    ? 'bg-white text-slate-700 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Hanya Aktif
              </button>
              <button
                onClick={() => setShowOnlyActive(false)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  !showOnlyActive
                    ? 'bg-white text-slate-700 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Semua ({apps.length})
              </button>
            </div>
          )}
        </div>

        {/* Search & Filters Controls */}
        <div className="flex flex-col md:flex-row gap-4" id="portal-controls">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 h-5 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder="Cari nama aplikasi, deskripsi, atau kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm transition-all text-slate-700 placeholder-slate-400"
              id="input-portal-search"
            />
          </div>

          {/* Filter Pill items List */}
          <div className="flex items-center overflow-x-auto gap-1.5 no-scrollbar py-0.5" id="portal-filter-pills">
            {categoriesList.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-all cursor-pointer border ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Applications Catalog Grid */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Menampilkan {filteredApps.length} Aplikasi
          </p>
        </div>

        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          id="portal-apps-grid"
        >
          <AnimatePresence mode="popLayout">
            {filteredApps.map((app) => {
              const isActive = app.status === 'active';
              return (
                <motion.div
                  layout
                  key={app.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  className={`bg-white rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden relative group shadow-xs ${
                    isActive
                      ? 'border-slate-100 hover:shadow-lg hover:border-blue-100'
                      : 'border-slate-100 opacity-75 hover:opacity-100'
                  }`}
                >
                  {/* Status Banner stripe for inactive apps */}
                  {!isActive && (
                    <div className="absolute top-0 inset-x-0 bg-slate-500 text-[10px] text-white font-bold tracking-widest uppercase text-center py-1 flex items-center justify-center space-x-1">
                      <ShieldAlert className="w-3 h-3" />
                      <span>Nonaktif (Simpanan Draf)</span>
                    </div>
                  )}

                  <div className={`p-6 ${!isActive ? 'pt-8' : ''}`}>
                    {/* Top line category badge and icon */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        <AppIcon name={app.icon} className="w-6 h-6" />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-slate-50 border border-slate-100 text-slate-400 rounded-full">
                          {app.category}
                        </span>
                        
                        {/* Interactive toggle block inside card for admins */}
                        {currentUser.role !== 'Viewer' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onQuickToggleStatus(app.id);
                            }}
                            className={`w-8 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                              isActive ? 'bg-emerald-500' : 'bg-slate-200'
                            }`}
                            title={isActive ? "Ubah ke Draft" : "Nyalakan Aplikasi"}
                          >
                            <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${
                              isActive ? 'translate-x-3' : 'translate-x-0'
                            }`} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* App title */}
                    <h3 className={`font-bold text-lg tracking-tight transition-colors ${
                      isActive ? 'text-slate-800 group-hover:text-blue-600' : 'text-slate-600'
                    }`}>
                      {app.name}
                    </h3>

                    {/* App description */}
                    <p className="text-xs text-slate-500 mt-2.5 leading-relaxed min-h-[48px] line-clamp-3">
                      {app.description}
                    </p>
                  </div>

                  {/* Actions Area */}
                  <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-50/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-medium">
                      Ditambahkan: {new Date(app.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>

                    <button
                      onClick={() => handleLaunchApp(app)}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-xl flex items-center space-x-1 cursor-pointer transition-all ${
                        isActive
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white'
                          : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <span>Buka</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Fallback empty view */}
          {filteredApps.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center"
            >
              <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-4">
                <Grid className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-700 text-base">Tidak ada aplikasi ditemukan</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Silahkan cari kata kunci lain atau ubah filter filter kategori untuk mendapatkan aplikasi.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('Semua');
                  setShowOnlyActive(false);
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition"
              >
                Reset Semua Filter
              </button>
            </motion.div>
          )}
        </motion.div>
      </section>
    </div>
  );
}

import { Home, LayoutGrid, Rocket, Users, GraduationCap, X, Settings } from 'lucide-react';
import { motion } from 'motion/react';
import { CurrentTab, UserItem, SystemSettings } from '../types';

interface SidebarProps {
  currentTab: CurrentTab;
  setTab: (tab: CurrentTab) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  currentUser: UserItem;
  systemSettings: SystemSettings;
}

export default function Sidebar({
  currentTab,
  setTab,
  isOpenMobile,
  setIsOpenMobile,
  currentUser,
  systemSettings,
}: SidebarProps) {
  const menuItems = [
    {
      id: 'dashboard' as CurrentTab,
      label: 'Dashboard',
      icon: Home,
    },
    {
      id: 'portal' as CurrentTab,
      label: 'Portal Aplikasi',
      icon: LayoutGrid,
    },
  ];

  const filteredMenuItems = menuItems.filter((item) => {
    if (currentUser.role === 'Admin') return true;
    if (item.id === 'dashboard') {
      return systemSettings.allowPesertaDashboard !== false;
    }
    if (item.id === 'portal') {
      return systemSettings.allowPesertaPortal !== false;
    }
    return true;
  });

  const adminItems = [
    {
      id: 'manage-apps' as CurrentTab,
      label: 'Kelola Aplikasi',
      icon: Rocket,
      iconColor: 'text-blue-400',
    },
    {
      id: 'manage-users' as CurrentTab,
      label: 'Kelola Pengguna',
      icon: Users,
      iconColor: 'text-purple-400',
    },
    {
      id: 'admin-settings' as CurrentTab,
      label: 'Pengaturan Admin',
      icon: Settings,
      iconColor: 'text-pink-400',
    },
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col bg-[#111827] text-white">
      {/* Brand logo section */}
      <div className="p-6 flex items-center justify-between border-b border-slate-800/50">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            EduDigital
          </span>
        </div>
        
        {/* Mobile close button */}
        <button
          onClick={() => setIsOpenMobile(false)}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Tutup Menu"
          id="close-sidebar-mobile-btn"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation section */}
      <nav className="flex-1 px-4 py-6 space-y-7 overflow-y-auto style-scrollbar">
        {/* Main navigation */}
        <div className="space-y-1.5">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setTab(item.id);
                  setIsOpenMobile(false);
                }}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative group cursor-pointer ${
                  isActive
                    ? 'text-white bg-white/10 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                id={`sidebar-tab-${item.id}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-md"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className={`w-5 h-5 mr-3 transition-transform duration-200 group-hover:scale-105 ${
                  isActive ? 'text-blue-500' : 'text-slate-400'
                }`} />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Admin tools */}
        {(currentUser.role === 'Admin' || currentUser.role === 'Editor') && (
          <div className="pt-6 border-t border-slate-800">
            <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
              Administrator
            </p>
            <div className="space-y-1.5">
              {adminItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setTab(item.id);
                      setIsOpenMobile(false);
                    }}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative group cursor-pointer ${
                      isActive
                        ? 'text-white bg-white/10 font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                    id={`sidebar-tab-${item.id}`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-indicator"
                        className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-md"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <Icon className={`w-5 h-5 mr-3 transition-transform duration-200 group-hover:scale-105 ${
                      isActive ? 'text-white' : item.iconColor
                    }`} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Footer metadata element */}
      <div className="p-4 border-t border-slate-800/50 text-center">
        <p className="text-[10px] text-slate-500 font-medium">EduDigital Platform v1.2.0</p>
        <p className="text-[9px] text-slate-600 mt-0.5">Sistem Portal Aplikasi Integrasi</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 h-screen flex-shrink-0 border-r border-slate-800 bg-[#111827]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Mobile Sidebar Slider */}
      <div
        className={`fixed inset-y-0 left-0 w-64 z-50 md:hidden bg-[#111827] shadow-2xl transform transition-transform duration-300 ease-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
}

import { Menu, User, LogOut, ChevronDown, RefreshCw } from 'lucide-react';
import { UserItem, CurrentTab } from '../types';
import { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  currentTab: CurrentTab;
  currentUser: UserItem;
  users: UserItem[];
  setCurrentUser: (user: UserItem) => void;
  setIsOpenMobileSidebar: (open: boolean) => void;
  onResetSession: () => void;
  firebaseUser: any | null;
  onLoginWithGoogle: () => Promise<void>;
  onLogoutWithGoogle: () => Promise<void>;
  onLogoutPortal?: () => void;
}

export default function Header({
  currentTab,
  currentUser,
  users,
  setCurrentUser,
  setIsOpenMobileSidebar,
  onResetSession,
  firebaseUser,
  onLoginWithGoogle,
  onLogoutWithGoogle,
  onLogoutPortal,
}: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getPageTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Dashboard Utama';
      case 'portal':
        return 'Portal Aplikasi';
      case 'manage-apps':
        return 'Kelola Aplikasi';
      case 'manage-users':
        return 'Kelola Pengguna';
      case 'admin-settings':
        return 'Pengaturan Admin';
      default:
        return 'Dashboard Utama';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-4 md:px-8 flex-shrink-0 z-30 shadow-xs" id="app-header">
      {/* Left items: Hamburger + Title */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setIsOpenMobileSidebar(true)}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Buka Menu"
          id="hamburger-menu-btn"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">
          {getPageTitle()}
        </h1>
      </div>

      {/* Right items: Actions + Profile Dropdown and Logout */}
      <div className="flex items-center space-x-3 md:space-x-4">
        {/* Firebase Live Cloud synchronization indicator & trigger */}
        <div className="flex items-center space-x-1.5" id="firebase-sync-status-container">
          {firebaseUser ? (
            <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1.5 rounded-xl animate-fade-in">
              <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-bold text-emerald-700 hidden sm:inline-block">Cloud Terhubung</span>
              <button
                onClick={onLogoutWithGoogle}
                className="text-[10px] text-slate-500 hover:text-red-600 underline font-semibold transition ml-1"
                title="Keluar Akun Google"
                id="btn-firebase-signout"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginWithGoogle}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-bold text-[11px] shadow-xs cursor-pointer active:scale-95"
              title="Hubungkan database real-time Firebase dengan Google Auth"
              id="btn-firebase-login"
            >
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.73 0 3.3.63 4.52 1.8l3.18-3.18C17.93 1.19 15.24 0 12.24 0c-6.075 0-11 4.925-11 11s4.925 11 11 11c5.83 0 10.74-4.225 10.74-11 0-.74-.08-1.42-.24-1.715H12.24z"/>
              </svg>
              <span className="hidden xs:inline">Hubungkan Firebase</span>
              <span className="inline xs:hidden">Firebase</span>
            </button>
          )}
        </div>

        {/* Reset / Seed Demo Data trigger */}
        <button
          onClick={onResetSession}
          className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer group"
          title="Reset Data ke Default"
          id="btn-reset-demo-data"
        >
          <RefreshCw className="w-4 h-4 transition-transform group-hover:rotate-180" />
        </button>

        {/* User Session Selector Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center pl-2 pr-3 py-1.5 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-200"
            id="user-profile-dropdown-trigger"
          >
            {/* User display name */}
            <div className="text-right mr-3 hidden sm:block">
              <p className="text-sm font-bold text-slate-800 leading-none">
                {currentUser.name}
              </p>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mt-1 leading-none">
                {currentUser.role}
              </p>
            </div>

            {/* Avatar Circle */}
            <div className={`w-9 h-9 rounded-full flex items-center justify-center relative shadow-sm overflow-hidden ${
              currentUser.role === 'Admin' 
                ? 'bg-blue-100 text-blue-600 border border-blue-200' 
                : currentUser.role === 'Editor'
                ? 'bg-purple-100 text-purple-600 border border-purple-200'
                : 'bg-emerald-100 text-emerald-600 border border-emerald-200'
            }`}>
              {currentUser.avatarUrl ? (
                <img referrerPolicy="no-referrer" src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 animate-fade-in" />
              )}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-white rounded-full"></span>
            </div>

            <ChevronDown className="w-4 h-4 text-slate-400 ml-1.5 hidden sm:block" />
          </button>

          {/* Switch User Dropdown Content */}
          {dropdownOpen && (
            <div className="absolute right-0 w-56 mt-2 origin-top-right bg-white rounded-2xl shadow-xl ring-1 ring-black/5 divide-y divide-slate-100 z-50 animate-in fade-in duration-200" id="user-profile-dropdown-menu">
              <div className="px-4 py-3">
                <p className="text-xs text-slate-400 font-medium">Beralih Akun (Simulasi)</p>
              </div>
              <div className="py-1">
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setCurrentUser(u);
                      setDropdownOpen(false);
                    }}
                    className={`w-full flex items-center px-4 py-2 text-sm transition-colors text-left cursor-pointer ${
                      currentUser.id === u.id
                        ? 'bg-slate-50 text-blue-600 font-medium'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {u.avatarUrl ? (
                      <img referrerPolicy="no-referrer" src={u.avatarUrl} alt={u.name} className="w-6 h-6 rounded-full object-cover mr-2.5 border border-slate-200" />
                    ) : (
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2.5 text-[10px] font-bold ${
                        u.role === 'Admin' ? 'bg-blue-100 text-blue-700' : u.role === 'Editor' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {u.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-xs text-slate-800 leading-tight">{u.name}</p>
                      <p className="text-[10px] text-slate-500">{u.role}</p>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="py-1">
                {onLogoutPortal && (
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogoutPortal();
                    }}
                    className="w-full flex items-center px-4 py-2 text-xs text-rose-600 hover:bg-slate-50 text-left transition-colors cursor-pointer font-bold"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-2" />
                    Keluar Sesi
                  </button>
                )}
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onResetSession();
                  }}
                  className="w-full flex items-center px-4 py-2 text-xs text-slate-500 hover:bg-slate-50 text-left transition-colors cursor-pointer font-medium"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-2" />
                  Reset Portal
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick logout visual simulation */}
        <button
          onClick={() => {
            if (onLogoutPortal) {
              onLogoutPortal();
            } else {
              alert("Keluar dari Portal Simulasi! Menyetel ulang sesi pengguna ke default.");
              onResetSession();
            }
          }}
          className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all border border-transparent hover:border-red-100 cursor-pointer shrink-0"
          title="Keluar Sesi"
          id="btn-quick-logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}

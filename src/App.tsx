import { useState, useEffect, useRef } from 'react';
import { AppItem, UserItem, CurrentTab, ActivityLog, SystemSettings } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import PortalView from './components/PortalView';
import ManageAppsView from './components/ManageAppsView';
import ManageUsersView from './components/ManageUsersView';
import AdminSettingsView from './components/AdminSettingsView';
import LoginView from './components/LoginView';
import { ShieldAlert } from 'lucide-react';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc, 
  deleteDoc, 
  onSnapshot, 
  query 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth, loginWithGoogle, logoutUser, handleFirestoreError, OperationType, testConnection } from './firebase';

// Default Seed Data
const DEFAULT_APPS: AppItem[] = [
  {
    id: 'app-1',
    name: 'EduLearn (Video & Interaktif)',
    category: 'Pembelajaran',
    description: 'Media belajar mandiri siswa kelas 1-12 dilengkapi video interaktif, rangkuman ramah kuota, dan kuis harian.',
    status: 'active',
    url: 'https://learn.edudigital.id',
    icon: 'BookOpen',
    createdAt: '2026-02-15T08:00:00Z',
  },
  {
    id: 'app-2',
    name: 'Sistem Keuangan Sekolah (Sikeu)',
    category: 'Administrasi',
    description: 'Layanan digital pengurusan administrasi uang SPP bulanan, slip gaji guru, dan pencatatan kas yayasan.',
    status: 'active',
    url: 'https://finance.edudigital.id',
    icon: 'DollarSign',
    createdAt: '2026-03-10T11:30:00Z',
  },
  {
    id: 'app-3',
    name: 'Sistem Ujian Online (Exam)',
    category: 'Evaluasi',
    description: 'Pelaksanaan ujian semester nirkertas cerdas dengan proteksi kecurangan tab-out dan pengacakan bank soal.',
    status: 'inactive',
    url: 'https://exam.edudigital.id',
    icon: 'FileText',
    createdAt: '2026-05-01T09:15:00Z',
  },
  {
    id: 'app-4',
    name: 'Perpustakaan Digital (E-Library)',
    category: 'Perpustakaan',
    description: 'Katalog peminjaman buku perpustakaan terpadu secara mandiri lengkap dengan e-book reader gratis.',
    status: 'active',
    url: 'https://lib.edudigital.id',
    icon: 'Library',
    createdAt: '2026-05-18T14:40:00Z',
  },
  {
    id: 'app-5',
    name: 'Presensi Digital (Hadir)',
    category: 'Utilitas',
    description: 'Pencatatan daftar kehadiran siswa, guru, serta staf sekolah menggunakan scan kode QR otomatis.',
    status: 'active',
    url: 'https://hadir.edudigital.id',
    icon: 'CheckSquare',
    createdAt: '2026-06-01T07:30:00Z',
  },
];

const DEFAULT_USERS: UserItem[] = [
  {
    id: 'usr-1',
    name: 'Administrator Utama',
    email: 'admin@edudigital.id',
    role: 'Admin',
    status: 'active',
    createdAt: '2026-01-01T09:00:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256&h=256',
  },
  {
    id: 'usr-2',
    name: 'Budi Santoso',
    email: 'budi@edudigital.id',
    role: 'Editor',
    status: 'active',
    createdAt: '2026-03-24T10:15:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256&h=256',
  },
  {
    id: 'usr-3',
    name: 'Siti Aminah',
    email: 'siti@edudigital.id',
    role: 'Viewer',
    status: 'active',
    createdAt: '2026-04-12T16:45:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256&h=256',
  },
  {
    id: 'usr-4',
    name: 'Ahmad Dani',
    email: 'ahmad@edudigital.id',
    role: 'Viewer',
    status: 'active',
    createdAt: '2026-05-02T13:20:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=256&h=256',
  },
];

const DEFAULT_SYSTEM: SystemSettings = {
  portalName: 'EduDigital Admin Portal',
  schoolYear: '2026/2027',
  contactEmail: 'admin@edudigital.id',
  logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=128&h=128',
  accentColor: 'pink',
  allowPesertaDashboard: true,
  allowPesertaPortal: true,
  allowPesertaLogs: false,
};

const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 'log-1',
    timestamp: '21/06/2026, 07:05:01',
    user: 'System Server',
    action: 'mengaktifkan',
    details: 'Portal EduDigital versi v1.2.0',
    type: 'success',
  },
  {
    id: 'log-2',
    timestamp: '21/06/2026, 07:01:23',
    user: 'System DB',
    action: 'menyinkronkan',
    details: 'Daftar 5 Modul Aplikasi dan 4 Akun',
    type: 'info',
  },
];

export default function App() {
  // Main states
  const [apps, setApps] = useState<AppItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  
  // Track state latest values inside refs to avoid auth effect re-runs
  const appsRef = useRef(apps);
  const usersRef = useRef(users);
  const logsRef = useRef(activityLogs);

  useEffect(() => {
    appsRef.current = apps;
  }, [apps]);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  useEffect(() => {
    logsRef.current = activityLogs;
  }, [activityLogs]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(DEFAULT_SYSTEM);
  const [currentUser, setCurrentUser] = useState<UserItem>(DEFAULT_USERS[0]);
  const [currentTab, setTab] = useState<CurrentTab>('dashboard');
  
  // Session Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('edudigital_is_logged_in') === 'true';
  });

  // UI toggles
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState(false);
  const [isOpenAddDirectly, setIsOpenAddDirectly] = useState(false);

  // Firebase integration states
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(true);

  // Initialize data from localstorage or seed defaults (Offline support)
  useEffect(() => {
    const savedApps = localStorage.getItem('edudigital_apps');
    const savedUsers = localStorage.getItem('edudigital_users');
    const savedLogs = localStorage.getItem('edudigital_logs');
    const savedSystem = localStorage.getItem('edudigital_system');

    if (savedApps && savedUsers && savedLogs) {
      setApps(JSON.parse(savedApps));
      const parsedUsers = JSON.parse(savedUsers) as UserItem[];
      setUsers(parsedUsers);
      setActivityLogs(JSON.parse(savedLogs));
      
      // Make sure the active currentUser references the live object in the array matching the active session role
      const savedRole = localStorage.getItem('edudigital_session_role') || 'Admin';
      const activeUser = parsedUsers.find((u) => u.role === savedRole);
      if (activeUser) {
        setCurrentUser(activeUser);
      } else {
        const adminUser = parsedUsers.find((u) => u.role === 'Admin');
        if (adminUser) {
          setCurrentUser(adminUser);
        } else if (parsedUsers.length > 0) {
          setCurrentUser(parsedUsers[0]);
        }
      }
    } else {
      // Re-seed original data
      setApps(DEFAULT_APPS);
      setUsers(DEFAULT_USERS);
      setActivityLogs(INITIAL_LOGS);
      
      const savedRole = localStorage.getItem('edudigital_session_role') || 'Admin';
      const activeUser = DEFAULT_USERS.find((u) => u.role === savedRole);
      setCurrentUser(activeUser || DEFAULT_USERS[0]);
      
      localStorage.setItem('edudigital_apps', JSON.stringify(DEFAULT_APPS));
      localStorage.setItem('edudigital_users', JSON.stringify(DEFAULT_USERS));
      localStorage.setItem('edudigital_logs', JSON.stringify(INITIAL_LOGS));
    }

    if (savedSystem) {
      setSystemSettings(JSON.parse(savedSystem));
    } else {
      setSystemSettings(DEFAULT_SYSTEM);
      localStorage.setItem('edudigital_system', JSON.stringify(DEFAULT_SYSTEM));
    }
  }, []);

  // Save updates to localStorage on change (Offline / Hybrid support)
  const saveState = (updatedApps: AppItem[], updatedUsers: UserItem[], updatedLogs: ActivityLog[]) => {
    setApps(updatedApps);
    setUsers(updatedUsers);
    setActivityLogs(updatedLogs);
    localStorage.setItem('edudigital_apps', JSON.stringify(updatedApps));
    localStorage.setItem('edudigital_users', JSON.stringify(updatedUsers));
    localStorage.setItem('edudigital_logs', JSON.stringify(updatedLogs));
  };

  const saveSystemState = async (updatedSystem: SystemSettings) => {
    setSystemSettings(updatedSystem);
    localStorage.setItem('edudigital_system', JSON.stringify(updatedSystem));

    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'system', 'settings'), updatedSystem);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, 'system/settings');
      }
    }
  };

  // Helper dynamic action logger
  const logAction = async (
    user: string,
    actionName: string,
    detailsText: string,
    currentApps: AppItem[],
    currentUsers: UserItem[],
    logType: 'info' | 'success' | 'warn' | 'error' = 'info'
  ) => {
    const logId = `log-${Date.now()}`;
    const newLog: ActivityLog = {
      id: logId,
      timestamp: new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      user,
      action: actionName,
      details: detailsText,
      type: logType,
    };

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'logs', logId), newLog);
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, `logs/${logId}`);
      }
    } else {
      const updatedLogs = [newLog, ...activityLogs];
      saveState(currentApps, currentUsers, updatedLogs);
    }
  };

  // Bootstrap initial Database if Empty on connect
  const seedFirebaseDataIfEmpty = async () => {
    // 1. Apps Seeding
    try {
      const appsSnap = await getDocs(collection(db, 'apps'));
      if (appsSnap.empty) {
        // Retrieve local storage apps first to preserve user edits/additions!
        let localApps: AppItem[] = DEFAULT_APPS;
        const savedApps = localStorage.getItem('edudigital_apps');
        if (savedApps) {
          try {
            const parsed = JSON.parse(savedApps);
            if (Array.isArray(parsed) && parsed.length > 0) {
              localApps = parsed;
            }
          } catch (err) {
            console.error("Gagal parse savedApps dari localStorage:", err);
          }
        }
        for (const appItem of localApps) {
          await setDoc(doc(db, 'apps', appItem.id), appItem);
        }
        console.log("Apps collection seeded successfully.");
      }
    } catch (e) {
      console.warn("Apps seeding check skipped or non-authorized: ", e);
    }

    // 2. Users Seeding
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      if (usersSnap.empty) {
        // Retrieve local storage users first to preserve users edits/additions!
        let localUsers: UserItem[] = DEFAULT_USERS;
        const savedUsers = localStorage.getItem('edudigital_users');
        if (savedUsers) {
          try {
            const parsed = JSON.parse(savedUsers);
            if (Array.isArray(parsed) && parsed.length > 0) {
              localUsers = parsed;
            }
          } catch (err) {
            console.error("Gagal parse savedUsers dari localStorage:", err);
          }
        }
        for (const userItem of localUsers) {
          await setDoc(doc(db, 'users', userItem.id), userItem);
        }
        console.log("Users collection seeded successfully.");
      }
    } catch (e) {
      console.warn("Users seeding check skipped or non-authorized: ", e);
    }

    // 3. Settings Seeding
    try {
      const settingsSnap = await getDoc(doc(db, 'system', 'settings'));
      if (!settingsSnap.exists()) {
        let localSystem = DEFAULT_SYSTEM;
        const savedSystem = localStorage.getItem('edudigital_system');
        if (savedSystem) {
          try {
            localSystem = JSON.parse(savedSystem);
          } catch (err) {
            console.error("Gagal parse savedSystem dari localStorage:", err);
          }
        }
        await setDoc(doc(db, 'system', 'settings'), localSystem);
        console.log("Settings document seeded successfully.");
      }
    } catch (e) {
      console.warn("Settings seeding check skipped or non-authorized: ", e);
    }

    // 4. Logs Seeding
    try {
      const logsSnap = await getDocs(collection(db, 'logs'));
      if (logsSnap.empty) {
        let localLogs = INITIAL_LOGS;
        const savedLogs = localStorage.getItem('edudigital_logs');
        if (savedLogs) {
          try {
            const parsed = JSON.parse(savedLogs);
            if (Array.isArray(parsed) && parsed.length > 0) {
              localLogs = parsed;
            }
          } catch (err) {
            console.error("Gagal parse savedLogs dari localStorage:", err);
          }
        }
        for (const logItem of localLogs) {
          await setDoc(doc(db, 'logs', logItem.id), logItem);
        }
        console.log("Logs collection seeded successfully.");
      }
    } catch (e) {
      console.warn("Logs seeding check skipped or non-authorized: ", e);
    }
  };

  // Auth changed listener + user profile sync
  useEffect(() => {
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (gUser) => {
      setIsFirebaseLoading(true);
      if (gUser) {
        setFirebaseUser(gUser);

        const userRef = doc(db, 'users', gUser.uid);
        const userSnap = await getDoc(userRef);

        let matchedUser: UserItem;

        if (userSnap.exists()) {
          matchedUser = userSnap.data() as UserItem;
        } else {
          // Check local users list for pre-existing email match using ref to avoid closures
          const emailMatch = usersRef.current.find(u => u.email.toLowerCase() === (gUser.email || '').toLowerCase());
          
          if (emailMatch) {
            matchedUser = {
              ...emailMatch,
              id: gUser.uid,
              avatarUrl: gUser.photoURL || emailMatch.avatarUrl,
            };
          } else {
            // Give Admin status to the developer running the app or fallback to Viewer
            const isAdminEmail = (gUser.email || '').toLowerCase() === 'wahaniherman600@gmail.com';
            matchedUser = {
              id: gUser.uid,
              name: gUser.displayName || 'Pengguna Baru',
              email: gUser.email || '',
              role: isAdminEmail ? 'Admin' : 'Viewer',
              status: 'active',
              createdAt: new Date().toISOString(),
              avatarUrl: gUser.photoURL || '',
            };
          }
          await setDoc(userRef, matchedUser);
        }

        setCurrentUser(matchedUser);

        // Run seed check AFTER user document is guaranteed to exist so isEditorOrAdmin resolves true
        await seedFirebaseDataIfEmpty();

        await logAction(
          matchedUser.name,
          'berhasil masuk & mensinkronisasi data portal ke cloud',
          'Sesi Firebase Firestore Aktif',
          appsRef.current,
          usersRef.current,
          'success'
        );
      } else {
        setFirebaseUser(null);
        // Reset current active simulated user
        const savedUsers = localStorage.getItem('edudigital_users');
        if (savedUsers) {
          const parsed = JSON.parse(savedUsers) as UserItem[];
          const adminUser = parsed.find((u) => u.role === 'Admin');
          if (adminUser) {
            setCurrentUser(adminUser);
          } else if (parsed.length > 0) {
            setCurrentUser(parsed[0]);
          }
        }
      }
      setIsFirebaseLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time Firestore sync listeners
  useEffect(() => {
    if (!firebaseUser) return;

    const unsubscribe = onSnapshot(query(collection(db, 'apps')), (snapshot) => {
      const list: AppItem[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as AppItem);
      });
      setApps(list);
      localStorage.setItem('edudigital_apps', JSON.stringify(list));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'apps');
    });

    return () => unsubscribe();
  }, [firebaseUser]);

  useEffect(() => {
    if (!firebaseUser) return;

    const unsubscribe = onSnapshot(query(collection(db, 'users')), (snapshot) => {
      const list: UserItem[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as UserItem);
      });
      setUsers(list);
      localStorage.setItem('edudigital_users', JSON.stringify(list));

      const liveMe = list.find(u => u.id === auth.currentUser?.uid);
      if (liveMe) {
        setCurrentUser(liveMe);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });

    return () => unsubscribe();
  }, [firebaseUser]);

  useEffect(() => {
    if (!firebaseUser) return;

    const unsubscribe = onSnapshot(doc(db, 'system', 'settings'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as SystemSettings;
        setSystemSettings(data);
        localStorage.setItem('edudigital_system', JSON.stringify(data));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'system/settings');
    });

    return () => unsubscribe();
  }, [firebaseUser]);

  useEffect(() => {
    if (!firebaseUser) return;

    const unsubscribe = onSnapshot(query(collection(db, 'logs')), (snapshot) => {
      const list: ActivityLog[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as ActivityLog);
      });
      list.sort((a, b) => b.id.localeCompare(a.id));
      setActivityLogs(list);
      localStorage.setItem('edudigital_logs', JSON.stringify(list));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'logs');
    });

    return () => unsubscribe();
  }, [firebaseUser]);

  const handleLoginGoogle = async () => {
    try {
      await loginWithGoogle();
    } catch (e) {
      alert("Masuk lewat Google dibatalkan atau diblokir peramban.");
    }
  };

  const handleLogoutGoogle = async () => {
    try {
      await logoutUser();
      alert("Anda telah keluar dari koordinasi akun Google Firebase.");
    } catch (e) {
      console.error(e);
    }
  };

  // Switch Active user session (simulated)
  const handleSetCurrentUser = (selectedUser: UserItem) => {
    setCurrentUser(selectedUser);
    
    // Sync roles to custom auth session
    localStorage.setItem('edudigital_is_logged_in', 'true');
    setIsLoggedIn(true);
    localStorage.setItem('edudigital_session_role', selectedUser.role);

    logAction(
      'Sistem Sesi',
      'berhasil melakukan otentikasi masuk ke akun',
      `${selectedUser.name} (${selectedUser.role})`,
      apps,
      users,
      'success'
    );
  };

  // --- APPLICATIONS CRUD HANDLERS ---
  const handleAddApp = async (newApp: Omit<AppItem, 'id' | 'createdAt'>) => {
    const appId = `app-${Date.now()}`;
    const createdApp: AppItem = {
      ...newApp,
      id: appId,
      createdAt: new Date().toISOString(),
    };
    
    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'apps', appId), createdApp);
        await logAction(
          currentUser.name,
          'menambahkan aplikasi baru',
          `"${newApp.name}" (${newApp.category})`,
          apps,
          users,
          'success'
        );
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, `apps/${appId}`);
      }
    } else {
      const updatedList = [createdApp, ...apps];
      logAction(
        currentUser.name,
        'menambahkan aplikasi baru',
        `"${newApp.name}" (${newApp.category})`,
        updatedList,
        users,
        'success'
      );
    }
  };

  const handleEditApp = async (appId: string, updatedFields: Partial<AppItem>) => {
    const targetApp = apps.find((app) => app.id === appId);
    if (!targetApp) return;
    const merged = { ...targetApp, ...updatedFields };

    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'apps', appId), merged);
        await logAction(
          currentUser.name,
          'memperbarui rincian spesifikasi aplikasi',
          `"${targetApp.name}"`,
          apps,
          users,
          'info'
        );
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `apps/${appId}`);
      }
    } else {
      const updatedList = apps.map((app) => (app.id === appId ? { ...app, ...updatedFields } : app));
      logAction(
        currentUser.name,
        'memperbarui rincian spesifikasi aplikasi',
        `"${targetApp.name}"`,
        updatedList,
        users,
        'info'
      );
    }
  };

  const handleDeleteApp = async (appId: string) => {
    const targetApp = apps.find((app) => app.id === appId);
    if (!targetApp) return;

    if (firebaseUser) {
      try {
        await deleteDoc(doc(db, 'apps', appId));
        await logAction(
          currentUser.name,
          'menghapus aplikasi secara permanen',
          `"${targetApp.name}"`,
          apps,
          users,
          'error'
        );
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `apps/${appId}`);
      }
    } else {
      const updatedList = apps.filter((app) => app.id !== appId);
      logAction(
        currentUser.name,
        'menghapus aplikasi secara permanen',
        `"${targetApp.name}"`,
        updatedList,
        users,
        'error'
      );
    }
  };

  const handleQuickToggleStatus = async (appId: string) => {
    const targetApp = apps.find((app) => app.id === appId);
    if (!targetApp) return;
    
    const newStatus: 'active' | 'inactive' = targetApp.status === 'active' ? 'inactive' : 'active';
    const merged = { ...targetApp, status: newStatus };

    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'apps', appId), merged);
        await logAction(
          currentUser.name,
          newStatus === 'active' ? 'mengaktifkan kembali akses aplikasi' : 'menonaktifkan sementara akses aplikasi',
          `"${targetApp.name}"`,
          apps,
          users,
          newStatus === 'active' ? 'success' : 'warn'
        );
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `apps/${appId}`);
      }
    } else {
      const updatedList = apps.map((app) => (app.id === appId ? { ...app, status: newStatus } : app));
      logAction(
        currentUser.name,
        newStatus === 'active' ? 'mengaktifkan kembali akses aplikasi' : 'menonaktifkan sementara akses aplikasi',
        `"${targetApp.name}"`,
        updatedList,
        users,
        newStatus === 'active' ? 'success' : 'warn'
      );
    }
  };

  // --- USERS CRUD HANDLERS ---
  const handleAddUser = async (newUser: Omit<UserItem, 'id' | 'createdAt'>) => {
    const userId = `usr-${Date.now()}`;
    const createdUser: UserItem = {
      ...newUser,
      id: userId,
      createdAt: new Date().toISOString(),
    };

    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'users', userId), createdUser);
        await logAction(
          currentUser.name,
          'mendaftarkan pengguna baru',
          `"${newUser.name}" dengan akses [${newUser.role}]`,
          apps,
          users,
          'success'
        );
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, `users/${userId}`);
      }
    } else {
      const updatedList = [createdUser, ...users];
      logAction(
        currentUser.name,
        'mendaftarkan pengguna baru',
        `"${newUser.name}" dengan akses [${newUser.role}]`,
        apps,
        updatedList,
        'success'
      );
    }
  };

  const handleEditUser = async (userId: string, updatedFields: Partial<UserItem>) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;
    const merged = { ...targetUser, ...updatedFields };

    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'users', userId), merged);
        
        // If we've edited currently active user, keep our local state in sync
        if (userId === currentUser.id) {
          setCurrentUser(merged);
        }

        await logAction(
          currentUser.name,
          'memodifikasi informasi akun anggota',
          `"${targetUser.name}"`,
          apps,
          users,
          'info'
        );
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `users/${userId}`);
      }
    } else {
      const updatedList = users.map((u) => (u.id === userId ? { ...u, ...updatedFields } : u));
      
      // If we've edited currently active user, keep our local state in sync
      if (userId === currentUser.id) {
        const liveUserObj = updatedList.find((u) => u.id === userId);
        if (liveUserObj) setCurrentUser(liveUserObj);
      }

      logAction(
        currentUser.name,
        'memodifikasi informasi akun anggota',
        `"${targetUser.name}"`,
        apps,
        updatedList,
        'info'
      );
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    if (firebaseUser) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        await logAction(
          currentUser.name,
          'menghapus hak keanggotaan pengguna',
          `"${targetUser.name}"`,
          apps,
          users,
          'error'
        );
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `users/${userId}`);
      }
    } else {
      const updatedList = users.filter((u) => u.id !== userId);
      logAction(
        currentUser.name,
        'menghapus hak keanggotaan pengguna',
        `"${targetUser.name}"`,
        apps,
        updatedList,
        'error'
      );
    }
  };

  // --- CUSTOM PORTAL AUTHENTICATION HANDLERS ---
  const handleLoginSuccess = (role: 'Admin' | 'Viewer', name: string) => {
    setIsLoggedIn(true);
    localStorage.setItem('edudigital_is_logged_in', 'true');
    localStorage.setItem('edudigital_session_role', role);

    const activeUser = users.find((u) => u.role === role);
    if (activeUser) {
      setCurrentUser(activeUser);
    } else {
      const defaultUser = DEFAULT_USERS.find((u) => u.role === role);
      if (defaultUser) {
        setCurrentUser(defaultUser);
      }
    }

    if (role === 'Viewer') {
      const allowDashboard = systemSettings.allowPesertaDashboard !== false;
      if (allowDashboard) {
        setTab('dashboard');
      } else {
        setTab('portal');
      }
    } else {
      setTab('dashboard');
    }

    logAction('Sistem Sesi', 'berhasil masuk portal', `sebagai ${name} (${role})`, apps, users, 'success');
  };

  const handleLogoutPortal = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('edudigital_is_logged_in');
    localStorage.removeItem('edudigital_session_role');
    setTab('dashboard');
    logAction('Sistem Sesi', 'keluar dari portal', `mengakhiri sesi secara aman`, apps, users, 'info');
  };

  // Tab routing guard for Participant (Viewer) role limits
  useEffect(() => {
    if (isLoggedIn && currentUser.role === 'Viewer') {
      const allowDashboard = systemSettings.allowPesertaDashboard !== false;
      const allowPortal = systemSettings.allowPesertaPortal !== false;

      if (currentTab === 'dashboard' && !allowDashboard) {
        if (allowPortal) {
          setTab('portal');
        }
      } else if (currentTab === 'portal' && !allowPortal) {
        if (allowDashboard) {
          setTab('dashboard');
        }
      } else if (
        currentTab === 'manage-apps' ||
        currentTab === 'manage-users' ||
        currentTab === 'admin-settings'
      ) {
        if (allowPortal) {
          setTab('portal');
        } else if (allowDashboard) {
          setTab('dashboard');
        }
      }
    }
  }, [currentTab, isLoggedIn, currentUser, systemSettings]);

  // Access Restricted Render view
  const renderAccessRestrictedFallback = () => {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-white border border-slate-100 rounded-3xl shadow-sm py-16 animate-fade-in max-w-xl mx-auto my-12" id="akses-terbatas-container">
        <div className="p-4 bg-orange-50 text-orange-500 rounded-2xl mb-4">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Akses Fitur Ditutup oleh Admin</h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-sm">
          Maaf, saat ini administrator EduDigital telah menonaktifkan seluruh fitur akses interaktif untuk akun Anda. Silakan hubungi operator kami untuk informasi pemulihan lebih lanjut.
        </p>
        <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100 text-left w-full space-y-1.5 text-xs text-slate-600">
          <p><strong>Narahubung IT:</strong> {systemSettings.contactEmail || 'admin@edudigital.id'}</p>
          <p><strong>Tahun Ajaran:</strong> {systemSettings.schoolYear || '2026/2027'}</p>
        </div>
        <button
          onClick={handleLogoutPortal}
          className="mt-6 px-6 py-2.5 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 transition cursor-pointer shadow-sm"
        >
          Keluar Sesi Sekarang
        </button>
      </div>
    );
  };

  // --- HARD TRIGGER SESSION RESET ---
  const handleResetSession = () => {
    localStorage.removeItem('edudigital_apps');
    localStorage.removeItem('edudigital_users');
    localStorage.removeItem('edudigital_logs');
    localStorage.removeItem('edudigital_system');
    localStorage.removeItem('edudigital_is_logged_in');
    localStorage.removeItem('edudigital_session_role');

    setApps(DEFAULT_APPS);
    setUsers(DEFAULT_USERS);
    setActivityLogs(INITIAL_LOGS);
    setSystemSettings(DEFAULT_SYSTEM);
    setCurrentUser(DEFAULT_USERS[0]);
    setIsLoggedIn(true); // Login defaults to true for immediate exploration
    setTab('dashboard');

    setTimeout(() => {
      alert("Hore! Seluruh database lokal EduDigital berhasil di-reset ke nilai default sesuai rujukan awal.");
    }, 150);
  };

  // Tab View Distributor / Switch
  const renderCurrentView = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardView
            apps={apps}
            users={users}
            currentUser={currentUser}
            activityLogs={activityLogs}
            setTab={setTab}
            onQuickToggleStatus={handleQuickToggleStatus}
            onOpenAddAppModal={() => {
              setTab('manage-apps');
              setIsOpenAddDirectly(true);
            }}
            systemSettings={systemSettings}
          />
        );
      case 'portal':
        return (
          <PortalView
            apps={apps}
            currentUser={currentUser}
            onQuickToggleStatus={handleQuickToggleStatus}
          />
        );
      case 'manage-apps':
        return (
          <ManageAppsView
            apps={apps}
            currentUser={currentUser}
            onAddApp={handleAddApp}
            onEditApp={handleEditApp}
            onDeleteApp={handleDeleteApp}
            onQuickToggleStatus={handleQuickToggleStatus}
            isOpenAddDirectly={isOpenAddDirectly}
            onCloseDirectAdd={() => setIsOpenAddDirectly(false)}
          />
        );
      case 'manage-users':
        return (
          <ManageUsersView
            users={users}
            currentUser={currentUser}
            onAddUser={handleAddUser}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
          />
        );
      case 'admin-settings':
        return (
          <AdminSettingsView
            currentUser={currentUser}
            users={users}
            systemSettings={systemSettings}
            onUpdateCurrentUser={(updatedFields) => {
              if (firebaseUser) {
                handleEditUser(currentUser.id, updatedFields);
              } else {
                const updatedList = users.map((u) => {
                  if (u.id === currentUser.id) {
                    return { ...u, ...updatedFields };
                  }
                  return u;
                });
                setCurrentUser({ ...currentUser, ...updatedFields });
                saveState(apps, updatedList, activityLogs);
              }
            }}
            onUpdateSystemSettings={saveSystemState}
            onLogAction={(action, details, type) => {
              logAction(currentUser.name, action, details, apps, users, type);
            }}
          />
        );
      default:
        return null;
    }
  };

  // Render Login view if user is not authenticated
  if (!isLoggedIn) {
    return (
      <LoginView onLoginSuccess={handleLoginSuccess} />
    );
  }

  // Determine if both default views are restricted for viewer role
  const isViewer = currentUser.role === 'Viewer';
  const hasNoViewerAccess = isViewer && 
    (systemSettings.allowPesertaDashboard === false) && 
    (systemSettings.allowPesertaPortal === false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans" id="root-portal-view">
      {/* Permanent Left Sidebar (Mobile responsive drawer included) */}
      <Sidebar
        currentTab={currentTab}
        setTab={setTab}
        isOpenMobile={isOpenMobileSidebar}
        setIsOpenMobile={setIsOpenMobileSidebar}
        currentUser={currentUser}
        systemSettings={systemSettings}
      />

      {/* Main Right Content Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Dynamic header with title, profiles, mobile Hamburger toggle and actions */}
        <Header
          currentTab={currentTab}
          currentUser={currentUser}
          users={users}
          setCurrentUser={handleSetCurrentUser}
          setIsOpenMobileSidebar={setIsOpenMobileSidebar}
          onResetSession={handleResetSession}
          firebaseUser={firebaseUser}
          onLoginWithGoogle={handleLoginGoogle}
          onLogoutWithGoogle={handleLogoutGoogle}
          onLogoutPortal={handleLogoutPortal}
        />

        {/* Scrollable Sub-view Arena */}
        <main className="flex-1 overflow-y-auto bg-[#F9FAFB]/95 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {hasNoViewerAccess ? renderAccessRestrictedFallback() : renderCurrentView()}
          </div>
        </main>
      </div>
    </div>
  );
}

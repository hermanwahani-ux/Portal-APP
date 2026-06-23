/**
 * Shared types for EduDigital Admin Portal
 */

export interface AppItem {
  id: string;
  name: string;
  description: string;
  url: string;
  status: 'active' | 'inactive';
  category: string;
  icon: string;
  createdAt: string;
}

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Editor' | 'Viewer';
  status: 'active' | 'suspended';
  createdAt: string;
  avatarUrl?: string; // Optional URL for profile photo icon
}

export type CurrentTab = 'dashboard' | 'portal' | 'manage-apps' | 'manage-users' | 'admin-settings';

export interface SystemSettings {
  portalName: string;
  schoolYear: string;
  contactEmail: string;
  logoUrl: string; // School emblem photo hotlink URL
  accentColor: string; // Tailwind class name or Hex color
  allowPesertaDashboard?: boolean;
  allowPesertaPortal?: boolean;
  allowPesertaLogs?: boolean;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

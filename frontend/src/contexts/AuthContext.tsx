import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type AppRole = 'staff' | 'approver' | 'supervisor' | 'admin' | 'external';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  department: string;
  avatar?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for each role
const MOCK_USERS: Record<string, AuthUser & { password: string }> = {
  'staff@docflow.com': {
    id: 'u-1', name: 'Alice Cooper', email: 'staff@docflow.com',
    role: 'staff', department: 'Operations', password: 'password',
  },
  'approver@docflow.com': {
    id: 'u-2', name: 'Sarah Johnson', email: 'approver@docflow.com',
    role: 'approver', department: 'Finance', password: 'password',
  },
  'supervisor@docflow.com': {
    id: 'u-3', name: 'Robert Chen', email: 'supervisor@docflow.com',
    role: 'supervisor', department: 'Management', password: 'password',
  },
  'admin@docflow.com': {
    id: 'u-4', name: 'John Smith', email: 'admin@docflow.com',
    role: 'admin', department: 'IT', password: 'password',
  },
  'external@docflow.com': {
    id: 'ext-1', name: 'James Parker', email: 'external@docflow.com',
    role: 'external', department: 'Acme Supplies Ltd', password: 'password',
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('docflow_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const found = MOCK_USERS[email.toLowerCase()];
    if (found && found.password === password) {
      const { password: _, ...userData } = found;
      setUser(userData);
      localStorage.setItem('docflow_user', JSON.stringify(userData));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('docflow_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export const ROLE_LABELS: Record<AppRole, string> = {
  staff: 'Staff / Initiator',
  approver: 'Approver',
  supervisor: 'Supervisor / Manager',
  admin: 'Admin',
  external: 'External Party',
};

export const DASHBOARD_ROUTES: Record<AppRole, string> = {
  staff: '/dashboard/staff',
  approver: '/dashboard/approver',
  supervisor: '/dashboard/supervisor',
  admin: '/dashboard/admin',
  external: '/external/dashboard',
};

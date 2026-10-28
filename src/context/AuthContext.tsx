import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api.ts';

export interface User {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  departmentId?: string;
  managerId?: string;
  jobTitle: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  switchUser: (userId: string) => Promise<void>;
  refreshMe: () => Promise<void>;
  isAdmin: boolean;
  isManager: boolean;
  isEmployee: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('trainsure_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('trainsure_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await authApi.getMe();
          if (res.data?.success && res.data.data) {
            setUser(res.data.data);
            localStorage.setItem('trainsure_user', JSON.stringify(res.data.data));
          }
        } catch {
          // If token expired, clear session
          setUser(null);
          setToken(null);
          localStorage.removeItem('trainsure_token');
          localStorage.removeItem('trainsure_user');
        }
      }
      setIsLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email: string, pass: string) => {
    const res = await authApi.login({ email, password: pass });
    if (res.data?.success && res.data.data) {
      const { token: newToken, user: newUser } = res.data.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('trainsure_token', newToken);
      localStorage.setItem('trainsure_user', JSON.stringify(newUser));
    } else {
      throw new Error(res.data?.message || 'Login failed');
    }
  };

  const logout = () => {
    authApi.logout().catch(() => {});
    setUser(null);
    setToken(null);
    localStorage.removeItem('trainsure_token');
    localStorage.removeItem('trainsure_user');
  };

  const switchUser = async (userId: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.switchDemo(userId);
      if (res.data?.success && res.data.data) {
        const { token: newToken, user: newUser } = res.data.data;
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('trainsure_token', newToken);
        localStorage.setItem('trainsure_user', JSON.stringify(newUser));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshMe = async () => {
    if (!token) return;
    try {
      const res = await authApi.getMe();
      if (res.data?.success && res.data.data) {
        setUser(res.data.data);
        localStorage.setItem('trainsure_user', JSON.stringify(res.data.data));
      }
    } catch {
      // ignore
    }
  };

  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER';
  const isEmployee = user?.role === 'EMPLOYEE';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        switchUser,
        refreshMe,
        isAdmin,
        isManager,
        isEmployee,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

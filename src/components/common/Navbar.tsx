import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { NotificationBell } from './NotificationBell.tsx';
import {
  Shield,
  UserCheck,
  Briefcase,
  LogOut,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import { authApi } from '../../services/api.ts';

export const Navbar: React.FC = () => {
  const { user, logout, switchUser } = useAuth();
  const [demoUsers, setDemoUsers] = useState<any[]>([]);
  const [showSwitchDropdown, setShowSwitchDropdown] = useState(false);

  useEffect(() => {
    authApi
      .getDemoUsers()
      .then(res => {
        if (res.data?.success) {
          setDemoUsers(res.data.data || []);
        }
      })
      .catch(() => {});
  }, []);

  const roleBadge = () => {
    if (user?.role === 'ADMIN') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
          <Shield className="w-3 h-3" />
          Admin
        </span>
      );
    }
    if (user?.role === 'MANAGER') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
          <Briefcase className="w-3 h-3" />
          Manager
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
        <UserCheck className="w-3 h-3" />
        Employee
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-4 sm:px-6 py-2.5">
      <div className="flex items-center justify-between">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold tracking-tight shadow-xs">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 font-mono">
                TrainSure
              </span>
              <span className="hidden sm:inline-block ml-2 text-[11px] text-slate-400 font-medium border-l border-slate-200 pl-2">
                Workforce Capability Platform
              </span>
            </div>
          </div>
        </div>

        {/* Right Tools & Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Quick Demo Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowSwitchDropdown(!showSwitchDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer border border-slate-200/60"
              title="Switch demo persona to test RBAC roles"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden md:inline">Switch Role:</span>
              <span className="font-semibold text-slate-900">{user?.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showSwitchDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-2 animate-in fade-in duration-100">
                <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Test Personas (Instant RBAC Switch)
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                  {demoUsers.map(u => (
                    <button
                      key={u._id}
                      onClick={() => {
                        setShowSwitchDropdown(false);
                        switchUser(u._id);
                      }}
                      className={`w-full text-left px-2.5 py-2 hover:bg-indigo-50/60 rounded-md transition-colors flex items-center justify-between cursor-pointer ${
                        user?._id === u._id ? 'bg-indigo-50 font-semibold' : ''
                      }`}
                    >
                      <div>
                        <p className="text-xs text-slate-900 font-medium">{u.name}</p>
                        <p className="text-[11px] text-slate-500">{u.jobTitle}</p>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          u.role === 'ADMIN'
                            ? 'bg-rose-100 text-rose-700'
                            : u.role === 'MANAGER'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {u.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* In-App Notifications */}
          <NotificationBell />

          {/* User Profile Mini & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="hidden lg:block text-right">
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-xs font-semibold text-slate-900">{user?.name}</span>
                {roleBadge()}
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-44">{user?.jobTitle}</p>
            </div>

            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { User, Resource, LogEntry, SystemConfig, Role, SecurityLevel, Department } from './types';
import { INITIAL_CONFIG, MOCK_USERS, MOCK_RESOURCES } from './constants';
import { Shield, Users, FileText, Activity, LogOut, Settings, LayoutDashboard, Menu, X, UserCircle } from 'lucide-react';
import AuthScreen from './components/Auth';
import AccessControlPanel from './components/AccessControlPanel';
import ResourceList from './components/ResourceList';
import AuditLog from './components/AuditLog';
import Profile from './components/Profile';

// --- Context ---
interface SecurityContextType {
  currentUser: User | null;
  users: User[];
  resources: Resource[];
  logs: LogEntry[];
  config: SystemConfig;
  login: (user: User) => void;
  logout: () => void;
  addLog: (action: string, status: 'SUCCESS' | 'DENIED' | 'ERROR', details: string, resourceId?: string) => void;
  updateConfig: (newConfig: SystemConfig) => void;
  updateResource: (resource: Resource) => void;
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  recordLoginAttempt: (username: string, success: boolean) => void;
}

const SecurityContext = createContext<SecurityContextType | null>(null);

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) throw new Error("useSecurity must be used within a SecurityProvider");
  return context;
};

// --- Main App Component ---
const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [resources, setResources] = useState<Resource[]>(MOCK_RESOURCES);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [config, setConfig] = useState<SystemConfig>(INITIAL_CONFIG);
  const [currentView, setCurrentView] = useState<'DASHBOARD' | 'CONTACTS' | 'ADMIN' | 'LOGS' | 'PROFILE'>('DASHBOARD');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Helper to add logs
  const addLog = useCallback((action: string, status: 'SUCCESS' | 'DENIED' | 'ERROR', details: string, resourceId?: string) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      actorId: currentUser?.id || 'anonymous',
      actorName: currentUser?.username || 'Anonymous',
      action,
      status,
      details,
      resourceId,
      ipAddress: '192.168.1.10' // Simulated IP
    };
    setLogs(prev => [newLog, ...prev]);
  }, [currentUser]);

  // System Events Logging (Startup)
  useEffect(() => {
    addLog('SYSTEM_STARTUP', 'SUCCESS', 'System initialized successfully', undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    // Reset failures on success
    recordLoginAttempt(user.username, true);
    addLog('USER_LOGIN', 'SUCCESS', `User ${user.username} logged in successfully`);
  };

  const handleLogout = () => {
    addLog('USER_LOGOUT', 'SUCCESS', `User ${currentUser?.username} logged out`);
    setCurrentUser(null);
    setCurrentView('DASHBOARD');
  };

  const handleResourceUpdate = (updatedResource: Resource) => {
    setResources(prev => prev.map(r => r.id === updatedResource.id ? updatedResource : r));
    addLog('RESOURCE_UPDATE', 'SUCCESS', `Resource ${updatedResource.name} updated`, updatedResource.id);
  };

  const handleConfigUpdate = (newConfig: SystemConfig) => {
    if (currentUser?.role === Role.ADMIN) {
        setConfig(newConfig);
        addLog('SYSTEM_CONFIG_CHANGE', 'SUCCESS', 'Security policies updated');
    } else {
        addLog('SYSTEM_CONFIG_CHANGE', 'DENIED', 'Unauthorized attempt to change config');
    }
  };

  const handleAddUser = (newUser: User) => {
      setUsers([...users, newUser]);
      addLog('USER_REGISTER', 'SUCCESS', `New user registered: ${newUser.username}`);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    // If updating self
    if (currentUser?.id === updatedUser.id) {
        setCurrentUser(updatedUser);
    }
    // Don't log basic profile updates here if called frequently, but good for role changes
    if (currentUser?.role === Role.ADMIN && currentUser.id !== updatedUser.id) {
         addLog('USER_ADMIN_UPDATE', 'SUCCESS', `Admin updated user: ${updatedUser.username}`);
    }
  };

  const recordLoginAttempt = (username: string, success: boolean) => {
    setUsers(prev => prev.map(u => {
        if (u.username === username) {
            if (success) {
                return { ...u, failedLoginAttempts: 0, isLocked: false };
            } else {
                const newAttempts = u.failedLoginAttempts + 1;
                const isNowLocked = newAttempts >= 3;
                return { 
                    ...u, 
                    failedLoginAttempts: newAttempts, 
                    isLocked: isNowLocked 
                };
            }
        }
        return u;
    }));
  };

  // --- Views ---

  if (!currentUser) {
    return (
      <SecurityContext.Provider value={{ 
          currentUser, users, resources, logs, config, 
          login: handleLogin, logout: handleLogout, addLog, 
          updateConfig: handleConfigUpdate, updateResource: handleResourceUpdate, 
          addUser: handleAddUser, updateUser: handleUpdateUser, recordLoginAttempt 
      }}>
        <AuthScreen />
      </SecurityContext.Provider>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return <DashboardHome />;
      case 'CONTACTS':
        return <ResourceList />;
      case 'ADMIN':
        return <AccessControlPanel />;
      case 'LOGS':
        return <AuditLog />;
      case 'PROFILE':
        return <Profile />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <SecurityContext.Provider value={{ 
        currentUser, users, resources, logs, config, 
        login: handleLogin, logout: handleLogout, addLog, 
        updateConfig: handleConfigUpdate, updateResource: handleResourceUpdate, 
        addUser: handleAddUser, updateUser: handleUpdateUser, recordLoginAttempt 
    }}>
      <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
        {/* Sidebar (Desktop) */}
        <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white shadow-xl z-20">
          <div className="p-6 border-b border-slate-700 flex items-center space-x-3">
             <div className="bg-indigo-500 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
             </div>
             <div>
                <h1 className="text-lg font-bold tracking-tight">SecureGuard</h1>
                <p className="text-xs text-slate-400">CMS v2.4.0</p>
             </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            <NavButton active={currentView === 'DASHBOARD'} onClick={() => setCurrentView('DASHBOARD')} icon={<LayoutDashboard size={20} />} label="Dashboard" />
            <NavButton active={currentView === 'CONTACTS'} onClick={() => setCurrentView('CONTACTS')} icon={<Users size={20} />} label="Contacts & Files" />
            <NavButton active={currentView === 'LOGS'} onClick={() => setCurrentView('LOGS')} icon={<Activity size={20} />} label="Audit Logs" />
            
            {currentUser.role === Role.ADMIN && (
               <div className="pt-6 mt-6 border-t border-slate-700">
                  <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Administration</p>
                  <NavButton active={currentView === 'ADMIN'} onClick={() => setCurrentView('ADMIN')} icon={<Settings size={20} />} label="Access Controls" />
               </div>
            )}
          </nav>

          <div className="p-4 bg-slate-800 border-t border-slate-700">
            <button 
                onClick={() => setCurrentView('PROFILE')}
                className={`flex items-center space-x-3 mb-3 w-full p-2 rounded-lg transition-colors ${currentView === 'PROFILE' ? 'bg-slate-700' : 'hover:bg-slate-700'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentUser.role === Role.ADMIN ? 'bg-red-500' : 'bg-emerald-500'}`}>
                  {currentUser.username[0].toUpperCase()}
              </div>
              <div className="text-left overflow-hidden">
                <p className="text-sm font-medium truncate">{currentUser.fullName}</p>
                <p className="text-xs text-slate-400 truncate">{currentUser.role} | {SecurityLevel[currentUser.clearanceLevel]}</p>
              </div>
            </button>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 bg-slate-700 hover:bg-slate-600 py-2 rounded text-sm transition-colors"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 w-full bg-slate-900 text-white z-30 flex items-center justify-between p-4">
             <div className="flex items-center space-x-2">
                <Shield className="w-6 h-6 text-indigo-400" />
                <span className="font-bold">SecureGuard</span>
             </div>
             <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X /> : <Menu />}
             </button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
           <div className="md:hidden fixed inset-0 bg-slate-900 z-20 pt-20 px-6 space-y-4">
               <NavButton active={currentView === 'DASHBOARD'} onClick={() => { setCurrentView('DASHBOARD'); setIsMobileMenuOpen(false); }} icon={<LayoutDashboard size={20} />} label="Dashboard" />
               <NavButton active={currentView === 'CONTACTS'} onClick={() => { setCurrentView('CONTACTS'); setIsMobileMenuOpen(false); }} icon={<Users size={20} />} label="Contacts" />
               <NavButton active={currentView === 'LOGS'} onClick={() => { setCurrentView('LOGS'); setIsMobileMenuOpen(false); }} icon={<Activity size={20} />} label="Audit Logs" />
               <NavButton active={currentView === 'PROFILE'} onClick={() => { setCurrentView('PROFILE'); setIsMobileMenuOpen(false); }} icon={<UserCircle size={20} />} label="My Profile" />
                {currentUser.role === Role.ADMIN && (
                  <NavButton active={currentView === 'ADMIN'} onClick={() => { setCurrentView('ADMIN'); setIsMobileMenuOpen(false); }} icon={<Settings size={20} />} label="Access Controls" />
                )}
                <button onClick={handleLogout} className="flex items-center space-x-3 text-red-400 mt-8 font-medium">
                  <LogOut size={20} /> <span>Sign Out</span>
                </button>
           </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto pt-16 md:pt-0">
          <div className="max-w-7xl mx-auto p-4 md:p-8">
            {renderView()}
          </div>
        </main>
      </div>
    </SecurityContext.Provider>
  );
};

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-md transition-all duration-200 ${
      active 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`}
  >
    {icon}
    <span className="font-medium text-sm">{label}</span>
  </button>
);

const DashboardHome = () => {
  const { users, resources, logs, config } = useSecurity();
  const deniedAttempts = logs.filter(l => l.status === 'DENIED').length;
  const activePolicies = [
    config.enableMAC && 'MAC', 
    config.enableDAC && 'DAC', 
    config.enableRBAC && 'RBAC', 
    config.enableABAC && 'ABAC',
    config.enableRuBAC && 'RuBAC'
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
         <div>
            <h2 className="text-2xl font-bold text-slate-800">Security Overview</h2>
            <p className="text-slate-500">System Status: <span className="text-emerald-600 font-semibold">Operational</span></p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={users.length} icon={<Users className="text-blue-500" />} />
        <StatCard title="Protected Assets" value={resources.length} icon={<FileText className="text-purple-500" />} />
        <StatCard title="Security Incidents" value={deniedAttempts} icon={<Activity className="text-red-500" />} color="red" />
        <StatCard title="Active Policies" value={activePolicies} icon={<Shield className="text-emerald-500" />} />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
         <h3 className="text-lg font-semibold mb-4 text-slate-800">Recent Activity</h3>
         <div className="space-y-4">
            {logs.slice(0, 5).map(log => (
               <div key={log.id} className="flex items-start justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center space-x-3">
                     <div className={`p-2 rounded-full ${log.status === 'SUCCESS' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {log.status === 'SUCCESS' ? <Shield size={14} className="text-green-600"/> : <Activity size={14} className="text-red-600"/>}
                     </div>
                     <div>
                        <p className="text-sm font-medium text-slate-900">{log.action}</p>
                        <p className="text-xs text-slate-500">{log.actorName} - {log.details}</p>
                     </div>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString()}</span>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color = 'slate' }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className={`text-2xl font-bold text-${color}-900`}>{value}</p>
    </div>
    <div className="p-3 bg-slate-50 rounded-lg">
      {icon}
    </div>
  </div>
);

export default App;
import React, { useState } from 'react';
import { useSecurity } from '../App';
import { Shield, Clock, Briefcase, Lock, UserCheck, Users, Edit3, Unlock } from 'lucide-react';
import { SystemConfig, Role, Department, SecurityLevel, User } from '../types';

const AccessControlPanel: React.FC = () => {
  const { config, updateConfig, currentUser, users, updateUser } = useSecurity();
  const [activeTab, setActiveTab] = useState<'POLICIES' | 'USERS'>('POLICIES');

  // Guard
  if (currentUser?.role !== 'ADMIN') return <div className="text-red-500">Access Denied</div>;

  const togglePolicy = (key: keyof SystemConfig) => {
    if (typeof config[key] === 'boolean') {
        updateConfig({ ...config, [key]: !config[key] });
    }
  };

  const handleTimeChange = (type: 'start' | 'end', val: string) => {
      const num = parseInt(val);
      if (!isNaN(num) && num >= 0 && num <= 23) {
          updateConfig({ ...config, [type === 'start' ? 'workingHoursStart' : 'workingHoursEnd']: num });
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 border-b border-slate-200 pb-2">
          <button onClick={() => setActiveTab('POLICIES')} className={`px-4 py-2 font-medium text-sm rounded-lg transition ${activeTab === 'POLICIES' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>
              System Policies
          </button>
          <button onClick={() => setActiveTab('USERS')} className={`px-4 py-2 font-medium text-sm rounded-lg transition ${activeTab === 'USERS' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>
              User Management
          </button>
      </div>

      {activeTab === 'POLICIES' ? (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                <Shield className="mr-3 text-red-600" /> Access Control Models
            </h2>
            <p className="text-slate-500 mb-8 max-w-2xl">
                Configure the mandatory and discretionary access control models enforced by the system kernel.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <PolicyCard 
                    title="MAC" 
                    subtitle="Mandatory Access Control"
                    description="Enforce strict clearance levels (Top Secret, Confidential, etc.). Users cannot see data above their clearance."
                    active={config.enableMAC}
                    onToggle={() => togglePolicy('enableMAC')}
                    icon={<Lock />}
                />
                <PolicyCard 
                    title="DAC" 
                    subtitle="Discretionary Access Control"
                    description="Allow owners to share resources. Access requires ownership or explicit sharing."
                    active={config.enableDAC}
                    onToggle={() => togglePolicy('enableDAC')}
                    icon={<UserCheck />}
                />
                <PolicyCard 
                    title="RBAC" 
                    subtitle="Role-Based Access Control"
                    description="Restrict actions based on role (Admin, Manager, Staff). Enforces job function boundaries."
                    active={config.enableRBAC}
                    onToggle={() => togglePolicy('enableRBAC')}
                    icon={<Briefcase />}
                />
                <PolicyCard 
                    title="ABAC" 
                    subtitle="Attribute-Based Access Control"
                    description="Fine-grained control comparing User Attributes (Dept) vs Resource Attributes."
                    active={config.enableABAC}
                    onToggle={() => togglePolicy('enableABAC')}
                    icon={<Shield />}
                />
                <PolicyCard 
                    title="RuBAC" 
                    subtitle="Rule-Based Access Control"
                    description="Apply conditional rules. e.g., No access outside working hours."
                    active={config.enableRuBAC}
                    onToggle={() => togglePolicy('enableRuBAC')}
                    icon={<Clock />}
                >
                    {config.enableRuBAC && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Working Hours (24h)</label>
                            <div className="flex items-center space-x-2 mt-2">
                                <input type="number" min="0" max="23" value={config.workingHoursStart} onChange={(e) => handleTimeChange('start', e.target.value)} className="w-16 p-1 border rounded text-center text-sm" />
                                <span>to</span>
                                <input type="number" min="0" max="23" value={config.workingHoursEnd} onChange={(e) => handleTimeChange('end', e.target.value)} className="w-16 p-1 border rounded text-center text-sm" />
                            </div>
                        </div>
                    )}
                </PolicyCard>
            </div>
          </div>
      ) : (
          <UserManagement users={users} onUpdateUser={updateUser} />
      )}
    </div>
  );
};

const UserManagement = ({ users, onUpdateUser }: { users: User[], onUpdateUser: (u: User) => void }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<User>>({});

    const startEdit = (user: User) => {
        setEditingId(user.id);
        setEditForm(user);
    };

    const saveEdit = () => {
        if (editingId && editForm.id) {
            // Find original to merge properly
            const original = users.find(u => u.id === editingId);
            if (original) {
                onUpdateUser({ ...original, ...editForm });
                setEditingId(null);
            }
        }
    };

    const unlockUser = (user: User) => {
        onUpdateUser({ ...user, isLocked: false, failedLoginAttempts: 0 });
        alert(`User ${user.username} unlocked.`);
    }

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
             <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                <Users className="mr-3" /> Role & Access Assignment
            </h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                        <tr>
                            <th className="p-3">User</th>
                            <th className="p-3">Role (RBAC)</th>
                            <th className="p-3">Department (ABAC)</th>
                            <th className="p-3">Clearance (MAC)</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map(user => (
                            <tr key={user.id} className={editingId === user.id ? 'bg-indigo-50' : ''}>
                                <td className="p-3 font-medium">
                                    {user.fullName}
                                    <div className="text-xs text-slate-400">{user.username}</div>
                                </td>
                                
                                {editingId === user.id ? (
                                    <>
                                        <td className="p-3">
                                            <select value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value as Role})} className="border rounded p-1">
                                                {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                        </td>
                                        <td className="p-3">
                                            <select value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value as Department})} className="border rounded p-1">
                                                {Object.values(Department).map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        </td>
                                        <td className="p-3">
                                            <select value={editForm.clearanceLevel} onChange={e => setEditForm({...editForm, clearanceLevel: parseInt(e.target.value)})} className="border rounded p-1">
                                                {Object.values(SecurityLevel).filter(x => typeof x === 'number').map(l => (
                                                    <option key={l} value={l}>{SecurityLevel[l as number]}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="p-3">
                                            {user.isLocked && <span className="text-red-500 font-bold">LOCKED</span>}
                                        </td>
                                        <td className="p-3 space-x-2">
                                            <button onClick={saveEdit} className="text-green-600 hover:underline">Save</button>
                                            <button onClick={() => setEditingId(null)} className="text-slate-500 hover:underline">Cancel</button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="p-3"><span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold">{user.role}</span></td>
                                        <td className="p-3">{user.department}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded text-white text-xs font-bold ${
                                                user.clearanceLevel === SecurityLevel.TOP_SECRET ? 'bg-red-500' :
                                                user.clearanceLevel === SecurityLevel.CONFIDENTIAL ? 'bg-orange-500' : 
                                                user.clearanceLevel === SecurityLevel.INTERNAL ? 'bg-blue-500' : 'bg-green-500'
                                            }`}>
                                                {SecurityLevel[user.clearanceLevel]}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            {user.isLocked ? (
                                                <button onClick={() => unlockUser(user)} className="flex items-center text-red-600 hover:text-red-800 text-xs font-bold border border-red-200 bg-red-50 px-2 py-1 rounded">
                                                    <Lock size={12} className="mr-1"/> LOCKED (Unlock)
                                                </button>
                                            ) : (
                                                <span className="text-green-600 flex items-center text-xs"><UserCheck size={12} className="mr-1"/> Active</span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <button onClick={() => startEdit(user)} className="text-indigo-600 hover:bg-indigo-50 p-1 rounded">
                                                <Edit3 size={16} />
                                            </button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const PolicyCard = ({ title, subtitle, description, active, onToggle, icon, children }: any) => (
    <div className={`relative p-6 rounded-xl border-2 transition-all ${active ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 bg-white opacity-80'}`}>
        <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-lg ${active ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                {icon}
            </div>
            <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                <input type="checkbox" checked={active} onChange={onToggle} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 right-6 checked:border-indigo-600 border-gray-300"/>
                <label className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${active ? 'bg-indigo-600' : 'bg-gray-300'}`}></label>
            </div>
        </div>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="text-xs font-semibold text-indigo-600 mb-2">{subtitle}</p>
        <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
        {children}
    </div>
);

export default AccessControlPanel;
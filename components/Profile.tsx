import React, { useState } from 'react';
import { useSecurity } from '../App';
import { hashPassword, validatePasswordStrength } from '../services/securityService';
import { User, Role, Department, SecurityLevel } from '../types';
import { UserCircle, Save, Key, Shield } from 'lucide-react';

const Profile: React.FC = () => {
  const { currentUser, updateUser, addLog } = useSecurity();
  const [formData, setFormData] = useState({
    fullName: currentUser?.fullName || '',
    email: currentUser?.email || '',
    biometricsEnabled: currentUser?.biometricsEnabled || false,
    mfaEnabled: currentUser?.mfaEnabled ?? true
  });
  
  // Password Change State
  const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  if (!currentUser) return null;

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
        ...currentUser,
        ...formData
    });
    addLog('PROFILE_UPDATE', 'SUCCESS', `User updated own profile`);
    alert("Profile updated successfully");
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    // Verify current
    const currentHash = await hashPassword(passData.current);
    if (currentHash !== currentUser.passwordHash) {
        setPassError("Current password incorrect.");
        addLog('PASSWORD_CHANGE', 'DENIED', 'Incorrect current password provided');
        return;
    }

    // Policy check
    const weakness = validatePasswordStrength(passData.new);
    if (weakness) {
        setPassError(weakness);
        return;
    }

    if (passData.new !== passData.confirm) {
        setPassError("New passwords do not match.");
        return;
    }

    const newHash = await hashPassword(passData.new);
    updateUser({
        ...currentUser,
        passwordHash: newHash
    });
    setPassSuccess("Password changed successfully.");
    addLog('PASSWORD_CHANGE', 'SUCCESS', 'User changed password');
    setPassData({ current: '', new: '', confirm: '' });
  };

  return (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center">
            <UserCircle className="mr-2" /> My Profile
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* General Info */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-semibold mb-4 border-b pb-2">General Information</h3>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Full Name</label>
                        <input type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 border p-2 text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Email Address</label>
                        <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 border p-2 text-sm" />
                    </div>
                    
                    <div className="pt-4 border-t border-slate-100">
                        <h4 className="text-sm font-medium text-slate-900 mb-2">Authentication Preferences</h4>
                        <div className="flex items-center space-x-2 mb-2">
                             <input type="checkbox" checked={formData.mfaEnabled} onChange={e => setFormData({...formData, mfaEnabled: e.target.checked})} className="rounded text-indigo-600" />
                             <label className="text-sm text-slate-600">Enable Multi-Factor Authentication (Recommended)</label>
                        </div>
                        <div className="flex items-center space-x-2">
                             <input type="checkbox" checked={formData.biometricsEnabled} onChange={e => setFormData({...formData, biometricsEnabled: e.target.checked})} className="rounded text-indigo-600" />
                             <label className="text-sm text-slate-600">Enable Biometric Login (Fingerprint/FaceID)</label>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button type="submit" className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium">
                            <Save size={16} className="mr-2" /> Save Changes
                        </button>
                    </div>
                </form>
            </div>

            {/* Security Status & Password */}
            <div className="space-y-6">
                 {/* ID Card */}
                 <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-10"><Shield size={120} /></div>
                     <div className="flex items-center space-x-4 mb-6">
                         <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-2xl font-bold border-2 border-indigo-500">
                             {currentUser.username[0].toUpperCase()}
                         </div>
                         <div>
                             <p className="text-lg font-bold">{currentUser.fullName}</p>
                             <p className="text-indigo-400 text-sm">{currentUser.role} @ {currentUser.department}</p>
                         </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4 text-sm">
                         <div>
                             <p className="text-slate-400 text-xs">Clearance Level</p>
                             <p className="font-mono text-emerald-400">{SecurityLevel[currentUser.clearanceLevel]}</p>
                         </div>
                         <div>
                             <p className="text-slate-400 text-xs">User ID</p>
                             <p className="font-mono">{currentUser.id}</p>
                         </div>
                     </div>
                 </div>

                 {/* Password Change */}
                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                     <h3 className="text-lg font-semibold mb-4 border-b pb-2 flex items-center"><Key size={18} className="mr-2"/> Change Password</h3>
                     {passError && <div className="text-red-600 text-xs bg-red-50 p-2 rounded mb-3">{passError}</div>}
                     {passSuccess && <div className="text-green-600 text-xs bg-green-50 p-2 rounded mb-3">{passSuccess}</div>}
                     
                     <form onSubmit={handlePasswordChange} className="space-y-3">
                         <div>
                             <input type="password" placeholder="Current Password" value={passData.current} onChange={e => setPassData({...passData, current: e.target.value})} className="w-full border rounded p-2 text-sm" required />
                         </div>
                         <div>
                             <input type="password" placeholder="New Password" value={passData.new} onChange={e => setPassData({...passData, new: e.target.value})} className="w-full border rounded p-2 text-sm" required />
                         </div>
                         <div>
                             <input type="password" placeholder="Confirm New Password" value={passData.confirm} onChange={e => setPassData({...passData, confirm: e.target.value})} className="w-full border rounded p-2 text-sm" required />
                         </div>
                         <button type="submit" className="w-full bg-slate-800 text-white py-2 rounded text-sm hover:bg-slate-700">Update Password</button>
                     </form>
                 </div>
            </div>
        </div>
    </div>
  );
};

export default Profile;
import React, { useState } from 'react';
import { useSecurity } from '../App';
import { generateCaptcha, hashPassword, validatePasswordStrength } from '../services/securityService';
import { User, Role, Department, SecurityLevel } from '../types';
import { Lock, ShieldCheck, UserPlus, RefreshCw, Key, AlertTriangle, Info } from 'lucide-react';

type AuthMode = 'LOGIN' | 'REGISTER';

// --- ROLE ACCESS KEYS CONFIGURATION ---
const ROLE_KEYS: Record<string, string> = {
    [Role.ADMIN]: 'ROOT_ACCESS_2024',
    [Role.MANAGER]: 'MANAGER_OPS_01',
    [Role.AUDITOR]: 'AUDIT_VIEW_99'
};

const AuthScreen: React.FC = () => {
  const { login, users, addUser, addLog, recordLoginAttempt } = useSecurity();
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [step, setStep] = useState<'CREDENTIALS' | 'MFA'>('CREDENTIALS');
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [tempUser, setTempUser] = useState<User | null>(null);

  // Register State
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regRole, setRegRole] = useState<Role>(Role.STAFF);
  const [regDept, setRegDept] = useState<Department>(Department.IT);
  const [regRoleKey, setRegRoleKey] = useState('');
  
  // Security
  const [captcha, setCaptcha] = useState(generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState('');
  const [error, setError] = useState('');
  const [showKeysHint, setShowKeysHint] = useState(true);

  const refreshCaptcha = () => setCaptcha(generateCaptcha());

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = users.find(u => u.username === username);
    
    // Check Captcha first
    if (parseInt(captchaInput) !== captcha.answer) {
      setError("Incorrect Captcha.");
      refreshCaptcha();
      return;
    }

    if (!user) {
      addLog('LOGIN_ATTEMPT', 'ERROR', `Unknown user: ${username}`);
      setError("Invalid credentials.");
      refreshCaptcha();
      return;
    }

    if (user.isLocked) {
      addLog('LOGIN_ATTEMPT', 'DENIED', `Locked account attempt: ${username}`);
      setError("Account is locked due to too many failed attempts.");
      return;
    }

    // Check Password
    const hashed = await hashPassword(password);
    if (hashed !== user.passwordHash) {
      recordLoginAttempt(username, false); // Increment failure count
      addLog('LOGIN_ATTEMPT', 'DENIED', `Invalid password for: ${username}`);
      setError("Invalid credentials.");
      refreshCaptcha();
      return;
    }

    // Password OK, Captcha OK. MFA?
    if (user.mfaEnabled) {
      setTempUser(user);
      setStep('MFA');
      setError('');
      // Simulate sending OTP
      // alert(`[SIMULATION] Your MFA Code is: 123456`);
    } else {
      login(user);
    }
  };

  const handleMfaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaToken === '123456' && tempUser) {
      login(tempUser);
    } else {
      setError("Invalid MFA Token");
      addLog('MFA_VERIFY', 'DENIED', `Invalid MFA for ${tempUser?.username}`);
      recordLoginAttempt(tempUser?.username || '', false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Password Policy
    const passError = validatePasswordStrength(regPass);
    if (passError) {
        setError(passError);
        return;
    }

    // Captcha
    if (parseInt(captchaInput) !== captcha.answer) {
      setError("Incorrect Captcha.");
      return;
    }

    // Username Uniqueness
    if (users.find(u => u.username === regUsername)) {
        setError("Username taken.");
        return;
    }

    // ROLE ACCESS KEY VALIDATION
    // If the selected role is in our ROLE_KEYS list, we must verify the key
    if (ROLE_KEYS[regRole]) {
        if (regRoleKey !== ROLE_KEYS[regRole]) {
            addLog('REGISTER_ATTEMPT', 'DENIED', `Invalid Access Key for role ${regRole}: ${regUsername}`);
            setError(`Invalid Access Key for ${regRole}. Authorization failed.`);
            return;
        }
    }

    // Map Role to default Clearance Level for Demo Convenience
    let initialClearance = SecurityLevel.PUBLIC;
    switch (regRole) {
        case Role.ADMIN:
            initialClearance = SecurityLevel.TOP_SECRET;
            break;
        case Role.MANAGER:
        case Role.AUDITOR:
            initialClearance = SecurityLevel.CONFIDENTIAL;
            break;
        case Role.STAFF:
            initialClearance = SecurityLevel.INTERNAL;
            break;
        default:
            initialClearance = SecurityLevel.PUBLIC;
    }

    const newUser: User = {
        id: `u${users.length + 1}`,
        username: regUsername,
        fullName: regName,
        email: regEmail,
        passwordHash: await hashPassword(regPass),
        role: regRole,
        department: regDept,
        clearanceLevel: initialClearance, 
        mfaEnabled: true, 
        isLocked: false,
        failedLoginAttempts: 0,
        biometricsEnabled: false
    };

    addUser(newUser);
    setMode('LOGIN');
    setError('');
    alert(`Registration successful. You have been assigned ${SecurityLevel[initialClearance]} clearance based on your verified role.`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-indigo-600 p-6 text-center">
           <ShieldCheck className="w-12 h-12 text-white mx-auto mb-2" />
           <h1 className="text-2xl font-bold text-white">SecureGuard ID</h1>
           <p className="text-indigo-200 text-sm">Enterprise Access Portal</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm flex items-center">
              <Lock className="w-4 h-4 mr-2" />
              {error}
            </div>
          )}

          {step === 'CREDENTIALS' ? (
             mode === 'LOGIN' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Username</label>
                    <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Password</label>
                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
                  </div>
                  
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-slate-600">Security Check: {captcha.question} = ?</span>
                        <button type="button" onClick={refreshCaptcha}><RefreshCw size={14} className="text-slate-400 hover:text-indigo-500" /></button>
                    </div>
                    <input type="number" required placeholder="Answer" value={captchaInput} onChange={e => setCaptchaInput(e.target.value)} className="w-full rounded border-slate-300 p-2 text-sm border" />
                  </div>

                  <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Sign In
                  </button>
                  <div className="mt-4 text-center">
                    <button type="button" onClick={() => { setMode('REGISTER'); setError(''); refreshCaptcha(); }} className="text-sm text-indigo-600 hover:text-indigo-500">Create new account</button>
                  </div>
                </form>
             ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                   <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-bold text-slate-800">New Account</h3>
                      <button type="button" onClick={() => setShowKeysHint(!showKeysHint)} className="text-indigo-600 hover:text-indigo-800 text-xs flex items-center">
                         <Info size={14} className="mr-1"/> Keys
                      </button>
                   </div>
                   
                   {/* DEMO HINT - ALWAYS VISIBLE OR TOGGLED */}
                   {showKeysHint && (
                       <div className="bg-yellow-50 border border-yellow-200 p-2 rounded text-xs text-slate-700 mb-2 font-mono">
                           <p><strong>Admin Key:</strong> {ROLE_KEYS[Role.ADMIN]}</p>
                           <p><strong>Manager Key:</strong> {ROLE_KEYS[Role.MANAGER]}</p>
                           <p><strong>Auditor Key:</strong> {ROLE_KEYS[Role.AUDITOR]}</p>
                       </div>
                   )}

                   <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-medium text-slate-700">Full Name</label>
                            <input type="text" required value={regName} onChange={e => setRegName(e.target.value)} className="mt-1 w-full rounded-md border p-1.5 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700">Username</label>
                            <input type="text" required value={regUsername} onChange={e => setRegUsername(e.target.value)} className="mt-1 w-full rounded-md border p-1.5 text-sm" />
                        </div>
                   </div>
                   
                   <div>
                    <label className="block text-xs font-medium text-slate-700">Email</label>
                    <input type="email" required value={regEmail} onChange={e => setRegEmail(e.target.value)} className="mt-1 w-full rounded-md border p-1.5 text-sm" />
                   </div>
                   
                   {/* Role Selection */}
                   <div className="grid grid-cols-2 gap-4">
                       <div>
                           <label className="block text-xs font-medium text-slate-700">Role</label>
                           <select value={regRole} onChange={e => { setRegRole(e.target.value as Role); setRegRoleKey(''); }} className="mt-1 w-full rounded-md border p-1.5 text-sm bg-white">
                               {Object.values(Role).map(r => (
                                   <option key={r} value={r}>
                                     {r} {ROLE_KEYS[r] ? '*' : ''}
                                   </option>
                               ))}
                           </select>
                           {ROLE_KEYS[regRole] && <p className="text-[10px] text-red-500 mt-0.5">* Key Required</p>}
                       </div>
                       <div>
                           <label className="block text-xs font-medium text-slate-700">Department</label>
                           <select value={regDept} onChange={e => setRegDept(e.target.value as Department)} className="mt-1 w-full rounded-md border p-1.5 text-sm bg-white">
                               {Object.values(Department).map(d => (
                                   <option key={d} value={d}>{d}</option>
                               ))}
                           </select>
                       </div>
                   </div>

                   {/* CONDITIONAL ROLE KEY INPUT */}
                   {ROLE_KEYS[regRole] && (
                       <div className="bg-red-50 p-2 rounded border border-red-100 animate-in fade-in slide-in-from-top-1 duration-300">
                           <label className="block text-xs font-bold text-red-700 flex items-center mb-1">
                               <AlertTriangle size={12} className="mr-1"/> 
                               Enter {regRole} Access Key:
                           </label>
                           <input 
                               type="password" 
                               required 
                               placeholder="Enter Key..." 
                               value={regRoleKey} 
                               onChange={e => setRegRoleKey(e.target.value)} 
                               className="block w-full rounded-md border-red-300 p-1.5 text-sm focus:ring-red-500 focus:border-red-500 shadow-sm" 
                           />
                       </div>
                   )}

                   <div>
                    <label className="block text-xs font-medium text-slate-700">Password (Strict Policy)</label>
                    <input type="password" required value={regPass} onChange={e => setRegPass(e.target.value)} className="mt-1 w-full rounded-md border p-1.5 text-sm" />
                    <p className="text-[10px] text-slate-400 mt-1">8+ chars, 1 uppercase, 1 symbol, 1 number.</p>
                   </div>
                   
                   <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-slate-600">Captcha: {captcha.question} = ?</span>
                        <button type="button" onClick={refreshCaptcha}><RefreshCw size={14} className="text-slate-400 hover:text-indigo-500" /></button>
                    </div>
                    <input type="number" required placeholder="Answer" value={captchaInput} onChange={e => setCaptchaInput(e.target.value)} className="w-full rounded border-slate-300 p-1.5 text-sm border" />
                   </div>

                   <button type="submit" className="w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                     <UserPlus className="w-4 h-4 mr-2" /> Complete Registration
                   </button>
                   <div className="mt-4 text-center">
                    <button type="button" onClick={() => { setMode('LOGIN'); setError(''); refreshCaptcha(); }} className="text-sm text-indigo-600 hover:text-indigo-500">Back to Login</button>
                  </div>
                </form>
             )
          ) : (
            <form onSubmit={handleMfaSubmit} className="space-y-6 text-center">
               <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100">
                 <Key className="h-6 w-6 text-indigo-600" />
               </div>
               <h3 className="text-lg leading-6 font-medium text-gray-900">Multi-Factor Auth</h3>
               <p className="text-sm text-gray-500">We sent a simulation code to your device. (Try: 123456)</p>
               <input type="text" maxLength={6} className="text-center text-2xl tracking-widest block w-full rounded-md border-gray-300 border p-3" value={mfaToken} onChange={e => setMfaToken(e.target.value)} />
               <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 sm:text-sm">
                 Verify Access
               </button>
               <button type="button" onClick={() => { setStep('CREDENTIALS'); setMfaToken(''); }} className="text-xs text-slate-400">Cancel</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
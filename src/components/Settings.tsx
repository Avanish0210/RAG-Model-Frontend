import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { RAGMockBackend } from '../utils/mockBackend';
import { 
  User as UserIcon, Lock, Key, Sliders, Settings2, SlidersHorizontal, 
  Eye, Check, Trash2, AlertOctagon, HelpCircle, ShieldCheck, Info,
  Terminal, Activity
} from 'lucide-react';
import { Starburst } from '../App';

interface SettingsProps {
  user: User;
  onUserUpdate: (updated: User) => void;
  onLogout: () => void;
}

export default function Settings({ user, onUserUpdate, onLogout }: SettingsProps) {
  // Profile settings state
  const [name, setName] = useState(user.name);
  const [userRole, setUserRole] = useState('data_analyst');
  const [userDepartment, setUserDepartment] = useState('Cognitive Intelligence Dev');
  
  // Custom elegant preferences (Simplified from backend sliders to friendly toggles)
  const [searchDepth, setSearchDepth] = useState('balanced'); // focused, balanced, extensive
  const [compositionStyle, setCompositionStyle] = useState('synthesized'); // standard/brief/detailed
  const [autoSummarize, setAutoSummarize] = useState(true);
  const [compactLayout, setCompactLayout] = useState(false);
  const [soundFeedback, setSoundFeedback] = useState(true);

  // Security passphrase state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  // Live telemetry logs listener
  const [logs, setLogs] = useState<any[]>(RAGMockBackend.getLogs());

  useEffect(() => {
    const handleLogAdded = () => {
      setLogs(RAGMockBackend.getLogs());
    };
    window.addEventListener('rag_api_log_added', handleLogAdded);
    return () => {
      window.removeEventListener('rag_api_log_added', handleLogAdded);
    };
  }, []);

  // Load preferences from local storage
  useEffect(() => {
    setName(user.name);
    setUserRole(localStorage.getItem('rag_pref_role') || 'researcher');
    setUserDepartment(localStorage.getItem('rag_pref_dept') || 'Knowledge Systems Group');
    setSearchDepth(localStorage.getItem('rag_pref_depth') || 'balanced');
    setCompositionStyle(localStorage.getItem('rag_pref_style') || 'detailed');
    setAutoSummarize(localStorage.getItem('rag_pref_autosum') !== 'false');
    setCompactLayout(localStorage.getItem('rag_pref_compact') === 'true');
    setSoundFeedback(localStorage.getItem('rag_pref_sound') !== 'false');
  }, [user]);

  // Save profile and role definitions
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const users = JSON.parse(localStorage.getItem('rag_users') || '[]');
    const userIndex = users.findIndex((u: any) => u.username === user.username);
    
    if (userIndex !== -1) {
      users[userIndex].name = name;
      localStorage.setItem('rag_users', JSON.stringify(users));
    }

    const updatedUser: User = { ...user, name };
    localStorage.setItem('rag_current_user', JSON.stringify(updatedUser));
    onUserUpdate(updatedUser);

    localStorage.setItem('rag_pref_role', userRole);
    localStorage.setItem('rag_pref_dept', userDepartment);

    alert('Your profile details were updated successfully.');
  };

  // Save preferences
  const handleSavePreferences = () => {
    localStorage.setItem('rag_pref_depth', searchDepth);
    localStorage.setItem('rag_pref_style', compositionStyle);
    localStorage.setItem('rag_pref_autosum', autoSummarize.toString());
    localStorage.setItem('rag_pref_compact', compactLayout.toString());
    localStorage.setItem('rag_pref_sound', soundFeedback.toString());
    
    window.dispatchEvent(new CustomEvent('rag_preferences_changed'));
    alert('Your research preferences have been saved.');
  };

  // Password reset
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword.trim() || !newPassword.trim()) {
      alert('Please fill out both password fields to continue.');
      return;
    }

    if (newPassword.length < 6) {
      alert('New password must be at least 6 characters long.');
      return;
    }

    const users = JSON.parse(localStorage.getItem('rag_users') || '[]');
    const userIndex = users.findIndex((u: any) => u.username === user.username && u.password === currentPassword);
    
    if (userIndex === -1 && user.username !== 'demo') {
      alert('Verification failure: The current password you entered was incorrect.');
      return;
    }

    if (user.username === 'demo') {
      alert('Demo accounts are restricted from modifying passwords. Please create a personal account.');
      setCurrentPassword('');
      setNewPassword('');
      return;
    }

    users[userIndex].password = newPassword;
    localStorage.setItem('rag_users', JSON.stringify(users));
    setCurrentPassword('');
    setNewPassword('');
    setShowPasswordFields(false);
    alert('Security password updated successfully.');
  };

  // Erase all account parameters
  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to completely wipe all your local files? All indexed documents and chat transcripts will be permanently removed. This cannot be undone.')) {
      const usernameCheck = prompt(`Type your active username "${user.username}" to confirm complete erasure:`);
      if (usernameCheck !== user.username) {
        alert('Verification error. Purge aborted.');
        return;
      }

      const users = JSON.parse(localStorage.getItem('rag_users') || '[]');
      const cleanedUsers = users.filter((u: any) => u.username !== user.username);
      localStorage.setItem('rag_users', JSON.stringify(cleanedUsers));

      RAGMockBackend.clearLogs();
      RAGMockBackend.clearChatHistory();
      localStorage.removeItem('rag_documents');
      localStorage.removeItem('rag_pref_role');
      localStorage.removeItem('rag_pref_dept');
      localStorage.removeItem('rag_pref_depth');
      localStorage.removeItem('rag_pref_style');
      
      onLogout();
    }
  };

  return (
    <div className="space-y-10 animate-fade-in" id="settings-unified-workspace">
      
      {/* Sleek Minimalist Header */}
      <div id="settings-branding-banner" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl sm:text-3.5xl font-extrabold tracking-tight text-stone-900 font-serif">
            Personal <span className="italic font-normal text-stone-500">Preferences</span>
          </h1>
          <p className="text-xs text-stone-440 mt-1">
            Personalize your reading interface, change search parameters, and configure your credentials.
          </p>
        </div>

        {/* Security badge with our elegant sun starburst */}
        <div className="flex items-center gap-2.5 rounded-full px-5 py-2 hover:border-stone-400 border border-stone-200 bg-white" id="workspace-status-indicator">
          <div className="flex items-center justify-center text-emerald-600 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold font-mono tracking-wider text-stone-600 uppercase">
            Local Partition Secure
          </span>
        </div>
      </div>

      {/* Settings Grid Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start font-sans" id="settings-workspace-grid">
        
        {/* Left Side: Profile & Account */}
        <div className="lg:col-span-6 space-y-8" id="settings-id-column">
          
          {/* Section A: Profile Customization */}
          <div className="bg-white rounded-[2rem] border border-stone-200 p-6 space-y-6" id="personal-identity-card">
            <h2 className="text-sm font-bold text-stone-800 flex items-center gap-2.5 pb-2 border-b border-stone-150 uppercase tracking-widest font-mono">
              <UserIcon className="w-4.5 h-4.5 text-stone-900" />
              <span>Identity Profile</span>
            </h2>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-stone-450 block">Username Token (Locked)</span>
                <div className="w-full px-4 py-3 bg-stone-50 text-stone-500 border border-stone-200 rounded-full text-xs font-mono select-none flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-stone-400" />
                  <span>{user.username}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-800">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 input-neu text-xs text-stone-800"
                  placeholder="e.g. Olivia Vance"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-800">Your Role</label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                    className="w-full px-4 py-2.5 input-neu text-xs text-stone-805 cursor-pointer"
                  >
                    <option value="researcher">Academic Researcher</option>
                    <option value="analyst">Data Analyst</option>
                    <option value="writer">Content Writer</option>
                    <option value="guest">Guest Companion</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-800">Project / Bio</label>
                  <input
                    type="text"
                    value={userDepartment}
                    onChange={(e) => setUserDepartment(e.target.value)}
                    className="w-full px-4 py-2.5 input-neu text-xs text-stone-800"
                    placeholder="e.g. Economics Review"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-stone-900 hover:bg-stone-850 text-white font-medium rounded-full text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Profile Settings</span>
              </button>
            </form>
          </div>

          {/* Section B: Security credentials modification */}
          <div className="bg-white rounded-[2rem] border border-stone-200 p-6 space-y-4" id="pasphrase-management-card">
            <div className="flex items-center justify-between pb-2 border-b border-stone-150">
              <h2 className="text-sm font-bold text-stone-800 flex items-center gap-2.5 uppercase tracking-widest font-mono">
                <Key className="w-4.5 h-4.5 text-stone-900" />
                <span>Password</span>
              </h2>
              
              <button
                type="button"
                onClick={() => setShowPasswordFields(!showPasswordFields)}
                className="text-xs font-bold text-stone-900 hover:underline cursor-pointer"
              >
                {showPasswordFields ? 'Cancel' : 'Change Password'}
              </button>
            </div>

            {showPasswordFields ? (
              <form onSubmit={handleUpdatePassword} className="space-y-4 animate-fade-in">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-800">Current Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2.5 input-neu text-xs text-stone-805"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-800">New Password Key</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 input-neu text-xs text-stone-805"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-stone-900 hover:bg-stone-850 text-white font-medium rounded-full text-xs cursor-pointer transition-all"
                >
                  Confirm Change
                </button>
              </form>
            ) : (
              <p className="text-xs text-stone-450 leading-relaxed font-sans">
                Keep your standard local login password secure. We recommend changing it periodically to safeguard your local folder structures.
              </p>
            )}
          </div>

          {/* Section C: Erasure of standard partition */}
          <div className="p-5 border border-red-200 bg-red-50/55 rounded-3xl space-y-4" id="destructive-area-banner">
            <div className="flex gap-3 items-start text-red-800">
              <AlertOctagon className="w-5 h-5 shrink-0 text-red-650 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider">Erasing Local Storage</h3>
                <p className="text-[11px] text-red-650 leading-relaxed font-sans">
                  Wipe all uploaded documents, clear interactive chat histories, and exit your session. This action completely resets the local space.
                </p>
              </div>
            </div>

            <button
              onClick={handleDeleteAccount}
              className="py-3 px-5 border border-red-300 text-red-600 font-semibold bg-white rounded-full hover:bg-red-50 w-full text-xs cursor-pointer transition-all"
              id="completely-wipe-trigger"
            >
              Completely Purge Local Workspace
            </button>
          </div>

        </div>

        {/* Right Side: Navigation & Read Precision Preferences */}
        <div className="lg:col-span-6 space-y-8" id="settings-preferences-column">
          
          {/* Section D: Simplified human-literal Search Tuning */}
          <div className="bg-white rounded-[2rem] border border-stone-200 p-6 space-y-6" id="ai-calibration-card">
            <h2 className="text-sm font-bold text-stone-800 flex items-center gap-2.5 pb-2 border-b border-stone-150 uppercase tracking-widest font-mono">
              <SlidersHorizontal className="w-4.5 h-4.5 text-stone-900" />
              <span>Search Precision Setup</span>
            </h2>

            <p className="text-xs text-stone-450 leading-relaxed font-sans">
              Determine how deep the assistant analyzes files on each query. Standard configurations balance clarity and precision beautifully.
            </p>

            <div className="space-y-5">
              {/* Option 1: Search Precision depth */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-800">Depth of Search Retrieval</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'focused', label: 'Focused', desc: 'Direct matching' },
                    { id: 'balanced', label: 'Balanced', desc: 'Default range' },
                    { id: 'extensive', label: 'Extensive', desc: 'Full context' }
                  ].map(opt => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setSearchDepth(opt.id)}
                      className={`p-3.5 border rounded-2xl text-left cursor-pointer transition-all ${
                        searchDepth === opt.id
                          ? 'border-stone-900 bg-stone-50'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <span className="text-xs font-bold block text-stone-900">{opt.label}</span>
                      <span className="text-[10px] text-stone-400 block mt-0.5">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Option 2: Synthesis Presentation style */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-800">Summary Writing Style</label>
                <select
                  value={compositionStyle}
                  onChange={(e) => setCompositionStyle(e.target.value)}
                  className="w-full px-4 py-2.5 input-neu text-xs text-stone-805 cursor-pointer"
                >
                  <option value="detailed">In-Depth Synthesis (Detailed comparisons)</option>
                  <option value="brief">Brief Recaps (Highly concise and direct)</option>
                  <option value="quotes">Strict Direct Quotes (Verify with source files)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section E: Interface Preferences Toggles */}
          <div className="bg-white rounded-[2rem] border border-stone-200 p-6 space-y-6" id="general-preferences-card">
            <h2 className="text-sm font-bold text-stone-800 flex items-center gap-2.5 pb-2 border-b border-stone-150 uppercase tracking-widest font-mono">
              <Sliders className="w-4.5 h-4.5 text-stone-900" />
              <span>Behavior Preferences</span>
            </h2>

            <div className="space-y-5">
              
              {/* Toggle 1: AutoSummarize */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5 min-w-0 flex-1">
                  <span className="text-xs font-bold text-stone-800 block">Pre-Calculate Summary</span>
                  <p className="text-[11px] text-stone-450 leading-relaxed">
                    Automatically assemble a reading digest immediately after uploading a PDF library paper.
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={() => setAutoSummarize(!autoSummarize)}
                  className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                    autoSummarize ? 'bg-stone-900' : 'bg-stone-250'
                  }`}
                  id="pref-autosummarize-toggle"
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
                    autoSummarize ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Toggle 2: Compact density */}
              <div className="flex items-start justify-between gap-4 border-t border-stone-150 pt-4">
                <div className="space-y-0.5 min-w-0 flex-1">
                  <span className="text-xs font-bold text-stone-808 block">Compact Information Density</span>
                  <p className="text-[11px] text-stone-450 leading-relaxed">
                    Render smaller table cells and minimized list padding for high information density.
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={() => setCompactLayout(!compactLayout)}
                  className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                    compactLayout ? 'bg-stone-900' : 'bg-stone-250'
                  }`}
                  id="pref-compactlayout-toggle"
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
                    compactLayout ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Toggle 3: Sound Cue feedbacks */}
              <div className="flex items-start justify-between gap-4 border-t border-stone-150 pt-4">
                <div className="space-y-0.5 min-w-0 flex-1">
                  <span className="text-xs font-bold text-stone-800 block">Subtle Interaction Sounds</span>
                  <p className="text-[11px] text-stone-450 leading-relaxed">
                    Play minor auditory feedbacks when file transfers finish or search replies are formulated.
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={() => setSoundFeedback(!soundFeedback)}
                  className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                    soundFeedback ? 'bg-stone-900' : 'bg-stone-250'
                  }`}
                  id="pref-soundfeedback-toggle"
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
                    soundFeedback ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

            </div>

            <button
              onClick={handleSavePreferences}
              className="w-full py-3 bg-stone-900 hover:bg-stone-850 text-white font-medium rounded-full text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 mt-4"
            >
              <Sliders className="w-4 h-4" />
              <span>Apply All Preferences</span>
            </button>
          </div>

        </div>

      </div>

      {/* Real-time API Endpoint Monitor & Live Telemetry Inspector */}
      <div className="bg-white rounded-[2rem] border border-stone-200 p-6 sm:p-8 space-y-6" id="api-integration-telemetry">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-150">
          <div>
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2.5 uppercase tracking-widest font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Backend Integration Status</span>
            </h2>
            <p className="text-[11px] text-stone-450 mt-1 font-sans">
              Currently connected and listening to service requests on <code className="bg-stone-50 px-1 py-0.5 rounded text-stone-700 font-mono">localhost:8080</code>.
            </p>
          </div>

          <button
            onClick={() => {
              RAGMockBackend.clearLogs();
              setLogs([]);
            }}
            className="text-xs font-bold text-red-650 hover:underline flex items-center gap-1.5 cursor-pointer"
            id="clear-telemetry-trigger"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>
        </div>

        {/* List of active endpoints with their mapping urls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="api-endpoint-cards">
          {[
            { name: 'Signup Endpoint', method: 'POST', url: 'http://localhost:8080/api/auth/signup', desc: 'Secure user onboarding' },
            { name: 'Login Endpoint', method: 'POST', url: 'http://localhost:8080/api/auth/login', desc: 'Identity verification & JWT generation' },
            { name: 'PDF Ingestion', method: 'POST', url: 'http://localhost:8080/upload', desc: 'Saves and embeds target document' },
            { name: 'RAG Chat Service', method: 'POST', url: 'http://localhost:8080/Documents/chat', desc: 'Sparse & Dense retrieval query' }
          ].map(endpoint => (
            <div key={endpoint.name} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 hover:border-stone-300 transition-all text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-750 font-sans">{endpoint.name}</span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-stone-900 text-white leading-none">
                  {endpoint.method}
                </span>
              </div>
              <div className="text-[10px] text-stone-440 truncate font-mono select-all mt-1" title={endpoint.url}>
                {endpoint.url.replace('http://localhost:8080', '')}
              </div>
              <p className="text-[10px] text-stone-450 pt-1 leading-normal font-sans">
                {endpoint.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Live Telemetry Stream */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-stone-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <span>Terminal Traffic Logs</span>
            <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              Live Feed
            </span>
          </label>

          {logs.length === 0 ? (
            <div className="p-8 border border-dashed border-stone-200 bg-stone-50/50 text-center rounded-[1.5rem] space-y-2">
              <p className="text-xs text-stone-450 font-sans">
                No telemetry traffic recorded yet in this workspace session.
              </p>
              <p className="text-[10px] text-stone-400 font-sans">
                Interact with the Login, Signup, PDF uploader, or Chat interface to see outbound requests stream in here.
              </p>
            </div>
          ) : (
            <div className="border border-stone-200 rounded-[1.5rem] overflow-hidden bg-stone-950 font-mono text-[11px] text-stone-300" id="telemetry-log-console">
              
              {/* Header bar */}
              <div className="bg-stone-900 border-b border-stone-800 px-5 py-3 flex items-center justify-between text-stone-400 text-[10px] font-bold uppercase tracking-wider">
                <span>Call Registry</span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Connected
                </span>
              </div>

              {/* Scrolling records list */}
              <div className="divide-y divide-stone-850 max-h-96 overflow-y-auto">
                {logs.map((log) => {
                  const isOk = log.status >= 200 && log.status < 300;
                  const isErr = log.status >= 400 || log.status === 0;
                  return (
                    <div key={log.id} className="p-5 hover:bg-stone-900/50 transition-all space-y-3 font-mono">
                      
                      {/* Sub-header details */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.method === 'GET' ? 'bg-indigo-950 text-indigo-300 border border-indigo-900' :
                            log.method === 'POST' ? 'bg-emerald-950 text-emerald-300' :
                            log.method === 'PUT' ? 'bg-amber-950 text-amber-300 border border-amber-900' :
                            'bg-red-950 text-red-300 border border-red-900'
                          }`}>
                            {log.method}
                          </span>
                          <span className="text-stone-400 truncate max-w-sm font-semibold selection:bg-stone-800">
                            {log.url}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isOk ? 'bg-emerald-950 text-emerald-400' :
                            isErr ? 'bg-red-955 text-red-400' :
                            'bg-stone-800 text-stone-400'
                          }`}>
                            Status: {log.status === 0 ? 'FAIL/OFFLINE' : log.status}
                          </span>
                          <span className="text-stone-500 text-[10px]">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>

                      {/* Request Payload and Response Payload grids */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] pt-1">
                        
                        {/* Outbound body */}
                        <div className="space-y-1">
                          <div className="text-stone-500 font-bold uppercase tracking-wider text-[9px]">
                            Request Payload
                          </div>
                          {log.payload ? (
                            <pre className="bg-stone-900 rounded-lg p-3 overflow-x-auto text-stone-250 selection:bg-stone-800 max-h-36">
                              {log.payload}
                            </pre>
                          ) : (
                            <div className="text-stone-600 italic px-1 py-1">No payload transmitted.</div>
                          )}
                        </div>

                        {/* Inbound response body */}
                        <div className="space-y-1">
                          <div className="text-stone-500 font-bold uppercase tracking-wider text-[9px]">
                            Response returned
                          </div>
                          {log.response ? (
                            <pre className="bg-stone-900 rounded-lg p-3 overflow-x-auto text-stone-250 selection:bg-stone-800 max-h-36">
                              {log.response}
                            </pre>
                          ) : (
                            <div className="text-stone-600 italic px-1 py-1">No response body captured.</div>
                          )}
                        </div>

                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Info notice block */}
      <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-500 flex gap-2.5">
        <Info className="w-4.5 h-4.5 text-stone-455 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Preferences are saved immediately in your standard browser space. Transmitted payloads contain zero external API tokens or authentication secrets.
        </p>
      </div>

    </div>
  );
}

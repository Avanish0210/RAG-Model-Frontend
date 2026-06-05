import React, { useState, useEffect } from 'react';
import { User, Document } from './types';
import { RAGMockBackend } from './utils/mockBackend';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import DocumentManager from './components/DocumentManager';
import ChatPanel from './components/ChatPanel';
import Settings from './components/Settings';
import { 
  Sparkles, Menu, X, LayoutDashboard, Database, MessageSquare, 
  Settings as SettingsIcon, LogOut, FileText, ChevronLeft, ChevronRight, BookOpen
} from 'lucide-react';

// Reusable elegant exhibition starburst SVG matching the reference image style
export function Starburst({ className = "w-6 h-6 text-stone-850" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={`${className} animate-spin-slow`} fill="currentColor">
      <g transform="translate(50,50)">
        {Array.from({ length: 24 }).map((_, i) => (
          <line
            key={i}
            x1="0"
            y1="-44"
            x2="0"
            y2="-26"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            transform={`rotate(${i * 15})`}
          />
        ))}
        <circle cx="0" cy="0" r="10" stroke="currentColor" fill="none" strokeWidth="2.5" />
      </g>
    </svg>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  
  // Navigation sidebar collapse
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authenticate session on load
  useEffect(() => {
    const activeUser = RAGMockBackend.getCurrentUser();
    if (activeUser) {
      setUser(activeUser);
    }
    // Load local documents
    setDocuments(RAGMockBackend.getDocuments());
  }, []);

  // Sync state when user logs in successfully
  const handleAuthSuccess = (authorisedUser: User) => {
    setUser(authorisedUser);
    setDocuments(RAGMockBackend.getDocuments());
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    RAGMockBackend.logout();
    setUser(null);
    setSelectedDocId(null);
    setActiveTab('dashboard');
  };

  // Switch tabs programmatically
  const handleNavigate = (tab: string, arg?: any) => {
    setActiveTab(tab);
    if (tab === 'chat' && typeof arg === 'string') {
      setSelectedDocId(arg);
    }
    setMobileMenuOpen(false);
  };

  const handleDocumentsChange = (updatedDocs: Document[]) => {
    setDocuments(updatedDocs);
  };

  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#2D2C2A] flex flex-col antialiased selection:bg-[#EAE8E3]" id="applet-core-root">
      
      {/* 1. SEAMLESS TOP BRAND BAR */}
      <header className="sticky top-0 z-40 bg-[#FAF9F5]/90 backdrop-blur-md px-6 py-5 flex items-center justify-between border-b border-stone-200/60" id="main-header-bar">
        <div className="flex items-center gap-4">
          {/* Mobile menu toggle button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 mr-1 rounded-full border border-stone-200/80 bg-white text-stone-650 hover:bg-stone-50 lg:hidden cursor-pointer active:scale-95 transition-all"
            id="mobile-sidebar-toggle"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Simple classic title brand layout */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center shrink-0">
              <Starburst className="w-8 h-8 text-stone-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif italic text-stone-400 text-xs tracking-wide">Standard Workspace</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#2D2C2A]" />
                <span className="text-xs uppercase tracking-wider font-mono text-stone-500">Premium Portal</span>
              </div>
              <h1 className="text-lg font-bold font-sans tracking-tight text-stone-900 -mt-0.5">
                Standard RAG Platform
              </h1>
            </div>
          </div>
        </div>

        {/* User Account Controls */}
        <div className="flex items-center gap-4" id="header-user-badge">
          <div className="text-xs font-medium text-stone-500 hidden md:flex items-center gap-2 px-4 py-2 border border-stone-200 bg-white rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>Active: <strong className="text-stone-800 font-semibold">{user.name}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleNavigate('settings')}
              className={`p-3 rounded-full border transition-all cursor-pointer ${
                activeTab === 'settings' 
                  ? 'bg-stone-900 border-stone-900 text-white' 
                  : 'bg-white border-stone-200 hover:border-stone-400 text-stone-755'
              }`}
              title="Preferences & Identity"
              id="header-settings-btn"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>

            <button
              onClick={handleLogout}
              className="lg:px-5 p-3 rounded-full border border-stone-200 hover:border-red-250 hover:text-red-650 bg-white text-stone-650 transition cursor-pointer text-xs font-medium flex items-center gap-2"
              title="Logout Session"
              id="header-logout-btn"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden lg:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. BODY FRAME LAYOUT WITH SIDEBAR + CORRESPONDING WHITE CONTAINER */}
      <div className="flex-1 flex max-w-[1440px] w-full mx-auto px-4 md:px-6 py-6 gap-6 relative" id="layout-body-wrapper">
        
        {/* SIDE BAR NAVIGATION SECTION */}
        <aside 
          className={`shrink-0 transition-all duration-300 relative z-30 hidden lg:flex flex-col justify-between py-2 ${
            sidebarCollapsed ? 'w-20' : 'w-64'
          }`}
          id="main-sidebar-rail"
        >
          <div className="space-y-8">
            <div className={`px-2 ${sidebarCollapsed ? 'text-center' : ''}`}>
              <span className="text-[10px] font-bold tracking-widest text-stone-450 uppercase font-mono block">
                {sidebarCollapsed ? 'RAG' : 'Workspace Navigation'}
              </span>
            </div>

            {/* Sidebar navigation tabs list */}
            <nav className="space-y-2.5" id="sidebar-navigation">
              {/* Tab 1: Dashboard */}
              <button
                id="nav-dashboard-tab"
                onClick={() => handleNavigate('dashboard')}
                className={`w-full p-4 rounded-2xl flex items-center gap-3.5 transition-all text-left cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-stone-900 text-white font-medium shadow-sm'
                    : 'bg-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-100/50'
                }`}
              >
                <LayoutDashboard className="w-4.5 h-4.5 shrink-0" />
                {!sidebarCollapsed && <span className="text-sm font-medium">Overview Board</span>}
              </button>

              {/* Tab 2: Document Ingestions */}
              <button
                id="nav-documents-tab"
                onClick={() => handleNavigate('documents')}
                className={`w-full p-4 rounded-2xl flex items-center gap-3.5 transition-all text-left cursor-pointer ${
                  activeTab === 'documents'
                    ? 'bg-stone-900 text-white font-medium shadow-sm'
                    : 'bg-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-100/50'
                }`}
              >
                <Database className="w-4.5 h-4.5 shrink-0" />
                {!sidebarCollapsed && <span className="text-sm font-medium">Document Library</span>}
              </button>

              {/* Tab 3: Q&A Chat Client */}
              <button
                id="nav-chat-tab"
                onClick={() => handleNavigate('chat')}
                className={`w-full p-4 rounded-2xl flex items-center gap-3.5 transition-all text-left cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-stone-900 text-white font-medium shadow-sm'
                    : 'bg-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-100/50'
                }`}
              >
                <MessageSquare className="w-4.5 h-4.5 shrink-0" />
                {!sidebarCollapsed && <span className="text-sm font-medium">Interactive Search</span>}
              </button>

              {/* Tab 4: Preferences */}
              <button
                id="nav-settings-tab"
                onClick={() => handleNavigate('settings')}
                className={`w-full p-4 rounded-2xl flex items-center gap-3.5 transition-all text-left cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-stone-900 text-white font-medium shadow-sm'
                    : 'bg-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-100/50'
                }`}
              >
                <SettingsIcon className="w-4.5 h-4.5 shrink-0" />
                {!sidebarCollapsed && <span className="text-sm font-medium">Preferences</span>}
              </button>
            </nav>
          </div>

          {/* Collapse toggle row */}
          <div className="pt-4 border-t border-stone-200/60" id="sidebar-footer-collapse">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full p-3 rounded-full border border-stone-200 hover:border-stone-400 bg-white text-stone-500 hover:text-stone-800 flex items-center justify-center cursor-pointer active:scale-95 transition-all"
              title={sidebarCollapsed ? "Expand panel" : "Collapse panel"}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </aside>

        {/* MOBILE SIDEBAR DRAWERS */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden bg-stone-900/40 backdrop-blur-xs" id="mobile-drawer-portal">
            <div className="w-72 bg-[#FAF9F5] h-full p-6 space-y-6 flex flex-col justify-between animate-fade-in border-r border-stone-200" id="mobile-drawer-pane">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                  <div className="flex items-center gap-2">
                    <Starburst className="w-5 h-5 text-stone-800" />
                    <span className="text-xs font-bold tracking-wider font-sans uppercase">
                      Workspace Navigation
                    </span>
                  </div>
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-full border border-stone-200 bg-white text-stone-505"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <nav className="space-y-2">
                  <button
                    onClick={() => handleNavigate('dashboard')}
                    className={`w-full p-4 rounded-xl flex items-center gap-3.5 text-left ${
                      activeTab === 'dashboard' ? 'bg-stone-900 text-white font-medium' : 'text-stone-600'
                    }`}
                  >
                    <LayoutDashboard className="w-4.5 h-4.5 shrink-0" />
                    <span className="text-sm">Overview Board</span>
                  </button>

                  <button
                    onClick={() => handleNavigate('documents')}
                    className={`w-full p-4 rounded-xl flex items-center gap-3.5 text-left ${
                      activeTab === 'documents' ? 'bg-stone-900 text-white font-medium' : 'text-stone-600'
                    }`}
                  >
                    <Database className="w-4.5 h-4.5 shrink-0" />
                    <span className="text-sm">Document Library</span>
                  </button>

                  <button
                    onClick={() => handleNavigate('chat')}
                    className={`w-full p-4 rounded-xl flex items-center gap-3.5 text-left ${
                      activeTab === 'chat' ? 'bg-stone-900 text-white font-medium' : 'text-stone-600'
                    }`}
                  >
                    <MessageSquare className="w-4.5 h-4.5 shrink-0" />
                    <span className="text-sm">Interactive Search</span>
                  </button>

                  <button
                    onClick={() => handleNavigate('settings')}
                    className={`w-full p-4 rounded-xl flex items-center gap-3.5 text-left relative ${
                      activeTab === 'settings' ? 'bg-stone-900 text-white' : 'text-stone-650'
                    }`}
                  >
                    <SettingsIcon className="w-4.5 h-4.5 shrink-0" />
                    <span className="text-sm">Preferences</span>
                  </button>
                </nav>
              </div>

              <div className="pt-4 border-t border-stone-200" id="mobile-drawer-footer">
                <button
                  onClick={handleLogout}
                  className="w-full py-3 btn-neu-danger text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout Session</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CENTRAL WHITE CARD SHADOW CONTAINER SPECIFIED BY REFERENCE WORK */}
        <main className="flex-1 min-w-0 bg-white rounded-[2.5rem] border border-stone-200/70 p-6 sm:p-8 md:p-10 shadow-sm" id="main-content-display">
          
          {activeTab === 'dashboard' && (
            <Dashboard 
              user={user} 
              onNavigate={handleNavigate} 
              documents={documents} 
            />
          )}

          {activeTab === 'documents' && (
            <DocumentManager 
              documents={documents} 
              onDocumentsChange={handleDocumentsChange} 
              onNavigate={handleNavigate} 
            />
          )}

          {activeTab === 'chat' && (
            <ChatPanel 
              documents={documents} 
              selectedDocumentId={selectedDocId} 
              onSelectDocument={setSelectedDocId} 
            />
          )}

          {activeTab === 'settings' && (
            <Settings 
              user={user} 
              onUserUpdate={setUser} 
              onLogout={handleLogout} 
            />
          )}

        </main>

      </div>
    </div>
  );
}

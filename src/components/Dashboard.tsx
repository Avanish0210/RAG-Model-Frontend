import React from 'react';
import { User, Document } from '../types';
import { RAGMockBackend } from '../utils/mockBackend';
import { FileText, MessageSquare, Sparkles, UploadCloud, ChevronRight, ArrowUpRight, ShieldCheck, Database, Layout } from 'lucide-react';
import { Starburst } from '../App';

interface DashboardProps {
  user: User;
  onNavigate: (tab: string, arg?: any) => void;
  documents: Document[];
}

export default function Dashboard({ user, onNavigate, documents }: DashboardProps) {
  // Pull current active metrics (strictly human-oriented)
  const stats = RAGMockBackend.getStats();

  // Sort and slice documents
  const recentDocs = [...documents]
    .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-12 animate-fade-in" id="dashboard-workspace">
      
      {/* SECTION 1: LUXURIOUS DISPLAY HERO (INSPIRED BY FIRST HERO BLOCK IN REFERENCE) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4" id="dashboard-hero-section">
        
        {/* Left Side: Bold Editorial Typography Title and Subtitle */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-stone-900" />
            <span className="text-xs uppercase tracking-widest font-mono text-stone-500 font-semibold">Workspace Dashboard</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-stone-900 leading-tight">
            Perfect Ingestion Path with <span className="font-serif italic font-normal text-stone-500">Document Reader</span>
          </h1>

          <p className="text-stone-500 text-sm sm:text-base max-w-xl leading-relaxed font-sans">
            Unlock the full potential of your reference research files. Ingest multiple files, map dense vector relationships, and extract synthesis summaries safely inside your offline client container.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            {/* Elegant dark pill action buttons */}
            <button
              onClick={() => onNavigate('documents')}
              className="px-6 py-3.5 btn-neu-accent text-sm font-medium cursor-pointer flex items-center gap-2"
              id="dash-quick-upload-btn"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Ingest PDF File</span>
            </button>

            <button
              onClick={() => onNavigate('chat')}
              className="px-6 py-3.5 btn-neu-primary text-sm font-medium cursor-pointer flex items-center gap-2"
              id="dash-quick-chat-btn"
            >
              <Sparkles className="w-4 h-4 text-stone-605" />
              <span>Initiate AI Query</span>
            </button>
          </div>

          {/* Simple classic counter tags as in first pane (500k+ / 10k+) */}
          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-stone-200/60 max-w-md">
            <div>
              <div className="text-3xl font-extrabold text-stone-900 tracking-tight font-sans">99.8%</div>
              <div className="text-xs text-stone-450 uppercase tracking-wider font-mono mt-0.5">Prompt Recall Rate</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-[#5E7BA8] tracking-tight font-sans">Instant</div>
              <div className="text-xs text-stone-450 uppercase tracking-wider font-mono mt-0.5">Analytic Ingest Speed</div>
            </div>
          </div>
        </div>

        {/* Right Side Column: Beautiful Visual Abstract Frame (Similar to reference layout with rounded cards and clean badges) */}
        <div className="lg:col-span-5 relative">
          <div className="bg-stone-50/50 rounded-[2.5rem] border border-stone-200/60 p-6 flex flex-col justify-between min-h-[340px] relative overflow-hidden">
            
            {/* Visual geometric Starburst elements in corners replicating designer reference */}
            <div className="absolute right-6 top-6 opacity-30">
              <Starburst className="w-24 h-24 text-stone-400" />
            </div>

            <div className="space-y-4 relative z-10">
              <span className="px-3 py-1 bg-stone-90/80 backdrop-blur-xs text-[10px] font-mono rounded-full border border-stone-200 uppercase tracking-wider font-medium text-stone-600">
                System Isolation State
              </span>
              <h3 className="text-xl font-bold tracking-tight text-stone-900 pt-2 font-serif italic">
                Fully Decentralized Security
              </h3>
              <p className="text-xs text-stone-500 max-w-xs leading-relaxed">
                All uploaded documents and queried dialogue chains remain isolated in your standard client web storage partition.
              </p>
            </div>

            {/* Invariant status card widget mimicking reference widgets */}
            <div className="bg-white rounded-2xl p-4 border border-stone-200/60 flex items-center gap-3 mt-6 shadow-xs relative z-10 max-w-sm">
              <div className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-200/60 flex items-center justify-center text-stone-650">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase font-bold tracking-wider text-stone-400 font-mono">Platform Standard</div>
                <div className="text-xs font-bold text-stone-800 truncate">SANITIZED AND RE-INDEXED</div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* SECTION 2: STATS SUMMARY BENTO GRID (CLEAN MINIMAL CARD WELLS) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6" id="dashboard-statistics">
        
        {/* Stat 1: Total Docs */}
        <div className="p-6 rounded-3xl border border-stone-200 bg-stone-50/50 flex items-center justify-between hover:border-stone-400 transition-all" id="stat-uploaded-docs">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-stone-450 uppercase tracking-wider font-mono">Library Documents</p>
            <h3 className="text-3xl font-extrabold text-stone-900 font-sans">{stats.totalDocuments} Files</h3>
            <p className="text-[11px] text-emerald-700 font-medium font-sans mt-0.5">Ready for semantic search</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-700 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 2: Active Search Queries */}
        <div className="p-6 rounded-3xl border border-stone-200 bg-stone-50/50 flex items-center justify-between hover:border-stone-400 transition-all" id="stat-total-queries">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-stone-450 uppercase tracking-wider font-mono">Dialogue Loops</p>
            <h3 className="text-3xl font-extrabold text-stone-900 font-sans">{stats.totalQueries} Sessions</h3>
            <p className="text-[11px] text-stone-500 font-sans mt-0.5">Average reply time &lt;2s</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-700 shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 3: Vector Embedding blocks size */}
        <div className="p-6 rounded-3xl border border-stone-200 bg-stone-50/50 flex items-center justify-between hover:border-stone-400 transition-all" id="stat-active-docs">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-stone-450 uppercase tracking-wider font-mono">Active Nodes</p>
            <h3 className="text-3xl font-extrabold text-stone-900 font-sans">{stats.activeDocuments} Pieces</h3>
            <p className="text-[11px] text-stone-500 font-sans mt-0.5">Representations fully mapped</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-700 shrink-0">
            <Database className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* SECTION 3: RECENT INGESTIONS LIST STYLE (INSPIRED BY THE BOTTOM TABLE LIST IN THE REFERENCE IMAGE) */}
      <div className="space-y-5" id="recent-ingestions-panel">
        
        {/* Module Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-150">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 font-serif">
              Our Ingested <span className="italic font-normal text-stone-500">Research Streams</span>
            </h2>
            <p className="text-xs text-stone-450 font-sans mt-0.5">Manage vector alignments or launch AI questions</p>
          </div>

          <button
            onClick={() => onNavigate('documents')}
            className="text-xs font-semibold text-stone-900 hover:underline flex items-center gap-1 cursor-pointer bg-stone-100 px-3.5 py-1.5 rounded-full border border-stone-200"
            id="dash-view-all-docs"
          >
            <span>View All Library Documents</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Elegant horizontal list with numbered items exactly matching reference image list styling */}
        <div className="space-y-3" id="recent-docs-list-display">
          {recentDocs.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-dashed border-stone-300 text-stone-400 space-y-3" id="recent-docs-empty">
              <FileText className="w-8 h-8 mx-auto text-stone-300" />
              <div className="text-sm font-sans">No indexed documents are currently mapped in this partition.</div>
              <button
                onClick={() => onNavigate('documents')}
                className="px-5 py-2.5 bg-stone-900 text-white font-medium text-xs rounded-full hover:bg-stone-850 transition"
              >
                Upload PDF File
              </button>
            </div>
          ) : (
            recentDocs.map((doc, index) => {
              // Format numeric index prefix e.g. "01", "02" as seen in reference image list
              const formattedIndex = String(index + 1).padStart(2, '0');
              
              return (
                <div 
                  key={doc.id}
                  className="py-4 px-3 sm:px-5 rounded-3xl border border-stone-150 bg-white hover:bg-stone-50/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Left Column: Number + Name Description */}
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Circle numeric indicator as in reference */}
                    <span className="font-mono text-xs text-stone-400 font-bold shrink-0">
                      {formattedIndex}
                    </span>
                    
                    <div className="min-w-0">
                      <p className="font-bold text-sm sm:text-base text-stone-900 truncate pr-4">{doc.filename}</p>
                      
                      {/* Human literal descriptions */}
                      <div className="flex items-center gap-3 mt-1 text-xs text-stone-450 font-sans flex-wrap">
                        <span>{doc.size}</span>
                        <span className="w-1 h-1 rounded-full bg-stone-300" />
                        <span>Index Version {doc.version}</span>
                        <span className="w-1 h-1 rounded-full bg-stone-300" />
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-full text-[10px] uppercase font-bold tracking-wider font-mono">
                          {doc.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: "Reserve Spot / Request Spot" style action button translated to RAG Client */}
                  <button
                    onClick={() => onNavigate('chat', doc.id)}
                    className="px-5 py-2.5 bg-white hover:bg-stone-50 text-stone-900 border border-stone-200 hover:border-stone-400 rounded-full text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
                    title="Initialize Ingest Scoped Dialogue"
                  >
                    <span>Analyze in Chat</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-stone-400" />
                  </button>
                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
}

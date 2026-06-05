import React, { useState, useRef } from 'react';
import { Document } from '../types';
import { RAGMockBackend } from '../utils/mockBackend';
import { 
  UploadCloud, FileText, Trash2, History, Search, ArrowUpDown, 
  Check, RotateCcw, X, ArrowUpCircle, Info, Calendar, HardDrive 
} from 'lucide-react';
import { Starburst } from '../App';

interface DocumentManagerProps {
  documents: Document[];
  onDocumentsChange: (docs: Document[]) => void;
  onNavigate: (tab: string, docId?: any) => void;
}

export default function DocumentManager({ documents, onDocumentsChange, onNavigate }: DocumentManagerProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
  // Searching/Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'filename' | 'date' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Versions/Rollbacks state
  const [selectedDocForHistory, setSelectedDocForHistory] = useState<Document | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.pdf')) {
        setSelectedFile(file);
      } else {
        alert("Only standard Portable Document Format (PDF) files are supported for vector embedding.");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.toLowerCase().endsWith('.pdf')) {
        setSelectedFile(file);
      } else {
        alert("Only standard Portable Document Format (PDF) files are supported for vector embedding.");
      }
    }
  };

  // Perform upload logic (Simulate POST /upload)
  const handleIngestFile = async () => {
    if (!selectedFile) return;

    setUploadProgress(10);
    // Animate a bit of progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === null) return null;
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 15;
      });
    }, 150);

    try {
      const res = await RAGMockBackend.uploadDocument(selectedFile);
      setUploadProgress(100);
      clearInterval(interval);
      
      setTimeout(() => {
        if (res.success) {
          const updatedDocs = RAGMockBackend.getDocuments();
          onDocumentsChange(updatedDocs);
          setSelectedFile(null);
          setUploadProgress(null);
        } else {
          alert(res.error || "Ingestion system failure.");
          setUploadProgress(null);
        }
      }, 300);
    } catch (err: any) {
      clearInterval(interval);
      setUploadProgress(null);
      alert("Error occurred in local document ingest system.");
    }
  };

  // Replace version logic (Simulate PUT /upload/{id})
  const handleUpgradeVersion = async (docId: string, file: File) => {
    setUploadProgress(15);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === null) return null;
        if (prev >= 85) {
          clearInterval(interval);
          return 85;
        }
        return prev + 15;
      });
    }, 150);

    try {
      const res = await RAGMockBackend.updateDocumentVersion(docId, file);
      setUploadProgress(100);
      clearInterval(interval);

      setTimeout(() => {
        if (res.success) {
          const updatedDocs = RAGMockBackend.getDocuments();
          onDocumentsChange(updatedDocs);
          
          // Refresh details modal in state if open
          const latestDoc = updatedDocs.find(d => d.id === docId);
          if (latestDoc) {
            setSelectedDocForHistory(latestDoc);
          }
          setUploadProgress(null);
        } else {
          alert(res.error || "Upgrade version failure.");
          setUploadProgress(null);
        }
      }, 350);
    } catch (err) {
      clearInterval(interval);
      setUploadProgress(null);
      alert("Error upgrading document state.");
    }
  };

  // Rollback version
  const handleRollback = async (docId: string, versionNumber: number) => {
    const confirmRollback = confirm(`Are you sure you want to rollback active index profile of this document to Version ${versionNumber}?`);
    if (!confirmRollback) return;

    const res = await RAGMockBackend.rollbackDocumentVersion(docId, versionNumber);
    if (res.success) {
      const updatedDocs = RAGMockBackend.getDocuments();
      onDocumentsChange(updatedDocs);
      const latestDoc = updatedDocs.find(d => d.id === docId);
      if (latestDoc) {
        setSelectedDocForHistory(latestDoc);
      }
    } else {
      alert(res.error || "Failed to rollback.");
    }
  };

  // Delete document
  const handleDeleteDoc = async (docId: string, filename: string) => {
    const confirmDelete = confirm(`Are you sure you want to completely delete "${filename}" and purge all its chunk embeddings from index cache? This action is irreversible.`);
    if (!confirmDelete) return;

    const res = await RAGMockBackend.deleteDocument(docId);
    if (res.success) {
      const updatedDocs = RAGMockBackend.getDocuments();
      onDocumentsChange(updatedDocs);
      if (selectedDocForHistory?.id === docId) {
        setSelectedDocForHistory(null);
      }
    } else {
      alert(res.error || "Purge execution failed.");
    }
  };

  // Sorting columns
  const toggleSort = (col: 'filename' | 'date' | 'size') => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
  };

  // Filter & Sorted docs
  const filteredDocuments = documents
    .filter(doc => doc.filename.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'filename') {
        comparison = a.filename.localeCompare(b.filename);
      } else if (sortBy === 'date') {
        comparison = new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
      } else if (sortBy === 'size') {
        const parseSize = (s: string) => {
          const num = parseFloat(s);
          return s.includes('MB') ? num * 1024 : num;
        };
        comparison = parseSize(a.size) - parseSize(b.size);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  return (
    <div className="space-y-8 animate-fade-in" id="doc-manager-workspace">
      
      {/* Editorial Title Header */}
      <div id="doc-manager-header" className="flex items-center justify-between pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl sm:text-3.5xl font-extrabold tracking-tight text-stone-900 font-serif">
            The Ingested <span className="italic font-normal text-stone-500">Vector Library</span>
          </h1>
          <p className="text-xs text-stone-450 mt-1">
            Publish research documents, optimize character token blocks, and compare active revisions simply.
          </p>
        </div>
        <div className="hidden sm:block">
          <Starburst className="w-10 h-10 text-stone-300" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start" id="doc-manager-dashboard-grid">
        
        {/* Left Side: Upload Dropzone Element */}
        <div className="lg:col-span-4 space-y-6 animate-fade-in" id="upload-panel-container">
          <div className="bg-stone-50/50 p-6 rounded-[2rem] border border-stone-200 space-y-6">
            <h2 className="text-sm font-bold text-stone-800 uppercase tracking-widest font-mono flex items-center gap-2">
              <UploadCloud className="w-4.5 h-4.5 text-stone-900" />
              <span>Publish Research Paper</span>
            </h2>

            {/* Custom rounded dashed drop zone mimicking the image style rounded borders */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-[1.751rem] p-8 text-center cursor-pointer transition-all duration-300 bg-white min-h-[190px] flex flex-col items-center justify-center space-y-4 ${
                dragActive ? 'border-stone-900 bg-stone-50' : 'border-stone-250 hover:border-stone-400'
              }`}
              id="file-dropzone"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileSelect}
              />
              <div className="w-12 h-12 rounded-full border border-stone-200 bg-white flex items-center justify-center text-stone-800 shadow-xs">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-stone-800">
                  Drag & Drop PDF or <span className="text-stone-900 underline underline-offset-2 hover:text-stone-700">Browse</span>
                </p>
                <p className="text-[10px] text-stone-400 font-mono tracking-wide">
                  Standard format up to 50MB
                </p>
              </div>
            </div>

            {/* Selected file container */}
            {selectedFile && (
              <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3 animate-fade-in" id="selected-file-details">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-stone-900 truncate">{selectedFile.name}</p>
                    <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedFile(null)}
                    className="text-stone-400 hover:text-stone-605 cursor-pointer p-1 rounded-full hover:bg-stone-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <button 
                  onClick={handleIngestFile}
                  disabled={uploadProgress !== null}
                  className="w-full py-3 btn-neu-accent flex items-center justify-center gap-1.5 text-xs font-medium cursor-pointer"
                  id="process-ingest-btn"
                >
                  <ArrowUpCircle className="w-4 h-4" />
                  <span>Begin Analysis Processing</span>
                </button>
              </div>
            )}

            {/* Ingestion loader */}
            {uploadProgress !== null && (
              <div className="space-y-2 animate-fade-in" id="upload-progress-panel">
                <div className="flex justify-between items-center text-[10px] font-mono text-stone-500 tracking-wider">
                  <span>Processing text blocks...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-stone-900 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="p-4.5 rounded-2xl border border-stone-200 bg-stone-50/50 text-xs text-stone-500 flex gap-2.5">
            <Info className="w-4.5 h-4.5 text-stone-450 shrink-0 mt-0.5" />
            <div className="leading-relaxed text-[11px] space-y-1">
              <span className="font-bold text-stone-850 block">Semantic Indexes</span>
              <p>Uploaded documents are parsed inline into fine contextual paragraphs. This enables clear and accurate query referencing during active chat sessions.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Repositories table list */}
        <div className="lg:col-span-8 space-y-6" id="doc-table-and-history-combo">
          <div className="bg-white rounded-[2rem] border border-stone-200 p-6 space-y-6">
            
            {/* Filtering line */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-150" id="table-filters-row">
              <h2 className="text-sm font-bold uppercase tracking-widest text-stone-800 font-mono">My Documents Catalog ({documents.length})</h2>
              
              <div className="flex items-center gap-3 shrink-0">
                {/* Clean inline search bar matching ref image theme */}
                <div className="relative">
                  <Search className="absolute left-3.5 inset-y-0 my-auto text-stone-400 w-4 h-4" />
                  <input
                    id="doc-list-search-input"
                    type="text"
                    placeholder="Filter papers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 w-full sm:w-56 input-neu text-xs text-stone-800"
                  />
                </div>
              </div>
            </div>

            {/* Document tabular log */}
            <div className="overflow-x-auto" id="documents-table-wrapper">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-150 text-[11px] font-mono text-stone-400 tracking-wider">
                    <th className="py-3 px-2">
                      <button onClick={() => toggleSort('filename')} className="flex items-center gap-1 hover:text-stone-900 font-bold cursor-pointer">
                        <span>Filename</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3 px-2">
                      <button onClick={() => toggleSort('size')} className="flex items-center gap-1 hover:text-stone-900 font-bold cursor-pointer">
                        <span>Size</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3 px-2">
                      <button onClick={() => toggleSort('date')} className="flex items-center gap-1 hover:text-stone-900 font-bold cursor-pointer">
                        <span>Date Ingested</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3 px-2 font-bold text-center">Version Map</th>
                    <th className="py-3 px-2 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs text-stone-650">
                  {filteredDocuments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-stone-400 font-mono">
                        No active documents match your search scope.
                      </td>
                    </tr>
                  ) : (
                    filteredDocuments.map((doc, index) => (
                      <tr 
                        key={doc.id} 
                        className={`hover:bg-stone-50/50 transition-colors ${
                          selectedDocForHistory?.id === doc.id ? 'bg-stone-50' : ''
                        }`}
                      >
                        <td className="py-4 px-2 font-semibold text-stone-900">
                          <div className="flex items-center gap-2.5 max-w-xs sm:max-w-sm">
                            <span className="font-mono text-[10px] text-stone-400">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <FileText className="w-4 h-4 text-red-500 shrink-0" />
                            <span className="truncate" title={doc.filename}>{doc.filename}</span>
                          </div>
                        </td>
                        <td className="py-4 px-2 font-mono text-stone-500">{doc.size}</td>
                        <td className="py-4 px-2 text-stone-500">
                          {new Date(doc.uploadDate).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="py-4 px-2 text-center">
                          <span className="px-2.5 py-0.5 border border-stone-200 bg-stone-50 text-stone-705 text-[10px] font-mono font-semibold rounded-full">
                            v{doc.version} Live
                          </span>
                        </td>
                        <td className="py-4 px-2 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedDocForHistory(doc)}
                              className="p-2 rounded-full border border-stone-200 hover:border-stone-400 bg-white text-stone-600 cursor-pointer"
                              title="Compare document revisions"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onNavigate('chat', doc.id)}
                              className="px-3.5 py-1.5 rounded-full border border-stone-900 hover:bg-stone-900 hover:text-white bg-white text-stone-900 text-xs font-semibold cursor-pointer transition-all"
                              title="Analyze Paper"
                            >
                              <span>Understand</span>
                            </button>
                            <button
                              onClick={() => handleDeleteDoc(doc.id, doc.filename)}
                              className="p-2 rounded-full border border-red-150 hover:border-red-300 text-red-500 hover:bg-red-50 cursor-pointer"
                              title="Delete index document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>

          {/* Subordinate Revision Histories section */}
          {selectedDocForHistory && (
            <div className="bg-white rounded-[2rem] border border-stone-200 p-6 space-y-6 animate-fade-in" id="version-control-workspace-modal">
              <div className="flex items-center justify-between pb-3 border-b border-stone-150">
                <div>
                  <h3 className="text-base font-bold text-stone-900 flex items-center gap-2 font-serif">
                    <History className="w-4.5 h-4.5 text-stone-850" />
                    <span>Compare <span className="italic font-normal text-stone-500">Document Revisions</span></span>
                  </h3>
                  <p className="text-[11px] text-stone-450 mt-0.5">
                    Select older versions to perform rollback recovery or upload a revised document.
                  </p>
                </div>
                
                <button 
                  onClick={() => setSelectedDocForHistory(null)}
                  className="p-1 px-2.5 rounded-full border border-stone-200 bg-white hover:border-stone-450 text-stone-505 cursor-pointer text-xs font-semibold"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                
                {/* Timeline display */}
                <div className="md:col-span-7 space-y-4" id="timeline-display-blocks">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400 font-mono">Linage Sequence:</span>
                  
                  <div className="relative pl-6 space-y-6 before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                    {selectedDocForHistory.versions.map((ver, idx) => (
                      <div key={ver.version} className="relative space-y-2">
                        
                        {/* Circle numeric dot indicator */}
                        <div className={`absolute -left-[22px] top-1 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold font-mono ${
                          ver.active
                            ? 'bg-stone-900 border-stone-905 text-white shadow-sm'
                            : 'bg-white border-stone-300 text-stone-400'
                        }`}>
                          {ver.version}
                        </div>

                        <div className={`p-4 rounded-2xl border ${ver.active ? 'border-stone-300 bg-stone-50' : 'border-stone-200 opacity-80 bg-white'}`}>
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-xs font-bold text-stone-800">Version {ver.version} {ver.active && '(Active)'}</span>
                            
                            {!ver.active && (
                              <button
                                onClick={() => handleRollback(selectedDocForHistory.id, ver.version)}
                                className="px-3 py-1 text-[10px] font-bold text-stone-900 rounded-full border border-stone-200 bg-white hover:border-stone-400 cursor-pointer flex items-center gap-1 transition-all"
                              >
                                <RotateCcw className="w-2.5 h-2.5" />
                                <span>Re-activate block</span>
                              </button>
                            )}
                          </div>

                          <p className="text-xs font-semibold text-stone-800 mt-1 truncate" title={ver.filename}>
                            {ver.filename}
                          </p>

                          <div className="flex items-center gap-3 text-[10px] text-stone-400 mt-2 font-mono">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(ver.uploadDate).toLocaleDateString()}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <HardDrive className="w-3 h-3" />
                              {ver.size}
                            </span>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>

                {/* Replace/Update inline drop zone */}
                <div className="md:col-span-5 p-5 rounded-2xl bg-stone-50/50 border border-stone-200 space-y-4" id="inline-replace-card">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-stone-900 uppercase tracking-widest font-mono">Index Upgrade</h4>
                    <p className="text-[11px] text-stone-500 leading-relaxed font-sans">
                      Replace the active index representation by releasing a newer PDF. Existing revisions are safely preserved in state lineage.
                    </p>
                  </div>

                  <input
                    ref={replaceInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleUpgradeVersion(selectedDocForHistory.id, e.target.files[0]);
                      }
                    }}
                  />

                  <button
                    onClick={() => replaceInputRef.current?.click()}
                    className="w-full py-3 btn-neu-primary flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer"
                    id="upgrade-trigger-btn"
                  >
                    <ArrowUpCircle className="w-4 h-4 text-stone-900" />
                    <span>Upload New Revision</span>
                  </button>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}

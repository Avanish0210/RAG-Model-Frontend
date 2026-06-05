import React, { useState, useEffect, useRef } from 'react';
import { Document, ChatMessage } from '../types';
import { RAGMockBackend } from '../utils/mockBackend';
import { 
  Send, Copy, RotateCcw, Trash2, Download, Sparkles, BookOpen, 
  FileText, ArrowRight, Clock, Check, RefreshCw 
} from 'lucide-react';

interface ChatPanelProps {
  documents: Document[];
  selectedDocumentId: string | null;
  onSelectDocument: (id: string | null) => void;
}

export default function ChatPanel({ documents, selectedDocumentId, onSelectDocument }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync initial chat history
  useEffect(() => {
    const hist = RAGMockBackend.getChatMessages(selectedDocumentId || undefined);
    setMessages(hist);
  }, [selectedDocumentId]);

  // Scroll to bottom helper
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const activeDoc = documents.find(d => d.id === selectedDocumentId);

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || !selectedDocumentId || loading) return;

    const userQueryText = query;
    setQuery('');
    setLoading(true);

    const tempUserMessage: ChatMessage = {
      id: 'temp-user',
      role: 'user',
      content: userQueryText,
      timestamp: new Date().toISOString(),
      documentId: selectedDocumentId,
      documentName: activeDoc?.filename || 'Document',
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const res = await RAGMockBackend.sendChatQuery(userQueryText, selectedDocumentId);
      if (res.success) {
        const latestHistory = RAGMockBackend.getChatMessages(selectedDocumentId);
        setMessages(latestHistory);
      } else {
        alert(res.error || 'Failed to search response.');
        setMessages(prev => prev.filter(m => m.id !== 'temp-user'));
      }
    } catch (err) {
      alert('Communication timeout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    if (confirm('Clear entire dialogue history scoped to this document?')) {
      RAGMockBackend.clearChatHistory(selectedDocumentId || undefined);
      setMessages([]);
    }
  };

  const handleRegenerate = async (targetMsgIndex: number, originalQuery: string) => {
    if (!selectedDocumentId || loading) return;

    setLoading(true);
    setRegeneratingId(messages[targetMsgIndex]?.id || 'regen');

    try {
      const res = await RAGMockBackend.sendChatQuery(originalQuery, selectedDocumentId);
      if (res.success) {
        const latestHistory = RAGMockBackend.getChatMessages(selectedDocumentId);
        setMessages(latestHistory);
      }
    } catch {
      alert('Failed to regenerate response.');
    } finally {
      setLoading(false);
      setRegeneratingId(null);
    }
  };

  const handleCopyToClipboard = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportChatTranscript = () => {
    if (messages.length === 0) return;
    
    let md = `# Research Dialogue Transcript\n`;
    md += `Target Paper: ${activeDoc?.filename || 'Not specified'}\n`;
    md += `Date: ${new Date().toLocaleDateString()}\n\n---\n\n`;
    
    messages.forEach(msg => {
      const name = msg.role === 'user' ? 'CLIENT' : 'RESEARCH COMPANION';
      md += `**[${name}]**:\n${msg.content}\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Transcript_${activeDoc?.filename || 'Explore'}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderFormattedContent = (content: string) => {
    const parts = content.split(/(\`\`\`[\s\S]*?\`\`\`)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const rawCode = part.replace(/\`\`\`/g, '');
        const lines = rawCode.split('\n');
        const lang = lines[0].trim() || 'code';
        const code = lines.slice(1).join('\n').trim();

        return (
          <div key={index} className="my-3 rounded-2xl overflow-hidden border border-stone-200 bg-stone-900 text-stone-100 font-mono text-xs">
            <div className="bg-stone-850 px-4 py-2 flex items-center justify-between text-[10px] text-stone-400 font-bold uppercase tracking-wider select-none border-b border-stone-800">
              <span>{lang} summary output</span>
              <button
                onClick={() => navigator.clipboard.writeText(code)}
                className="hover:text-white cursor-pointer transition active:scale-95"
              >
                Copy
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-amber-100 leading-relaxed">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      const lines = part.split('\n');
      return (
        <div key={index} className="space-y-2 leading-relaxed">
          {lines.map((line, lineIdx) => {
            if (line.match(/^(\d+\.|\-|\*)\s+/)) {
              const cleaned = line.replace(/^(\d+\.|\-|\*)\s+/, '');
              return (
                <div key={lineIdx} className="flex gap-2 pl-4 text-xs sm:text-sm">
                  <span className="text-stone-850 font-bold font-mono shrink-0">•</span>
                  <span>{parseInlineStyles(cleaned)}</span>
                </div>
              );
            }
            return <p key={lineIdx} className="text-xs sm:text-sm leading-relaxed">{parseInlineStyles(line)}</p>;
          })}
        </div>
      );
    });
  };

  const parseInlineStyles = (txt: string): React.ReactNode => {
    if (!txt) return '';
    
    const monoSplit = txt.split(/(\`.*?\`)/g);
    return monoSplit.map((piece, pIdx) => {
      if (piece.startsWith('`') && piece.endsWith('`')) {
        return (
          <code key={pIdx} className="px-1.5 py-0.5 bg-stone-150 text-stone-850 font-mono text-[11px] font-semibold rounded-md">
            {piece.substring(1, piece.length - 1)}
          </code>
        );
      }

      const boldSplit = piece.split(/(\*\*.*?\*\*)/g);
      return boldSplit.map((subPiece, sIdx) => {
        if (subPiece.startsWith('**') && subPiece.endsWith('**')) {
          return (
            <strong key={sIdx} className="font-bold text-stone-900">
              {subPiece.substring(2, subPiece.length - 2)}
            </strong>
          );
        }
        return subPiece;
      });
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch h-[calc(100vh-210px)] min-h-[500px] animate-fade-in" id="chat-workspace-grid">
      
      {/* 1. Scoped Document Selection Rail */}
      <div className="lg:col-span-4 flex flex-col gap-6" id="chat-selector-rail">
        <div className="bg-stone-50/50 p-6 rounded-[2rem] border border-stone-200 flex flex-col gap-5 h-full overflow-hidden">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-stone-800 font-mono flex items-center gap-2">
              <BookOpen className="w-4.5 h-4.5 text-stone-805" />
              <span>Reference Scope</span>
            </h2>
            <p className="text-[11px] text-stone-450 mt-1.5 leading-relaxed font-sans">
              Dialogue answers are scoped exclusively to the contents of the chosen document index.
            </p>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto pr-1" id="scoping-dropdown-items">
            {documents.length === 0 ? (
              <div className="p-8 border border-dashed border-stone-250 rounded-2xl text-center text-xs text-stone-400 font-sans" id="scope-no-elements">
                No active PDF library records loaded. Upload a document to start asking questions.
              </div>
            ) : (
              <div className="space-y-2.5" id="scoped-documents-list-checks">
                {documents.map((doc, idx) => (
                  <button
                    key={doc.id}
                    onClick={() => onSelectDocument(doc.id)}
                    className={`w-full p-3.5 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer border ${
                      selectedDocumentId === doc.id
                        ? 'bg-stone-900 border-stone-900 text-white font-medium shadow-sm'
                        : 'bg-white border-stone-200 hover:border-stone-300 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`font-mono text-[10px] ${selectedDocumentId === doc.id ? 'text-stone-300' : 'text-stone-400'}`}>
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate pr-2">
                          {doc.filename}
                        </p>
                        <p className={`text-[10px] font-mono mt-0.5 ${selectedDocumentId === doc.id ? 'text-stone-300' : 'text-stone-400'}`}>
                          v{doc.version} • {doc.size}
                        </p>
                      </div>
                    </div>
                    {selectedDocumentId === doc.id && (
                      <Check className="w-4 h-4 text-white shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Dialogue Area */}
      <div className="lg:col-span-8 flex flex-col h-full" id="chat-workspace-console">
        <div className="bg-stone-50/50 p-6 rounded-[2rem] border border-stone-200 flex flex-col h-full overflow-hidden" id="chat-container-inner-card">
          
          {/* Active Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-stone-200 shrink-0" id="chat-active-header">
            <div className="min-w-0">
              <span className="text-[9px] font-mono text-stone-400 uppercase tracking-widest block font-bold">
                Scoped Reader Assistant
              </span>
              <h2 className="text-sm sm:text-base font-extrabold text-stone-900 truncate pr-4">
                {activeDoc ? activeDoc.filename : 'Choose a Document'}
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {messages.length > 0 && (
                <>
                  <button
                    onClick={exportChatTranscript}
                    className="px-4 py-2 bg-white rounded-full border border-stone-200 hover:border-stone-400 text-stone-700 text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
                    title="Export Markdown File"
                    id="export-md-btn"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Dialogue</span>
                  </button>

                  <button
                    onClick={handleClearHistory}
                    className="p-2 border border-stone-200 hover:border-red-300 rounded-full bg-white text-stone-405 hover:bg-stone-50 cursor-pointer"
                    title="Clear Dialogue Logs"
                    id="clear-logs-btn"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Message Thread Scroll View */}
          <div className="flex-1 overflow-y-auto py-5 space-y-5 px-1 font-sans" id="chat-messages-thread">
            {!selectedDocumentId ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 text-stone-400" id="chat-state-unselected">
                <div className="w-12 h-12 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 mb-1">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-extrabold text-stone-900">Select Reference Scope</h3>
                <p className="text-xs max-w-xs text-stone-500 leading-relaxed">
                  Please pick an active document index from the left panel list to direct your contextual search enquiry.
                </p>
              </div>
            ) : messages.length === 0 && !loading ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-5 text-stone-450 animate-fade-in" id="chat-state-empty">
                <div className="w-12 h-12 rounded-full border border-stone-200 flex items-center justify-center text-stone-500">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-stone-900">Ready for Intelligent Analysis</h3>
                  <p className="text-xs max-w-sm text-stone-500 leading-relaxed">
                    Ask any question regarding the requirements, metrics, constants, or layout definitions mapped within <strong className="text-stone-800">"{activeDoc?.filename}"</strong>.
                  </p>
                </div>
                
                <div className="text-[11px] flex flex-col gap-2.5 max-w-md w-full pt-2">
                  <button
                    onClick={() => setQuery("Are there explicit security requirements laid out?")}
                    className="p-3 text-left bg-white border border-stone-200 rounded-2xl hover:border-stone-400 text-stone-600 transition cursor-pointer text-xs"
                  >
                    "Are there explicit security requirements?" →
                  </button>
                  <button
                    onClick={() => setQuery("Can you summarize the core variables?")}
                    className="p-3 text-left bg-white border border-stone-200 rounded-2xl hover:border-stone-400 text-stone-600 transition cursor-pointer text-xs"
                  >
                    "Can you summarize the core variables?" →
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5" id="active-chats-bubble-list">
                {messages.map((msg, index) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div 
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full animate-fade-in`}
                    >
                      {/* Name tag and timestamp */}
                      <div className="flex items-center gap-2 mb-1 text-[10px] text-stone-400 font-mono">
                        <span className="font-semibold">{isUser ? 'My Request' : 'Analysis Companion'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.8 h-2.8" />
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Chat Bubbles */}
                      <div className={`relative max-w-[90%] sm:max-w-[85%] px-5 py-4 rounded-2xl selection:bg-stone-200 break-words border ${
                        isUser 
                          ? 'bg-stone-900 text-white border-stone-900 rounded-tr-none' 
                          : 'bg-white text-stone-800 border-stone-200 rounded-tl-none shadow-xs'
                      }`}>
                        <div className="text-xs sm:text-sm leading-relaxed" id={`message-content-${msg.id}`}>
                          {renderFormattedContent(msg.content)}
                        </div>

                        {/* Dialogue companion helper row */}
                        {!isUser && (
                          <div className="flex items-center gap-3 mt-3 pt-2 border-t border-stone-100 text-[10px]" id={`message-actions-${msg.id}`}>
                            <button
                              onClick={() => handleCopyToClipboard(msg.content, msg.id)}
                              className="px-2 py-1 text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer bg-stone-50 border border-stone-200 rounded-md transition-all"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-700 font-semibold">Saved!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Content</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => {
                                const precedingUserMsg = messages
                                  .slice(0, index)
                                  .reverse()
                                  .find(m => m.role === 'user');
                                if (precedingUserMsg) {
                                  handleRegenerate(index, precedingUserMsg.content);
                                }
                              }}
                              className="px-2 py-1 text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer bg-stone-50 border border-stone-200 rounded-md transition-all"
                              title="Re-run search query"
                            >
                              {regeneratingId === msg.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin text-stone-600" />
                              ) : (
                                <RotateCcw className="w-3 h-3" />
                              )}
                              <span>Regenerate Response</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Response Typing Loader */}
                {loading && (
                  <div className="flex flex-col items-start space-y-1.5 animate-pulse" id="chat-reply-loader">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-stone-400">
                      <Sparkles className="w-3.5 h-3.5 text-stone-700 animate-spin" />
                      <span>Retrieving paragraphs & parsing...</span>
                    </div>
                    <div className="px-4 py-3 border border-stone-205 rounded-2xl bg-white flex items-center gap-2.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-stone-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-stone-800"></span>
                      </span>
                      <p className="text-xs font-medium text-stone-500 font-sans">
                        Writing response summary...
                      </p>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Form Area */}
          <form 
            onSubmit={handleSendMessage} 
            className="pt-4 border-t border-stone-200 space-y-2 shrink-0" 
            id="query-text-box-form"
          >
            <div className="relative flex items-end gap-3 rounded-[1.5rem] p-2 bg-white border border-stone-200">
              <textarea
                id="query-textarea"
                rows={2}
                placeholder={
                  selectedDocumentId 
                    ? "Ask an intelligence query on facts in this document..." 
                    : "Please pick a document first on the left..."
                }
                value={query}
                onChange={(e) => {
                  if (e.target.value.length <= 1500) {
                    setQuery(e.target.value);
                  }
                }}
                onKeyDown={handleKeyDown}
                disabled={!selectedDocumentId || loading}
                className="flex-1 px-3 py-2 bg-transparent border-none outline-none text-xs sm:text-sm text-stone-850 resize-none max-h-24 min-h-[44px]"
              />

              <div className="flex items-center gap-2.5 shrink-0 p-1">
                <span className="text-[10px] font-mono text-stone-400 px-1 select-none">
                  {query.length}/1500
                </span>

                <button
                  type="submit"
                  disabled={!selectedDocumentId || !query.trim() || loading}
                  className={`p-3 rounded-full cursor-pointer transition-all flex items-center justify-center ${
                    !selectedDocumentId || !query.trim() || loading
                      ? 'bg-stone-100 text-stone-300'
                      : 'bg-stone-900 text-white hover:bg-stone-805 active:scale-95'
                  }`}
                  title="Post Query Sequence"
                  id="query-send-arrow-btn"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </form>

        </div>
      </div>

    </div>
  );
}

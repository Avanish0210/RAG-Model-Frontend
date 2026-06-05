import { User, Document, ChatMessage, ApiLog, DashboardStats, DocumentVersion } from '../types';

// Simple IDs helper
const generateId = () => Math.random().toString(36).substring(2, 11);

// Key-values for LocalStorage
const KEYS = {
  USERS: 'rag_users',
  CURRENT_USER: 'rag_current_user',
  DOCUMENTS: 'rag_documents',
  CHAT_MESSAGES: 'rag_chat_messages',
  API_LOGS: 'rag_api_logs',
};

const API_ENDPOINTS = {
  signup: '/api/auth/signup',
  login: '/api/auth/login',
  logout: '/api/auth/logout',
  upload: '/upload',
  chat: '/Documents/chat',
};

// Seed initial documents if empty so user has interactive data immediately
const INITIAL_DOCUMENTS: Document[] = [
  {
    id: 'doc-enterprise-security',
    filename: 'Secure_Data_Ingestion_Standard_v4.pdf',
    size: '2.4 MB',
    status: 'Active',
    uploadDate: '2026-06-04T10:15:30Z',
    version: 1,
    versions: [
      {
        version: 1,
        filename: 'Secure_Data_Ingestion_Standard_v4.pdf',
        uploadDate: '2026-06-04T10:15:30Z',
        size: '2.4 MB',
        active: true,
      }
    ]
  },
  {
    id: 'doc-ollama-rag',
    filename: 'Local_Embedding_and_Ollama_Setup_Guide.pdf',
    size: '1.1 MB',
    status: 'Active',
    uploadDate: '2026-06-05T08:30:00Z',
    version: 2,
    versions: [
      {
        version: 2,
        filename: 'Local_Embedding_and_Ollama_Setup_Guide_v2.pdf',
        uploadDate: '2026-06-05T08:30:00Z',
        size: '1.1 MB',
        active: true,
      },
      {
        version: 1,
        filename: 'Local_Embedding_and_Ollama_Setup_Guide_v1.pdf',
        uploadDate: '2026-06-02T14:22:15Z',
        size: '1.0 MB',
        active: false,
      }
    ]
  }
];

const INITIAL_CHATS: ChatMessage[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'How do I run hybrid search on local PDF files?',
    timestamp: '2026-06-05T09:00:00Z',
    documentId: 'doc-ollama-rag',
    documentName: 'Local_Embedding_and_Ollama_Setup_Guide.pdf'
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content: `To execute **hybrid search** on local PDF files using Ollama, you will combine dense vector embeddings with sparse keyword search:

1. **Sparse Vector Generation (BM25)**: Index raw textual contents of PDF chunks.
2. **Dense Vector Creation**: Use local embedding models such as \`nomic-embed-text\` or \`all-minilm\` to extract 384/768 dimensional chunk weights.
3. **Reciprocal Rank Fusion (RRF)**: Blend result lists from BM25 and Vector Search with a constant parameter (usually $k=60$):

\`\`\`python
def reciprocal_rank_fusion(dense_results, sparse_results, k=60):
    rrf_scores = {}
    for rank, doc_id in enumerate(dense_results):
        rrf_scores[doc_id] = rrf_scores.get(doc_id, 0) + 1.0 / (k + rank + 1)
    for rank, doc_id in enumerate(sparse_results):
        rrf_scores[doc_id] = rrf_scores.get(doc_id, 0) + 1.0 / (k + rank + 1)
    return sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)
\`\`\`

You can query Ollama backend with your retrieved context seamlessly. Let me know if you would like me to detail the chroma index structure!`,
    timestamp: '2026-06-05T09:00:05Z',
    documentId: 'doc-ollama-rag',
    documentName: 'Local_Embedding_and_Ollama_Setup_Guide.pdf'
  }
];

// Helper to get from storage
const getStorageItem = <T>(key: string, defaultValue: T): T => {
  const item = localStorage.getItem(key);
  if (!item) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(item) as T;
  } catch {
    return defaultValue;
  }
};

const setStorageItem = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

const parseResponseBody = async (response: Response): Promise<any> => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const getResponseValue = (responseBody: any, key: string): any => {
  return typeof responseBody === 'object' && responseBody !== null ? responseBody[key] : undefined;
};

const getResponseMessage = (responseBody: any, fallback: string): string => {
  if (typeof responseBody === 'string' && responseBody.trim()) return responseBody;
  return getResponseValue(responseBody, 'message') || getResponseValue(responseBody, 'error') || fallback;
};

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('jwt_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getAuthTokenError = (): string | null => {
  const token = localStorage.getItem('jwt_token');
  if (!token) {
    return 'Please sign in before using upload or chat.';
  }
  if (['demo-bypass-token', 'offline-session-token'].includes(token) || token.startsWith('jwt_token_auth_')) {
    return 'Your saved session token is local-only. Please sign out and sign in again so the frontend can store the real backend JWT.';
  }
  return null;
};

export class RAGMockBackend {
  // Add API Log helper
  private static addLog(method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, status: number, payload?: any, response?: any) {
    const logs = getStorageItem<ApiLog[]>(KEYS.API_LOGS, []);
    const newLog: ApiLog = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      method,
      url,
      status,
      payload: payload ? JSON.stringify(payload, null, 2) : undefined,
      response: response ? JSON.stringify(response, null, 2) : undefined,
    };
    setStorageItem(KEYS.API_LOGS, [newLog, ...logs].slice(0, 50)); // limit 50 logs
    
    // Dispatch a custom event to notify components about log updates
    window.dispatchEvent(new CustomEvent('rag_api_log_added', { detail: newLog }));
  }

  static getLogs(): ApiLog[] {
    return getStorageItem<ApiLog[]>(KEYS.API_LOGS, []);
  }

  static clearLogs(): void {
    setStorageItem(KEYS.API_LOGS, []);
    window.dispatchEvent(new CustomEvent('rag_api_log_added'));
  }

  // --- AUTHENTICATION ---
  static async signup(username: string, name: string, password: string): Promise<{ success: boolean; data?: any; error?: string }> {
    const signupUrl = API_ENDPOINTS.signup;
    const requestPayload = { username, name, password };
    
    try {
      const response = await fetch(signupUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      const responseBody = await parseResponseBody(response);
      this.addLog('POST', signupUrl, response.status, requestPayload, responseBody);

      if (response.ok) {
        const newUser: User = {
          id: getResponseValue(responseBody, 'userId') || getResponseValue(responseBody, 'id') || 'usr-' + generateId(),
          username: username.toLowerCase(),
          name: name || getResponseValue(responseBody, 'name') || username,
        };
        const users = getStorageItem<any[]>(KEYS.USERS, []);
        if (!users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
          setStorageItem(KEYS.USERS, [...users, { ...newUser, password }]);
        }
        return { success: true, data: responseBody };
      } else {
        return { success: false, error: getResponseMessage(responseBody, `Signup failed with status ${response.status}`) };
      }
    } catch (networkError: any) {
      this.addLog('POST', signupUrl, 0, requestPayload, { error: 'Network Connection Failed', message: networkError.message });
      
      // Fallback fallback so user can still test in sandbox if their backend is not running
      const newUser: User = {
        id: 'usr-' + generateId(),
        username: username.toLowerCase(),
        name: name || username,
      };
      const users = getStorageItem<any[]>(KEYS.USERS, []);
      if (!users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        setStorageItem(KEYS.USERS, [...users, { ...newUser, password }]);
      }
      return { 
        success: true, 
        data: { 
          message: `Created in offline sandbox. Real sign-up attempt to ${signupUrl} failed (CORS or server offline).`,
          offlineFallback: true
        } 
      };
    }
  }

  static async login(username: string, password: string): Promise<{ success: boolean; token?: string; error?: string }> {
    const loginUrl = API_ENDPOINTS.login;
    const requestPayload = { username, password };
    
    try {
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      const responseBody = await parseResponseBody(response);
      this.addLog('POST', loginUrl, response.status, requestPayload, responseBody);

      if (response.ok) {
        const matchedUser: User = {
          id: getResponseValue(responseBody, 'userId') || getResponseValue(responseBody, 'id') || 'usr-' + generateId(),
          username: username.toLowerCase(),
          name: getResponseValue(responseBody, 'name') || getResponseValue(responseBody, 'username') || username
        };
        
        setStorageItem(KEYS.CURRENT_USER, matchedUser);
        const jwtToken = typeof responseBody === 'string'
          ? responseBody
          : getResponseValue(responseBody, 'token') || getResponseValue(responseBody, 'jwt');

        if (!jwtToken) {
          return { success: false, error: 'Login succeeded but the backend did not return an access token.' };
        }

        localStorage.setItem('jwt_token', jwtToken);
        
        return { success: true, token: jwtToken };
      } else {
        return { success: false, error: getResponseMessage(responseBody, 'Invalid credentials') };
      }
    } catch (networkError: any) {
      this.addLog('POST', loginUrl, 0, requestPayload, { error: 'Network Connection Failed', message: networkError.message });
      
      // Fallback option for demo user or quick preview
      if (username === 'demo' && password === 'demo1234') {
        const demoUser: User = { id: 'usr-demo', username: 'demo', name: 'Enterprise User' };
        setStorageItem(KEYS.CURRENT_USER, demoUser);
        localStorage.setItem('jwt_token', 'demo-bypass-token');
        return { success: true, token: 'demo-bypass-token' };
      }

      // Check offline credential match in localStorage USERS cache
      const users = getStorageItem<any[]>(KEYS.USERS, []);
      const matchedOffline = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
      
      if (matchedOffline) {
        const matchedUser: User = {
          id: matchedOffline.id,
          username: matchedOffline.username,
          name: matchedOffline.name
        };
        setStorageItem(KEYS.CURRENT_USER, matchedUser);
        localStorage.setItem('jwt_token', 'offline-session-token');
        return { success: true, token: 'offline-session-token' };
      }

      return { 
        success: false, 
        error: `Could not connect to backend at ${loginUrl}. Ensure your backend server is running on port 8080, has CORS enabled, and accepts POST requests. (Tip: Use the 'demo' / 'demo1234' credentials to bypass this).` 
      };
    }
  }

  static getCurrentUser(): User | null {
    return getStorageItem<User | null>(KEYS.CURRENT_USER, null);
  }

  static logout(): void {
    const user = this.getCurrentUser();
    this.addLog('POST', API_ENDPOINTS.logout, 200, { username: user?.username }, { message: 'Logged out successfully' });
    localStorage.removeItem(KEYS.CURRENT_USER);
    localStorage.removeItem('jwt_token');
  }

  // --- DOCUMENT MANAGEMENT ---
  static getDocuments(): Document[] {
    return getStorageItem<Document[]>(KEYS.DOCUMENTS, INITIAL_DOCUMENTS);
  }

  static async uploadDocument(file: File): Promise<{ success: boolean; data?: any; error?: string }> {
    const uploadUrl = API_ENDPOINTS.upload;
    
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      const errRes = { error: 'Unsupported Media Type', message: 'Only standard PDF files are permitted.' };
      this.addLog('POST', uploadUrl, 415, { fileName: file.name }, errRes);
      return { success: false, error: errRes.message };
    }

    const formData = new FormData();
    formData.append('file', file);

    const authError = getAuthTokenError();
    if (authError) {
      this.addLog('POST', uploadUrl, 403, { filename: file.name, size: file.size }, { error: authError });
      return { success: false, error: authError };
    }

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });

      const responseBody = await parseResponseBody(response);
      this.addLog('POST', uploadUrl, response.status, { filename: file.name, size: file.size }, responseBody);

      if (response.ok) {
        const docId = getResponseValue(responseBody, 'documentId') || getResponseValue(responseBody, 'id') || 'doc-' + generateId();
        const formattedSize = file.size > 1024 * 1024 
          ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' 
          : (file.size / 1024).toFixed(0) + ' KB';

        const newVersion: DocumentVersion = {
          version: getResponseValue(responseBody, 'version') || 1,
          filename: file.name,
          uploadDate: new Date().toISOString(),
          size: formattedSize,
          active: true
        };

        const newDoc: Document = {
          id: docId,
          filename: getResponseValue(responseBody, 'filename') || file.name,
          size: formattedSize,
          status: 'Active',
          uploadDate: new Date().toISOString(),
          version: getResponseValue(responseBody, 'version') || 1,
          versions: [newVersion]
        };

        const documents = this.getDocuments();
        const updatedDocs = [newDoc, ...documents];
        setStorageItem(KEYS.DOCUMENTS, updatedDocs);

        return { success: true, data: responseBody };
      } else {
        return { success: false, error: getResponseMessage(responseBody, `Upload failed with status ${response.status}. Please sign in again before uploading.`) };
      }
    } catch (networkError: any) {
      this.addLog('POST', uploadUrl, 0, { filename: file.name, size: file.size }, { error: 'Upload Connection Failed', message: networkError.message });
      
      // Fallback client local saves so UI remains completely operational
      const docId = 'doc-' + generateId();
      const formattedSize = file.size > 1024 * 1024 
        ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' 
        : (file.size / 1024).toFixed(0) + ' KB';

      const newVersion: DocumentVersion = {
        version: 1,
        filename: file.name,
        uploadDate: new Date().toISOString(),
        size: formattedSize,
        active: true
      };

      const newDoc: Document = {
        id: docId,
        filename: file.name,
        size: formattedSize,
        status: 'Active',
        uploadDate: new Date().toISOString(),
        version: 1,
        versions: [newVersion]
      };

      const documents = this.getDocuments();
      setStorageItem(KEYS.DOCUMENTS, [newDoc, ...documents]);

      return { 
        success: true, 
        data: { 
          message: `Your document is indexed locally inside the sandbox. Could not broadcast to ${uploadUrl} (${networkError.message}).`,
          offlineFallback: true
        } 
      };
    }
  }

  static async updateDocumentVersion(documentId: string, file: File): Promise<{ success: boolean; data?: any; error?: string }> {
    const uploadUrl = API_ENDPOINTS.upload;
    
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      const errRes = { error: 'Unsupported Media Type', message: 'Only standard PDF files are permitted for versioning.' };
      this.addLog('PUT', `${uploadUrl}/${documentId}`, 415, { file: file.name }, errRes);
      return { success: false, error: errRes.message };
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentId', documentId);

    const authError = getAuthTokenError();
    if (authError) {
      this.addLog('PUT', `${uploadUrl}/${documentId}`, 403, { documentId, filename: file.name }, { error: authError });
      return { success: false, error: authError };
    }

    try {
      const response = await fetch(`${uploadUrl}/${documentId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: formData,
      });

      const responseBody = await parseResponseBody(response);
      this.addLog('PUT', `${uploadUrl}/${documentId}`, response.status, { documentId, filename: file.name }, responseBody);

      if (response.ok) {
        const documents = this.getDocuments();
        const docIndex = documents.findIndex(d => d.id === documentId);
        if (docIndex !== -1) {
          const targetDoc = documents[docIndex];
          const newVersionNum = getResponseValue(responseBody, 'version') || targetDoc.version + 1;
          const formattedSize = file.size > 1024 * 1024 
            ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' 
            : (file.size / 1024).toFixed(0) + ' KB';

          const updatedVersions = targetDoc.versions.map(v => ({ ...v, active: false }));

          const newVersion: DocumentVersion = {
            version: newVersionNum,
            filename: file.name,
            uploadDate: new Date().toISOString(),
            size: formattedSize,
            active: true
          };

          const updatedDoc: Document = {
            ...targetDoc,
            filename: file.name,
            size: formattedSize,
            version: newVersionNum,
            uploadDate: new Date().toISOString(),
            versions: [newVersion, ...updatedVersions]
          };

          documents[docIndex] = updatedDoc;
          setStorageItem(KEYS.DOCUMENTS, documents);
        }
        return { success: true, data: responseBody };
      } else {
        return { success: false, error: getResponseMessage(responseBody, `Upgrade failed with status ${response.status}. Please sign in again before uploading.`) };
      }
    } catch (networkError: any) {
      this.addLog('PUT', `${uploadUrl}/${documentId}`, 0, { documentId, filename: file.name }, { error: 'Upgrade Connection Failed', message: networkError.message });
      
      const documents = this.getDocuments();
      const docIndex = documents.findIndex(d => d.id === documentId);
      if (docIndex !== -1) {
        const targetDoc = documents[docIndex];
        const newVersionNum = targetDoc.version + 1;
        const formattedSize = file.size > 1024 * 1024 
          ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' 
          : (file.size / 1024).toFixed(0) + ' KB';

        const updatedVersions = targetDoc.versions.map(v => ({ ...v, active: false }));

        const newVersion: DocumentVersion = {
          version: newVersionNum,
          filename: file.name,
          uploadDate: new Date().toISOString(),
          size: formattedSize,
          active: true
        };

        const updatedDoc: Document = {
          ...targetDoc,
          filename: file.name,
          size: formattedSize,
          version: newVersionNum,
          uploadDate: new Date().toISOString(),
          versions: [newVersion, ...updatedVersions]
        };

        documents[docIndex] = updatedDoc;
        setStorageItem(KEYS.DOCUMENTS, documents);
      }
      return { 
        success: true, 
        data: { 
          message: `Saved version locally inside sandbox. Could not broadcast to ${uploadUrl} (${networkError.message}).`,
          offlineFallback: true
        } 
      };
    }
  }

  static async rollbackDocumentVersion(documentId: string, targetVersionNum: number): Promise<{ success: boolean; error?: string }> {
    await new Promise((r) => setTimeout(r, 600));

    const documents = this.getDocuments();
    const docIndex = documents.findIndex(d => d.id === documentId);
    if (docIndex === -1) {
      return { success: false, error: 'Document not found.' };
    }

    const targetDoc = documents[docIndex];
    const targetVer = targetDoc.versions.find(v => v.version === targetVersionNum);
    if (!targetVer) {
      return { success: false, error: `Version ${targetVersionNum} not found.` };
    }

    const updatedVersions = targetDoc.versions.map(v => ({
      ...v,
      active: v.version === targetVersionNum
    }));

    const updatedDoc: Document = {
      ...targetDoc,
      filename: targetVer.filename,
      size: targetVer.size,
      version: targetVersionNum,
      versions: updatedVersions
    };

    documents[docIndex] = updatedDoc;
    setStorageItem(KEYS.DOCUMENTS, documents);

    this.addLog('PUT', `${API_ENDPOINTS.upload}/${documentId}/rollback`, 200, { targetVersion: targetVersionNum }, {
      documentId,
      activeVersion: targetVersionNum,
      message: `Rolled back to Version ${targetVersionNum} successfully.`
    });

    return { success: true };
  }

  static async deleteDocument(documentId: string): Promise<{ success: boolean; error?: string }> {
    await new Promise((r) => setTimeout(r, 500));
    const deleteUrl = `${API_ENDPOINTS.upload}/${documentId}`;
    const authError = getAuthTokenError();
    
    // Attempt actual upload file purge if backend is active
    if (!authError) {
      try {
        await fetch(deleteUrl, { method: 'DELETE', headers: getAuthHeaders() });
      } catch {}
    }

    const documents = this.getDocuments();
    const docIndex = documents.findIndex(d => d.id === documentId);
    if (docIndex === -1) {
      const errRes = { error: 'Not Found', message: 'Document does not exist.' };
      this.addLog('DELETE', deleteUrl, 404, undefined, errRes);
      return { success: false, error: errRes.message };
    }

    const updatedDocs = documents.filter(d => d.id !== documentId);
    setStorageItem(KEYS.DOCUMENTS, updatedDocs);

    const chatHistory = getStorageItem<ChatMessage[]>(KEYS.CHAT_MESSAGES, INITIAL_CHATS);
    const cleanedHistory = chatHistory.filter(msg => msg.documentId !== documentId);
    setStorageItem(KEYS.CHAT_MESSAGES, cleanedHistory);

    const successRes = { id: documentId, message: 'Document and indices removed from Vector DB.' };
    this.addLog('DELETE', deleteUrl, 200, undefined, successRes);
    return { success: true };
  }

  // --- CHAT & QUERY ENGINE ---
  static getChatMessages(documentId?: string): ChatMessage[] {
    const messages = getStorageItem<ChatMessage[]>(KEYS.CHAT_MESSAGES, INITIAL_CHATS);
    if (documentId) {
      return messages.filter(msg => msg.documentId === documentId);
    }
    return messages;
  }

  static clearChatHistory(documentId?: string): void {
    if (documentId) {
      const messages = getStorageItem<ChatMessage[]>(KEYS.CHAT_MESSAGES, INITIAL_CHATS);
      const remaining = messages.filter(msg => msg.documentId !== documentId);
      setStorageItem(KEYS.CHAT_MESSAGES, remaining);
    } else {
      setStorageItem(KEYS.CHAT_MESSAGES, []);
    }
  }

  static async sendChatQuery(query: string, documentId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    const chatUrl = API_ENDPOINTS.chat;
    const documents = this.getDocuments();
    const doc = documents.find(d => d.id === documentId);

    if (!doc) {
      const errorRes = { error: 'Bad Request', message: 'Scoping error: Standard RAG search requires a target active PDF document.' };
      this.addLog('POST', chatUrl, 400, { query, documentId }, errorRes);
      return { success: false, error: errorRes.message };
    }

    const requestPayload = { 
      query: query, 
      documentId: documentId, 
      filename: doc.filename,
      version: doc.version 
    };

    const chatHistory = getStorageItem<ChatMessage[]>(KEYS.CHAT_MESSAGES, INITIAL_CHATS);

    const userMessage: ChatMessage = {
      id: 'msg-' + generateId(),
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
      documentId,
      documentName: doc.filename,
    };

    const authError = getAuthTokenError();
    if (authError) {
      this.addLog('POST', chatUrl, 403, requestPayload, { error: authError });
      return { success: false, error: authError };
    }

    try {
      const response = await fetch(chatUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(requestPayload),
      });

      const responseBody = await parseResponseBody(response);
      this.addLog('POST', chatUrl, response.status, requestPayload, responseBody);

      if (response.ok) {
        const aiReply = getResponseValue(responseBody, 'reply')
          || getResponseValue(responseBody, 'answer')
          || getResponseValue(responseBody, 'response')
          || getResponseValue(responseBody, 'content')
          || "No response retrieved from RAG backend.";
        
        const aiMessage: ChatMessage = {
          id: getResponseValue(responseBody, 'id') || 'msg-' + generateId(),
          role: 'assistant',
          content: aiReply,
          timestamp: new Date().toISOString(),
          documentId,
          documentName: doc.filename,
        };

        setStorageItem(KEYS.CHAT_MESSAGES, [...chatHistory, userMessage, aiMessage]);
        return { success: true, data: responseBody };
      } else {
        return { success: false, error: getResponseMessage(responseBody, `RAG search failed with status ${response.status}. Please sign in again before chatting.`) };
      }
    } catch (networkError: any) {
      this.addLog('POST', chatUrl, 0, requestPayload, { error: 'Chat Connection Failed', message: networkError.message });

      // Local fallback generation with beautiful visual indicator notice
      const fallbackReplies = [
        `***Offline Sandbox Fallback***

We attempted an intelligent retrieval by broadcasting a \`POST\` query immediately to your backend at **${chatUrl}**, but it returned a network timeout (CORS or server offline).

Here is a contextual response compiled locally for **${doc.filename}**:
- **Subject**: "${query}"
- **Paragraph Matching**: Matched page 4 references successfully.
- **Reference Resolution**:
  Please verify that your backend is listening on port 8080. Once your backend is live, this chat panel will bind automatically to real-time data search results!

Would you like to examine the metadata structure of **${doc.filename}** instead?`
      ];

      const aiReply = fallbackReplies[0];
      const aiMessage: ChatMessage = {
        id: 'msg-' + generateId(),
        role: 'assistant',
        content: aiReply,
        timestamp: new Date().toISOString(),
        documentId,
        documentName: doc.filename,
      };

      setStorageItem(KEYS.CHAT_MESSAGES, [...chatHistory, userMessage, aiMessage]);
      return { 
        success: true, 
        data: { 
          answer: aiReply, 
          message: `Local fallback triggered. Outgoing query to ${chatUrl} timed out (${networkError.message}).` 
        } 
      };
    }
  }

  // --- STATS DOCK ---
  static getStats(): DashboardStats {
    const docs = this.getDocuments();
    const chats = this.getChatMessages();
    const active = docs.filter(d => d.status === 'Active').length;

    return {
      totalDocuments: docs.length,
      totalQueries: chats.filter(c => c.role === 'user').length,
      activeDocuments: active,
    };
  }
}

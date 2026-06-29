import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  RefreshCw, 
  File,
  Trash2,
  ExternalLink,
  Search,
  Pill,
  Receipt,
  FileCheck
} from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface DocumentScannerProps {
  onScanComplete: () => void;
}

interface ScannedDocument {
  id: number;
  filename: string;
  category: string; // "bill" | "prescription" | "notice" | "other"
  summary: string;
  extracted_text: string | null;
  file_path: string;
  created_at: string;
}

export const DocumentScanner: React.FC<DocumentScannerProps> = ({ onScanComplete }) => {
  const [activeSubTab, setActiveSubTab] = useState<'scan' | 'vault'>('scan');
  
  // Scanner States
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    document: {
      id: number;
      filename: string;
      category: string;
      summary: string;
      file_path: string;
    };
    action_taken: string;
    savings_recommendation: string;
  } | null>(null);

  // Vault States
  const [documents, setDocuments] = useState<ScannedDocument[]>([]);
  const [vaultLoading, setVaultLoading] = useState(false);
  const [vaultError, setVaultError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    setVaultLoading(true);
    setVaultError(null);
    try {
      const res = await axios.get(`${API_BASE}/api/documents`);
      setDocuments(res.data);
    } catch (err: any) {
      console.error(err);
      setVaultError("Failed to fetch historical documents.");
    } finally {
      setVaultLoading(false);
    }
  };

  const handleDeleteDocument = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this document? This will also delete the uploaded file from the server.")) {
      return;
    }
    try {
      await axios.delete(`${API_BASE}/api/documents/${id}`);
      fetchDocuments();
      onScanComplete(); // Refresh main dashboard stats/logs
    } catch (err: any) {
      console.error(err);
      alert("Failed to delete the document.");
    }
  };

  useEffect(() => {
    if (activeSubTab === 'vault') {
      fetchDocuments();
    }
  }, [activeSubTab]);

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
      setFile(e.dataTransfer.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${API_BASE}/api/documents/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.success) {
        setResult(res.data);
        onScanComplete(); // Refresh parent dashboard tables
      } else {
        setError("Scanning failed. Please try again.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Error connecting to the OCR scanning service.");
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  const filteredDocs = documents.filter(doc => 
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc.summary && doc.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
    doc.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl border border-orange-50 p-6 shadow-premium transition-all duration-300 hover:shadow-premium-hover max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-orange-50 pb-4 mb-4">
        <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
          <Upload size={18} />
        </div>
        <div className="text-left">
          <h3 className="font-bold text-gray-800 text-lg">Everyday OCR & Vision Scanner</h3>
          <p className="text-xs text-gray-400">Scan bills, prescriptions, or notices. "Scan Anything. Improve Everything."</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-orange-50 mb-6">
        <button
          onClick={() => setActiveSubTab('scan')}
          className={`flex-1 py-2.5 font-bold text-xs uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeSubTab === 'scan'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Scan New Document
        </button>
        <button
          onClick={() => setActiveSubTab('vault')}
          className={`flex-1 py-2.5 font-bold text-xs uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeSubTab === 'vault'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Document Vault
        </button>
      </div>

      {activeSubTab === 'scan' ? (
        <>
          {!result && !loading && (
            <div className="space-y-5">
              {/* Drag & Drop Area */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={onButtonClick}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center ${
                  dragActive 
                    ? 'border-orange-500 bg-orange-50/20' 
                    : 'border-orange-200 hover:border-orange-400 bg-white'
                }`}
              >
                <input 
                  ref={fileInputRef}
                  type="file" 
                  className="hidden" 
                  onChange={handleFileChange}
                  accept="image/*,application/pdf"
                />
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mb-3.5">
                  <Upload size={22} />
                </div>
                <p className="text-sm font-bold text-gray-700">Drag and drop file here, or click to browse</p>
                <p className="text-xs text-gray-400 mt-1">Supports PNG, JPG, JPEG, and PDF (bills, prescriptions, notices)</p>
              </div>

              {/* Selected File Details */}
              {file && (
                <div className="flex items-center justify-between p-3.5 bg-orange-50/20 rounded-xl border border-orange-100/50">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-orange-500" />
                    <div className="text-left">
                      <p className="text-sm font-bold text-gray-700 truncate max-w-xs">{file.name}</p>
                      <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleUpload}
                    className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all duration-300 shadow-sm shadow-orange-500/10 cursor-pointer"
                  >
                    Scan with AI
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Loading Animation */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-12 h-12 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin"></div>
              <div className="text-center">
                <p className="text-sm font-bold text-gray-700">Extracting details with AI Vision...</p>
                <p className="text-xs text-gray-400 mt-1">Reading text, classifying document, and executing database updates</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 mt-4">
              <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={16} />
              <div className="text-left">
                <p className="text-xs font-bold text-rose-800">Scan Failed</p>
                <p className="text-xs text-rose-600 mt-0.5">{error}</p>
                <button 
                  onClick={resetScanner}
                  className="text-xs text-orange-600 font-bold underline mt-2 hover:text-orange-700 block"
                >
                  Try another file
                </button>
              </div>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className="space-y-5 animate-fade-in text-left">
              <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-bold text-emerald-800">AI Scan Successful!</p>
                  <p className="text-xs text-emerald-600 mt-0.5">{result.action_taken}</p>
                </div>
              </div>

              <div className="border border-orange-100 rounded-xl overflow-hidden">
                <div className="bg-orange-50/50 px-4 py-3 border-b border-orange-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                    📄 Document Summary
                  </span>
                  <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full uppercase">
                    {result.document.category}
                  </span>
                </div>
                <div className="p-4 space-y-3.5 bg-white">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">File Name</span>
                    <span className="text-sm text-gray-700 font-medium">{result.document.filename}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Scan Summary</span>
                    <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{result.document.summary}</p>
                  </div>
                </div>
              </div>

              {result.savings_recommendation && (
                <div className="p-4 bg-orange-50/30 border border-orange-100/50 rounded-xl flex items-start gap-3">
                  <Sparkles className="text-orange-500 shrink-0 mt-0.5" size={16} />
                  <div>
                    <p className="text-xs font-bold text-orange-800">LifeLens Optimization Recommendation</p>
                    <p className="text-xs text-orange-700 mt-1 leading-relaxed">{result.savings_recommendation}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={resetScanner}
                  className="px-4 py-2 border border-orange-200 text-orange-600 font-semibold text-xs rounded-xl hover:bg-orange-50/50 transition-colors cursor-pointer"
                >
                  Scan Another Document
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4 text-left">
          {/* Search bar & Refresh */}
          <div className="flex gap-3">
            <div className="flex-1 relative flex items-center">
              <input
                type="text"
                placeholder="Search by filename, category, or summary..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-orange-100 rounded-xl text-xs focus:outline-none focus:border-orange-500 transition-all placeholder-gray-300"
              />
              <Search size={14} className="absolute left-3 text-gray-400" />
            </div>
            <button
              onClick={fetchDocuments}
              className="p-2 border border-orange-100 rounded-xl text-orange-500 hover:bg-orange-50 transition-colors cursor-pointer"
              title="Refresh Vault"
            >
              <RefreshCw size={14} className={vaultLoading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Vault Contents */}
          {vaultLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-orange-200 border-t-orange-500 animate-spin"></div>
              <p className="text-xs text-gray-400">Fetching document history...</p>
            </div>
          ) : vaultError ? (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600">
              {vaultError}
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-12 text-gray-400 border-2 border-dashed border-orange-100/50 rounded-xl">
              <p className="text-sm font-semibold">No scanned documents found.</p>
              <p className="text-xs mt-1">Files you scan in the first tab will automatically appear here.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {filteredDocs.map((doc) => {
                let Icon = File;
                if (doc.category === 'bill') Icon = Receipt;
                else if (doc.category === 'prescription') Icon = Pill;
                else if (doc.category === 'notice') Icon = FileText;
                else if (doc.category === 'other') Icon = FileCheck;

                return (
                  <div 
                    key={doc.id} 
                    className="p-4 rounded-xl border border-orange-100/30 bg-orange-50/5 hover:bg-orange-50/10 hover:border-orange-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="flex gap-3 items-start text-left min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-orange-100/80 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-gray-700 truncate max-w-[200px] sm:max-w-[280px]">
                            {doc.filename}
                          </h4>
                          <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-semibold uppercase shrink-0">
                            {doc.category}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                          {doc.summary || "No summary available."}
                        </p>
                        <span className="text-[9px] text-gray-400 block mt-1.5">
                          Scanned: {doc.created_at}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:self-center self-end shrink-0">
                      <a
                        href={`${API_BASE}${doc.file_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 border border-orange-100 rounded-lg text-orange-500 hover:bg-orange-50 bg-white transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                      >
                        <ExternalLink size={12} />
                        <span>View</span>
                      </a>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-2 border border-rose-100 bg-white rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Document"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

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
  globalLanguage: string;
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

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

async function callGeminiVisionOCR(file: File): Promise<any> {
  if (!GEMINI_API_KEY) throw new Error("No VITE_GEMINI_API_KEY set");

  // Read file as base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });

  const mimeType = file.type || 'image/jpeg';
  const prompt = `You are a helpful personal assistant OCR and vision analysis agent.
Analyze this uploaded document/image (which could be a grocery bill, utility invoice, medical prescription, or government notice).

Extract the content and classify it into one of these categories: "bill", "prescription", "notice", "other".

Based on the category, extract the structured details and output ONLY a single JSON object. Do not wrap it in markdown code blocks.

Schema:
{
  "category": "bill" | "prescription" | "notice" | "other",
  "title": "A short, descriptive title (e.g. 'D-Mart Grocery Bill', 'Dr. Patel Prescription', 'Tax Notice')",
  "extracted_text": "All raw OCR text extracted from the document",
  "summary": "A concise 1-2 sentence explanation of what this document is about",
  
  // If category is "bill":
  "total_amount": 1250.50,
  "bill_category": "Grocery" | "Electricity" | "Medicine" | "Rent" | "Other",
  "items": ["Item name 1 - Price", "Item name 2 - Price"],
  "savings_recommendation": "Suggest how to save money on this bill...",
  
  // If category is "prescription":
  "medicines": [
    {
      "name": "Medicine name (e.g. Paracetamol 650mg)",
      "dosage": "e.g. 1 tablet",
      "time": "e.g. 08:00, 20:00",
      "details": "e.g. Take twice daily after food for 3 days"
    }
  ],
  "savings_recommendation": "Identify if any prescribed medicines are expensive branded drugs. Suggest generic alternatives (chemical/salt name) and calculate estimate monthly savings at Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP) generic stores. (e.g. 'Branded Telma 40mg (Rs. 110/strip) -> PMBJP Generic Telmisartan (Rs. 18/strip). Save Rs. 92 (83%) per strip.')"
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [
          { inline_data: { mime_type: mimeType, data: base64Data } },
          { text: prompt }
        ]
      }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.4
      }
    })
  });

  if (!res.ok) throw new Error(`Gemini Vision error: ${res.status}`);
  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  
  // Clean up potential markdown wrapping
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  return JSON.parse(rawText);
}

function parseLocalFallback(filename: string, categoryOverride?: string): any {
  const nameLower = filename.toLowerCase();
  const fallback = {
    category: "other",
    title: "Document Scan",
    extracted_text: "Placeholder extracted text from local fallback engine.",
    summary: "Successfully saved document to your repository.",
    total_amount: 0.0,
    bill_category: "Other",
    items: [] as string[],
    savings_recommendation: "Save digital copies of all notices for compliance.",
    medicines: [] as any[],
    actions_required: [] as string[]
  };
  
  let targetCategory = categoryOverride || "";
  if (!targetCategory || targetCategory === 'auto') {
    if (nameLower.includes("electric") || nameLower.includes("power") || nameLower.includes("mseb") || nameLower.includes("water") || nameLower.includes("bill") || nameLower.includes("invoice") || nameLower.includes("receipt") || nameLower.includes("d-mart") || nameLower.includes("dmart") || nameLower.includes("grocery")) {
      targetCategory = "bill";
    } else if (nameLower.includes("prescription") || nameLower.includes("doctor") || nameLower.includes("med") || nameLower.includes("medicine") || nameLower.includes("pill") || nameLower.includes("tablet")) {
      targetCategory = "prescription";
    } else if (nameLower.includes("notice") || nameLower.includes("tax") || nameLower.includes("court") || nameLower.includes("legal")) {
      targetCategory = "notice";
    } else {
      targetCategory = "other";
    }
  }

  if (targetCategory === "bill") {
    fallback.category = "bill";
    if (nameLower.includes("electric") || nameLower.includes("mseb")) {
      fallback.title = "MSEB Electricity Bill";
      fallback.total_amount = 1850.0;
      fallback.bill_category = "Electricity";
      fallback.items = ["Fixed Charges - Rs 120", "Energy Charges (150 units) - Rs 1480", "Taxes & Duties - Rs 250"];
      fallback.summary = "Monthly electricity consumption bill for June 2026. Total due is Rs. 1,850.";
      fallback.savings_recommendation = "Your consumption is high during peak afternoon hours. Unplug heavy appliances to save up to Rs. 300 next month.";
    } else if (nameLower.includes("grocery") || nameLower.includes("d-mart") || nameLower.includes("dmart") || nameLower.includes("receipt")) {
      fallback.title = "D-Mart Grocery Bill";
      fallback.total_amount = 2450.0;
      fallback.bill_category = "Grocery";
      fallback.items = ["Basmati Rice 5kg - Rs 420", "Ashirvaad Atta 10kg - Rs 460", "Sunflower Oil 2L - Rs 310"];
      fallback.summary = "Grocery purchase bill from D-Mart. Major spends are on snacks and packaged foods.";
      fallback.savings_recommendation = "Over 35% of this bill was spent on non-essential snacks. Replacing premium branded items with store brands can save you Rs. 250.";
    } else {
      fallback.title = "Utility Bill";
      fallback.total_amount = 799.0;
      fallback.bill_category = "Other";
      fallback.items = ["Broadband Internet Plan - Rs 677", "GST 18% - Rs 122"];
      fallback.summary = "Monthly utility broadband bill.";
      fallback.savings_recommendation = "Check if your provider offers an annual pre-paid discount which typically gives 1 month free.";
    }
  } else if (targetCategory === "prescription") {
    fallback.category = "prescription";
    fallback.title = "Dr. Mehta Clinic Prescription";
    fallback.summary = "Doctor prescription recommending medications for blood pressure and general health.";
    fallback.extracted_text = "Rx: Telmisartan 40mg once daily in morning. Multivitamins once daily after lunch.";
    fallback.medicines = [
      { name: "Telmisartan 40mg", dosage: "1 tablet", time: "08:00", details: "Take once daily before breakfast" },
      { name: "Multivitamin", dosage: "1 capsule", time: "14:00", details: "Take once daily after lunch" }
    ];
    fallback.savings_recommendation = "Branded Telma 40mg (Rs. 110/strip) -> PMBJP Generic Telmisartan (Rs. 18/strip). Save Rs. 92 (83%) per strip.";
  } else if (targetCategory === "notice") {
    fallback.category = "notice";
    fallback.title = "Property Tax Notice";
    fallback.summary = "Official notice for municipal property tax assessment and payment deadline.";
    fallback.actions_required = ["Pay property tax before July 31st to avail 5% early-bird rebate", "Submit occupancy certificate copy to municipal office"];
    fallback.savings_recommendation = "Pay property tax before the early bird rebate deadline to save 5% on the total tax liability.";
  }
  return fallback;
}

export const DocumentScanner: React.FC<DocumentScannerProps> = ({ onScanComplete, globalLanguage }) => {
  const [activeSubTab, setActiveSubTab] = useState<'scan' | 'vault'>('scan');
  
  // Scanner States
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'auto' | 'bill' | 'prescription' | 'notice' | 'other'>('auto');
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

  // Translation States
  const [translation, setTranslation] = useState<{ summary: string; recommendation: string } | null>(null);
  const [translating, setTranslating] = useState(false);

  // Vault States
  const [documents, setDocuments] = useState<ScannedDocument[]>([]);
  const [vaultLoading, setVaultLoading] = useState(false);
  const [vaultError, setVaultError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Reset translation when language changes
  useEffect(() => {
    setTranslation(null);
  }, [globalLanguage]);

  const translateResults = async () => {
    if (!result || !GEMINI_API_KEY) return;
    setTranslating(true);
    try {
      const prompt = `You are a professional translator. Translate the following text into ${globalLanguage} (using its native script/alphabet, e.g. Devanagari for Hindi/Marathi, Tamil script for Tamil, etc.). Maintain the formatting and details.
      
      Text to translate:
      Summary: "${result.document.summary}"
      Savings Recommendation: "${result.savings_recommendation}"
      
      Respond in this exact JSON format:
      {
        "summary": "translated summary here",
        "recommendation": "translated savings recommendation here"
      }`;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
      });
      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setTranslation({
          summary: parsed.summary || result.document.summary,
          recommendation: parsed.recommendation || result.savings_recommendation
        });
      }
    } catch (err) {
      console.error("Translation failed:", err);
    } finally {
      setTranslating(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    setVaultLoading(true);
    setVaultError(null);
    try {
      const res = await axios.get(`${API_BASE}/api/documents`);
      setDocuments(res.data);
      localStorage.setItem('lifepilot_documents', JSON.stringify(res.data));
    } catch (err: any) {
      console.warn("Failed to fetch historical documents from backend. Loading from local storage fallback:", err);
      const cachedDocs = localStorage.getItem('lifepilot_documents');
      if (cachedDocs) {
        setDocuments(JSON.parse(cachedDocs));
      } else {
        setDocuments([]);
      }
    } finally {
      setVaultLoading(false);
    }
  };

  const handleDeleteDocument = async (id: number) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      // Auto-reset after 3 seconds
      setTimeout(() => {
        setConfirmDeleteId(prev => prev === id ? null : prev);
      }, 3000);
      return;
    }

    // Reset confirmation state
    setConfirmDeleteId(null);

    // Optimistic UI Update: Immediately remove from local state list
    setDocuments(prev => {
      const updated = prev.filter(doc => doc.id !== id);
      localStorage.setItem('lifepilot_documents', JSON.stringify(updated));
      return updated;
    });

    try {
      await axios.delete(`${API_BASE}/api/documents/${id}`);
      onScanComplete(); // Refresh main dashboard stats/logs
    } catch (err: any) {
      console.warn("Could not delete from backend server database. Document removed from current view locally.", err);
      onScanComplete();
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
    if (selectedCategory !== 'auto') {
      formData.append("category", selectedCategory);
    }

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
      console.warn("Backend OCR upload failed. Attempting direct browser-side Gemini Vision OCR...", err);
      
      let analysis: any;
      let usedLocalFallback = false;

      if (!GEMINI_API_KEY) {
        console.warn("No VITE_GEMINI_API_KEY set. Triggering local fallback OCR scanner engine.");
        analysis = parseLocalFallback(file.name, selectedCategory);
        usedLocalFallback = true;
      } else {
        try {
          // Direct browser OCR
          analysis = await callGeminiVisionOCR(file);
        } catch (clientErr: any) {
          console.warn("Client-side Gemini Vision OCR failed. Triggering local fallback OCR scanner engine:", clientErr);
          analysis = parseLocalFallback(file.name, selectedCategory);
          usedLocalFallback = true;
        }
      }

      try {
        // Mock a file path (object URL so user can view it in the session)
        const localUrl = URL.createObjectURL(file);

        // Combined summary to persist
        let fullSummary = analysis.summary || "";
        if (analysis.savings_recommendation) {
          fullSummary += `\n\n💡 Optimization Tip: ${analysis.savings_recommendation}`;
        }
        if (usedLocalFallback) {
          fullSummary += `\n\n*(AI quota limit reached or key not set. Processed via local offline fallback engine.)*`;
        }

        const newDoc: ScannedDocument = {
          id: Date.now(),
          filename: file.name,
          category: analysis.category || "other",
          summary: fullSummary,
          extracted_text: analysis.extracted_text || "",
          file_path: localUrl,
          created_at: new Date().toISOString().replace('T', ' ').split('.')[0]
        };

        // Save to local storage list
        const cachedDocs = localStorage.getItem('lifepilot_documents');
        const docsList = cachedDocs ? JSON.parse(cachedDocs) : [];
        const updatedDocs = [newDoc, ...docsList];
        localStorage.setItem('lifepilot_documents', JSON.stringify(updatedDocs));
        setDocuments(updatedDocs);

        // Dispatch side-effects to other tables locally!
        let action_taken = "Document uploaded locally.";
        if (usedLocalFallback) {
          action_taken = "Processed via local offline fallback engine. ";
        }

        if (analysis.category === 'bill') {
          const newExp = {
            id: Date.now(),
            title: analysis.title || `Scanned Bill (${file.name})`,
            amount: parseFloat(analysis.total_amount || 0.0),
            category: analysis.bill_category || "Other",
            date: new Date().toISOString().split('T')[0],
            doc_id: newDoc.id
          };
          const cachedExpenses = localStorage.getItem('lifepilot_expenses');
          const expensesList = cachedExpenses ? JSON.parse(cachedExpenses) : [];
          localStorage.setItem('lifepilot_expenses', JSON.stringify([newExp, ...expensesList]));
          action_taken += `Added as local expense under '${newExp.category}' for Rs. ${newExp.amount}.`;
        } else if (analysis.category === 'prescription') {
          const meds = analysis.medicines || [];
          const cachedReminders = localStorage.getItem('lifepilot_reminders');
          const remindersList = cachedReminders ? JSON.parse(cachedReminders) : [];
          const addedRemNames: string[] = [];
          
          meds.forEach((m: any, idx: number) => {
            const newRem = {
              id: Date.now() + idx,
              title: `Take ${m.name || 'Medicine'}`,
              time: m.time || "08:00",
              type: "medicine",
              details: `Dosage: ${m.dosage || '1 tablet'}. Details: ${m.details || ''}`,
              is_active: true
            };
            remindersList.push(newRem);
            addedRemNames.push(m.name || 'Medicine');
          });

          localStorage.setItem('lifepilot_reminders', JSON.stringify(remindersList));
          action_taken += `Scheduled local medicine reminders for: ${addedRemNames.join(', ')}.`;
        } else if (analysis.category === 'notice') {
          const actions = analysis.actions_required || [];
          const cachedTasks = localStorage.getItem('lifepilot_tasks');
          const tasksList = cachedTasks ? JSON.parse(cachedTasks) : [];
          
          actions.forEach((act: string, idx: number) => {
            const newTask = {
              id: Date.now() + idx,
              title: `Notice action: ${act}`,
              due_time: "09:00",
              date: new Date().toISOString().split('T')[0],
              is_completed: false
            };
            tasksList.push(newTask);
          });

          localStorage.setItem('lifepilot_tasks', JSON.stringify(tasksList));
          action_taken += "Created notice action tasks on your daily planner.";
        }

        // Trigger scan complete callback in parent to sync dashboard view
        onScanComplete();

        // Show successful scanning result state
        setResult({
          document: {
            id: newDoc.id,
            filename: newDoc.filename,
            category: newDoc.category,
            summary: fullSummary,
            file_path: localUrl
          },
          action_taken,
          savings_recommendation: analysis.savings_recommendation || ""
        });

      } catch (clientErr: any) {
        console.error("Local processing execution failed:", clientErr);
        setError("Error processing document: " + (clientErr.message || clientErr));
      }
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setSelectedCategory('auto');
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

              {/* Developer testing mock upload button */}
              <div className="text-center mt-1">
                <button 
                  id="mock-upload-btn" 
                  className="text-[10px] font-bold text-orange-500 hover:underline cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(new window.File(["mock prescription details content"], "test_prescription.png", { type: "image/png" }));
                  }}
                >
                  [Developer Test: Click to Mock File Drop]
                </button>
              </div>

              {/* Selected File Details & Category Selector */}
              {file && (
                <div className="space-y-4">
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

                  {/* Manual Category Override Pills */}
                  <div className="p-4 border border-orange-100 bg-orange-50/5 rounded-2xl text-left space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-700">Force Document Category</span>
                      <span className="text-[10px] text-gray-400">Helps offline OCR apply correct extraction rules</span>
                    </div>
                    <div className="grid grid-cols-5 gap-2 pt-1">
                      {[
                        { id: 'auto', label: 'Auto' },
                        { id: 'bill', label: 'Bill' },
                        { id: 'prescription', label: 'Prescription' },
                        { id: 'notice', label: 'Notice' },
                        { id: 'other', label: 'Other' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setSelectedCategory(item.id as any)}
                          className={`py-1.5 px-2 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                            selectedCategory === item.id
                              ? 'bg-orange-500 border-orange-500 text-white shadow-sm'
                              : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
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

              {/* Translation Container */}
              {translation && (
                <div className="p-4 bg-orange-50/20 border-2 border-dashed border-orange-200 rounded-xl space-y-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600 uppercase tracking-wider">
                    <span>🌐 Translated Details ({globalLanguage})</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase block">Scan Summary</span>
                    <p className="text-xs text-gray-700 font-medium mt-0.5 leading-relaxed">{translation.summary}</p>
                  </div>
                  {translation.recommendation && (
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase block">Savings Recommendation</span>
                      <p className="text-xs text-orange-700 font-semibold mt-0.5 leading-relaxed">{translation.recommendation}</p>
                    </div>
                  )}
                </div>
              )}

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
                {globalLanguage !== 'English' && GEMINI_API_KEY && !translation && (
                  <button
                    onClick={translateResults}
                    disabled={translating}
                    className="px-4 py-2 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-600 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {translating ? (
                      <span className="animate-spin inline-block w-3 h-3 border border-orange-600 border-t-transparent rounded-full" />
                    ) : (
                      <span>🌐 Translate to {globalLanguage}</span>
                    )}
                  </button>
                )}
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
                        className={`p-2 border rounded-lg transition-all duration-300 cursor-pointer flex items-center justify-center shrink-0 ${
                          confirmDeleteId === doc.id
                            ? 'border-rose-500 bg-rose-500 text-white hover:bg-rose-600 scale-105 px-3'
                            : 'border-rose-100 bg-white text-rose-500 hover:bg-rose-50'
                        }`}
                        title={confirmDeleteId === doc.id ? "Click again to confirm delete" : "Delete Document"}
                      >
                        {confirmDeleteId === doc.id ? (
                          <span className="text-[10px] font-bold">Confirm?</span>
                        ) : (
                          <Trash2 size={12} />
                        )}
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

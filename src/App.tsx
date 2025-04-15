import React, { useState, useEffect } from 'react';
import { createWorker } from 'tesseract.js';
import { ImageUploader } from './components/ImageUploader';
import { CameraCapture } from './components/CameraCapture';
import { ResultsDisplay } from './components/ResultsDisplay';
import { DocumentList } from './components/DocumentList';
import { DocumentEditor } from './components/DocumentEditor';
import { VersionHistory } from './components/VersionHistory';
import { Camera, Image as ImageIcon, Loader, Plus, FileText, Info, HelpCircle } from 'lucide-react';
import { supabase } from './lib/supabase';
import type { OCRResult, Document, DocumentVersion, DocumentListParams } from './types';
import { processMathWithMathpix } from './lib/mathpix';

function App() {
  const [activeTab, setActiveTab] = useState<'upload' | 'camera'>('upload');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<'scan' | 'documents' | 'about' | 'support'>('scan');
  
  // Document management state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listParams, setListParams] = useState<DocumentListParams>({
    page: 1,
    perPage: 10,
    sortBy: 'updated_at',
    sortOrder: 'desc',
  });
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (currentPage === 'documents') {
      fetchDocuments();
    }
  }, [listParams, currentPage]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('documents')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order(listParams.sortBy || 'updated_at', { ascending: listParams.sortOrder === 'asc' })
        .range(
          (listParams.page - 1) * listParams.perPage,
          listParams.page * listParams.perPage - 1
        );

      if (listParams.search) {
        query = query.or(`title.ilike.%${listParams.search}%,content.ilike.%${listParams.search}%`);
      }

      const { data, count } = await query;

      if (data) {
        setDocuments(data);
        setTotalPages(Math.ceil((count || 0) / listParams.perPage));
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const processImage = async (imageData: string | File) => {
    setProcessing(true);
    try {
      const worker = await createWorker('eng');
      
      const imageUrl = typeof imageData === 'string' 
        ? imageData 
        : URL.createObjectURL(imageData);
      
      setPreviewUrl(imageUrl);

      // Process with Tesseract
      const { data } = await worker.recognize(imageUrl);
      
      // Try to process with Mathpix if available
      let mathpixResult = null;
      try {
        mathpixResult = await processMathWithMathpix(typeof imageData === 'string' ? imageData : await imageData.text());
      } catch (error) {
        console.error('Mathpix processing failed:', error);
      }

      const ocrResult: OCRResult = {
        text: data.text,
        confidence: data.confidence / 100,
        language: data.language,
        latex: mathpixResult?.latex_styled,
      };

      setResult(ocrResult);
      await worker.terminate();
    } catch (error) {
      console.error('OCR processing failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveScannedText = async () => {
    if (!result) return;

    setSaving(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        throw new Error('Authentication error: ' + authError.message);
      }
      
      if (!authData?.user?.id) {
        alert('Please log in to save documents.');
        return;
      }

      const newDocument = {
        title: `Scanned Document ${new Date().toLocaleString()}`,
        content: result.text,
        metadata: {
          source: 'OCR',
          confidence: result.confidence,
          language: result.language,
          latex: result.latex,
        },
        user_id: authData.user.id,
      };

      const { data: doc, error } = await supabase
        .from('documents')
        .insert(newDocument)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (doc) {
        setResult(null);
        setPreviewUrl(null);
        setCurrentPage('documents');
        await fetchDocuments();
      }
    } catch (error) {
      console.error('Error saving document:', error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('Failed to save document. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDocument = async (content: string) => {
    if (!selectedDocument) return;

    setSaving(true);
    try {
      await supabase.from('document_versions').insert({
        document_id: selectedDocument.id,
        content: selectedDocument.content,
        metadata: selectedDocument.metadata,
        user_id: selectedDocument.user_id,
      });

      const { data } = await supabase
        .from('documents')
        .update({ content })
        .eq('id', selectedDocument.id)
        .select()
        .single();

      if (data) {
        setSelectedDocument(data);
        await fetchDocuments();
      }
    } catch (error) {
      console.error('Error saving document:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDocument = async (doc: Document) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await supabase
        .from('documents')
        .delete()
        .eq('id', doc.id);

      await fetchDocuments();
      if (selectedDocument?.id === doc.id) {
        setSelectedDocument(null);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const handleViewHistory = async (doc: Document) => {
    try {
      const { data } = await supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', doc.id)
        .order('created_at', { ascending: false });

      if (data) {
        setVersions(data);
        setShowVersions(true);
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
    }
  };

  const handleRestoreVersion = async (version: DocumentVersion) => {
    try {
      const { data } = await supabase
        .from('documents')
        .update({ content: version.content })
        .eq('id', version.document_id)
        .select()
        .single();

      if (data) {
        setSelectedDocument(data);
        setShowVersions(false);
        await fetchDocuments();
      }
    } catch (error) {
      console.error('Error restoring version:', error);
    }
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'documents':
        return (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Your Documents</h2>
            <DocumentList
              documents={documents}
              loading={loading}
              onEdit={setSelectedDocument}
              onDelete={handleDeleteDocument}
              onViewHistory={handleViewHistory}
              listParams={listParams}
              onParamsChange={(params) => setListParams({ ...listParams, ...params })}
              totalPages={totalPages}
            />
          </div>
        );
      case 'about':
        return (
          <div className="mt-8 bg-white p-8 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">About</h2>
            <p className="text-gray-700">
              Our OCR Document Management System helps you digitize and manage your physical documents
              with ease. Using advanced optical character recognition technology, we convert your
              printed or handwritten text into editable digital format.
            </p>
          </div>
        );
      case 'support':
        return (
          <div className="mt-8 bg-white p-8 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">Support</h2>
            <p className="text-gray-700">
              Need help? Contact our support team at support@example.com or visit our documentation
              for detailed guides on using the system.
            </p>
          </div>
        );
      default:
        return (
          <>
            <div className="bg-white rounded-lg shadow-sm mb-6">
              <div className="flex border-b">
                <button
                  className={`flex-1 px-4 py-3 text-center ${
                    activeTab === 'upload'
                      ? 'border-b-2 border-blue-500 text-blue-500'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('upload')}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <ImageIcon className="w-5 h-5" />
                    <span>Upload Image</span>
                  </div>
                </button>
                <button
                  className={`flex-1 px-4 py-3 text-center ${
                    activeTab === 'camera'
                      ? 'border-b-2 border-blue-500 text-blue-500'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('camera')}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Camera className="w-5 h-5" />
                    <span>Use Camera</span>
                  </div>
                </button>
              </div>

              <div className="p-6">
                {activeTab === 'upload' ? (
                  <ImageUploader onImageSelect={(file) => processImage(file)} />
                ) : (
                  <CameraCapture onCapture={(imageData) => processImage(imageData)} />
                )}
              </div>
            </div>

            {(processing || result) && (
              <div className="space-y-6">
                {previewUrl && (
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Preview</h3>
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-full rounded-lg"
                    />
                  </div>
                )}

                {processing && (
                  <div className="flex items-center justify-center p-12">
                    <Loader className="w-8 h-8 animate-spin text-blue-500" />
                    <span className="ml-3 text-gray-600">Processing image...</span>
                  </div>
                )}

                {result && !processing && (
                  <div className="space-y-6">
                    <ResultsDisplay result={result} onExport={() => {}} />
                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveScannedText}
                        disabled={saving}
                        className="flex items-center space-x-2 px-6 py-2 bg-blue-500 text-white rounded-lg
                                 hover:bg-blue-600 transition-colors disabled:opacity-50"
                      >
                        {saving ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <FileText className="w-5 h-5" />
                            <span>Save Document</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex">
              <button
                onClick={() => {
                  setCurrentPage('scan');
                  setSelectedDocument(null);
                }}
                className={`inline-flex items-center px-4 border-b-2 text-sm font-medium ${
                  currentPage === 'scan'
                    ? 'border-blue-500 text-blue-500'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Camera className="w-5 h-5 mr-2" />
                Scan
              </button>
              <button
                onClick={() => {
                  setCurrentPage('documents');
                  setSelectedDocument(null);
                }}
                className={`inline-flex items-center px-4 border-b-2 text-sm font-medium ${
                  currentPage === 'documents'
                    ? 'border-blue-500 text-blue-500'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="w-5 h-5 mr-2" />
                Documents
              </button>
              <button
                onClick={() => {
                  setCurrentPage('about');
                  setSelectedDocument(null);
                }}
                className={`inline-flex items-center px-4 border-b-2 text-sm font-medium ${
                  currentPage === 'about'
                    ? 'border-blue-500 text-blue-500'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Info className="w-5 h-5 mr-2" />
                About
              </button>
              <button
                onClick={() => {
                  setCurrentPage('support');
                  setSelectedDocument(null);
                }}
                className={`inline-flex items-center px-4 border-b-2 text-sm font-medium ${
                  currentPage === 'support'
                    ? 'border-blue-500 text-blue-500'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <HelpCircle className="w-5 h-5 mr-2" />
                Support
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        {selectedDocument ? (
          <div className="space-y-6">
            <DocumentEditor
              document={selectedDocument}
              onSave={handleSaveDocument}
              saving={saving}
            />
            {showVersions && (
              <VersionHistory
                versions={versions}
                onRestore={handleRestoreVersion}
                loading={loading}
              />
            )}
          </div>
        ) : (
          renderContent()
        )}
      </div>
    </div>
  );
}

export default App;
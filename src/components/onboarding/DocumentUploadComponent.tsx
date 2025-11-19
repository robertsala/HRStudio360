import { useState } from 'react';
import { Upload, FileText, CheckCircle, X, AlertCircle, Clock, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { Storage } from '@google-cloud/storage';

interface DocumentUploadComponentProps {
  newHireId: string;
  onComplete?: () => void;
}

const DOCUMENT_TYPES = {
  LIST_A: [
    'U.S. Passport or U.S. Passport Card',
    'Permanent Resident Card (Green Card)',
    'Foreign Passport with I-551 stamp',
    'Employment Authorization Document (EAD)',
    'Foreign Passport with Form I-94'
  ],
  LIST_B: [
    'Driver\'s License or State ID',
    'School ID with photo',
    'Voter Registration Card',
    'U.S. Military Card',
    'U.S. Coast Guard Merchant Mariner Card'
  ],
  LIST_C: [
    'Social Security Card',
    'Birth Certificate',
    'Native American tribal document',
    'U.S. Citizen ID Card',
    'Employment authorization from DHS'
  ],
  OTHER: [
    'Background Check',
    'Professional Certification',
    'Educational Transcript',
    'Medical Clearance',
    'Other Documentation'
  ]
};

type DocumentList = 'LIST_A' | 'LIST_B' | 'LIST_C' | 'OTHER';

interface UploadedDocument {
  id: string;
  documentType: string;
  documentList: DocumentList;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  status: 'Pending Review' | 'Approved' | 'Rejected';
  reviewNotes?: string;
}

export default function DocumentUploadComponent({ newHireId, onComplete }: DocumentUploadComponentProps) {
  const { toast } = useToast();
  const [selectedList, setSelectedList] = useState<DocumentList>('LIST_A');
  const [selectedDocType, setSelectedDocType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch existing documents
  const { data: documents = [], isLoading, refetch } = useQuery<UploadedDocument[]>({
    queryKey: ['/api/onboarding/documents', newHireId],
    queryFn: async () => {
      const response = await fetch(`/api/onboarding/documents/new-hire/${newHireId}`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    }
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedDocType) {
      toast({
        title: 'Document Type Required',
        description: 'Please select a document type before uploading.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Maximum file size is 10MB.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a PDF, JPG, or PNG file.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // For demo purposes, we'll create a mock upload
      // In production, you would upload to your object storage service
      const mockProgressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(mockProgressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      clearInterval(mockProgressInterval);
      setUploadProgress(100);

      // Create document record in database
      const documentData = {
        newHireId,
        documentType: selectedDocType,
        documentList: selectedList,
        fileName: file.name,
        fileUrl: `/uploads/documents/${newHireId}/${Date.now()}-${file.name}`, // Mock URL
        status: 'Pending Review'
      };

      await apiRequest('POST', '/api/onboarding/documents', documentData);

      toast({
        title: 'Upload Successful',
        description: `${selectedDocType} uploaded and pending HR review.`,
      });

      // Reset form
      setSelectedDocType('');
      e.target.value = '';
      refetch();
      
    } catch (error: any) {
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'Rejected':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
      default:
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'Rejected':
        return <X className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6">
        <div className="flex items-center space-x-3">
          <Upload className="h-8 w-8" />
          <div>
            <h2 className="text-2xl font-bold">Document Upload & Verification</h2>
            <p className="text-emerald-100 text-sm">Upload required identification and employment documents</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* I-9 Document Requirements Guide */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-semibold mb-2">I-9 Document Requirements:</p>
              <ul className="space-y-1 ml-4">
                <li>• <strong>List A:</strong> Documents that prove both identity AND employment authorization (choose ONE)</li>
                <li>• <strong>List B + List C:</strong> If not providing List A, upload ONE from List B (identity) AND ONE from List C (employment authorization)</li>
                <li>• <strong>Other:</strong> Additional documents required by your employer</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">Upload New Document</h3>
          
          {/* Document List Selection */}
          <div className="flex space-x-2">
            {(['LIST_A', 'LIST_B', 'LIST_C', 'OTHER'] as DocumentList[]).map(list => (
              <button
                key={list}
                type="button"
                onClick={() => {
                  setSelectedList(list);
                  setSelectedDocType('');
                }}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  selectedList === list
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
                data-testid={`button-select-${list}`}
              >
                {list.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Document Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Document Type <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              data-testid="select-document-type"
            >
              <option value="">Choose a document type...</option>
              {DOCUMENT_TYPES[selectedList].map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Upload File (PDF, JPG, PNG - Max 10MB)
            </label>
            <div className="flex items-center space-x-3">
              <label className="flex-1 cursor-pointer">
                <div className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-emerald-500 dark:hover:border-emerald-400 transition-colors">
                  <div className="text-center">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Click to browse or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      PDF, JPG, PNG up to 10MB
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    disabled={uploading || !selectedDocType}
                    className="hidden"
                    data-testid="input-file-upload"
                  />
                </div>
              </label>
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Uploading...</span>
                  <span className="font-medium text-emerald-600">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Uploaded Documents List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">Uploaded Documents</h3>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent mx-auto"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400">No documents uploaded yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Upload your first document to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  data-testid={`document-${doc.id}`}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <FileText className="h-8 w-8 text-emerald-600" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {doc.documentType}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {doc.fileName}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {doc.documentList} • Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border text-xs font-medium ${getStatusColor(doc.status)}`}>
                      {getStatusIcon(doc.status)}
                      <span>{doc.status}</span>
                    </div>
                    
                    {doc.reviewNotes && (
                      <div className="group relative">
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
                        <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                          <p className="font-semibold mb-1">Review Notes:</p>
                          <p>{doc.reviewNotes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completion Info */}
        {documents.length > 0 && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
            <p className="text-sm text-emerald-900 dark:text-emerald-100">
              <strong>Document Review:</strong> Your uploaded documents will be reviewed by HR within 1-2 business days. You'll receive a notification once they are approved or if additional documents are needed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { X, Briefcase } from 'lucide-react';
import JobPostingsPanel from '../JobPostingsPanel';

interface JobManagementModalProps {
  onClose: () => void;
  onOpenStudioAI?: () => void;
}

export default function JobManagementModal({ onClose, onOpenStudioAI }: JobManagementModalProps) {
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const handleNotification = (notif: {type: 'success' | 'error', message: string}) => {
    setNotification(notif);
    setTimeout(() => setNotification(null), notif.type === 'success' ? 3000 : 5000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-900 dark:to-indigo-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Briefcase className="h-6 w-6" />
            <h2 className="text-2xl font-bold">Job Postings Management</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            data-testid="button-close-modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`px-6 py-3 ${notification.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'}`}>
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <JobPostingsPanel 
            onOpenStudioAI={onOpenStudioAI}
            onNotification={handleNotification}
          />
        </div>
      </div>
    </div>
  );
}

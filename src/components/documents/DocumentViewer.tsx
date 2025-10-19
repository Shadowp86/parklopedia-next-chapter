import { X, Download, FileText } from 'lucide-react';
import { Modal, Button } from '../ui';

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: string;
    vehicle_id: string | null;
    user_id: string;
    document_type: string;
    document_number?: string;
    file_url: string;
    issue_date?: string;
    expiry_date?: string;
    status: string;
    metadata?: any;
    created_at: string;
    updated_at: string;
  } | null;
}

const DocumentViewer = ({ isOpen, onClose, document }: DocumentViewerProps) => {
  if (!document) return null;

  const handleDownload = () => {
    const link = window.document.createElement('a');
    link.href = document.file_url;
    link.download = document.metadata?.file_name || 'document';
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDocumentTypeLabel = (type: string): string => {
    const types: Record<string, string> = {
      rc: 'Registration Certificate',
      insurance: 'Insurance Policy',
      puc: 'PUC Certificate',
      license: "Driver's License",
      permit: 'Permit',
      fitness: 'Fitness Certificate',
      tax: 'Road Tax Receipt',
      other: 'Other Document',
    };
    return types[type] || type;
  };

  const renderDocumentContent = () => {
    if (document.metadata?.file_type?.startsWith('image/')) {
      return (
        <div className="flex justify-center">
          <img
            src={document.file_url}
            alt={document.metadata?.file_name || 'Document'}
            className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
          />
        </div>
      );
    } else if (document.metadata?.file_type === 'application/pdf') {
      return (
        <div className="flex justify-center">
          <iframe
            src={document.file_url}
            className="w-full h-[70vh] border rounded-lg"
            title={document.metadata?.file_name || 'Document'}
          />
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-dark-elevated rounded-full flex items-center justify-center mb-4">
            <FileText size={40} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Preview Not Available
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            This file type cannot be previewed in the browser.
          </p>
          <Button onClick={handleDownload} variant="outline">
            <Download size={16} className="mr-2" />
            Download to View
          </Button>
        </div>
      );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Document Viewer" size="lg">
      <div className="space-y-4">
        {/* Document Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {getDocumentTypeLabel(document.document_type)}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {document.metadata?.file_name || 'Document'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="ml-4"
          >
            <Download size={16} className="mr-1" />
            Download
          </Button>
        </div>

        {/* Document Metadata */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-dark-elevated rounded-lg">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              File Size
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {formatFileSize(document.metadata?.file_size || 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Uploaded
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {formatDate(document.created_at)}
            </p>
          </div>
          {document.expiry_date && (
            <>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Expires
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {new Date(document.expiry_date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Status
                </p>
                <p className={`text-sm font-medium ${
                  new Date(document.expiry_date) < new Date()
                    ? 'text-red-600'
                    : new Date(document.expiry_date).getTime() - new Date().getTime() <= 30 * 24 * 60 * 60 * 1000
                    ? 'text-yellow-600'
                    : 'text-green-600'
                }`}>
                  {new Date(document.expiry_date) < new Date()
                    ? 'Expired'
                    : new Date(document.expiry_date).getTime() - new Date().getTime() <= 30 * 24 * 60 * 60 * 1000
                    ? 'Expiring Soon'
                    : 'Valid'
                  }
                </p>
              </div>
            </>
          )}
        </div>

        {/* Document Content */}
        <div className="border rounded-lg overflow-hidden">
          {renderDocumentContent()}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DocumentViewer;

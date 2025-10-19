import { useState } from 'react';
import { FileText, Calendar, AlertTriangle, Eye, Download, Trash2, CheckCircle } from 'lucide-react';
import { Card, Button } from '../ui';
import { motion } from 'framer-motion';

interface DocumentCardProps {
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
  };
  onDelete?: (id: string) => void;
  onView?: (document: any) => void;
}

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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'valid':
      return 'text-green-600 bg-green-100 dark:bg-green-900/20';
    case 'expiring_soon':
      return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
    case 'expired':
      return 'text-red-600 bg-red-100 dark:bg-red-900/20';
    default:
      return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'valid':
      return <CheckCircle size={16} className="text-green-600" />;
    case 'expiring_soon':
      return <AlertTriangle size={16} className="text-yellow-600" />;
    case 'expired':
      return <AlertTriangle size={16} className="text-red-600" />;
    default:
      return <FileText size={16} className="text-gray-600" />;
  }
};

const DocumentCard = ({ document, onDelete, onView }: DocumentCardProps) => {
  const [imageError, setImageError] = useState(false);

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
    });
  };

  const isExpiringSoon = () => {
    if (!document.expiry_date) return false;
    const expiryDate = new Date(document.expiry_date);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = () => {
    if (!document.expiry_date) return false;
    return new Date(document.expiry_date) < new Date();
  };

  const getStatus = () => {
    if (isExpired()) return 'expired';
    if (isExpiringSoon()) return 'expiring_soon';
    return 'valid';
  };

  const status = getStatus();

  const handleDownload = () => {
    const link = window.document.createElement('a');
    link.href = document.file_url;
    link.download = document.metadata?.file_name || 'document';
    link.target = '_blank';
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const handleDelete = () => {
    if (onDelete && confirm('Are you sure you want to delete this document?')) {
      onDelete(document.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4">
          {/* Document Preview */}
          <div className="flex-shrink-0">
            {document.metadata?.file_type?.startsWith('image/') && !imageError ? (
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-dark-elevated">
                <img
                  src={document.file_url}
                  alt={document.metadata?.file_name || 'Document'}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-lg bg-accent-blue/10 flex items-center justify-center">
                <FileText size={24} className="text-accent-blue" />
              </div>
            )}
          </div>

          {/* Document Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {getDocumentTypeLabel(document.document_type)}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {document.metadata?.file_name || 'Document'}
                </p>
              </div>

              {/* Status Badge */}
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                {getStatusIcon(status)}
                <span className="capitalize">
                  {status === 'expiring_soon' ? 'Expiring Soon' : status}
                </span>
              </div>
            </div>

            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{formatFileSize(document.metadata?.file_size || 0)}</span>
                <span>•</span>
                <span>Uploaded {formatDate(document.created_at)}</span>
              </div>

              {document.expiry_date && (
                <div className="flex items-center gap-2 text-xs">
                  <Calendar size={12} className="text-gray-400" />
                  <span className="text-gray-500 dark:text-gray-400">
                    Expires: {formatDate(document.expiry_date)}
                  </span>
                  {status === 'expiring_soon' && (
                    <span className="text-yellow-600 font-medium">
                      ({Math.ceil((new Date(document.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left)
                    </span>
                  )}
                  {status === 'expired' && (
                    <span className="text-red-600 font-medium">
                      (Expired)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView?.(document)}
            className="flex-1"
          >
            <Eye size={14} className="mr-1" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex-1"
          >
            <Download size={14} className="mr-1" />
            Download
          </Button>
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default DocumentCard;

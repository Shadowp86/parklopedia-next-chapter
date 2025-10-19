import { useState, useRef } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Modal, Button } from '../ui';
import { useToast } from '../ui';
import { useAuth } from '../../contexts/AuthContext';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId?: string;
  onSuccess?: () => void;
}

interface DocumentType {
  id: string;
  label: string;
  description: string;
  required: boolean;
}

const documentTypes: DocumentType[] = [
  { id: 'rc', label: 'Registration Certificate (RC)', description: 'Vehicle registration document', required: true },
  { id: 'insurance', label: 'Insurance Policy', description: 'Vehicle insurance certificate', required: true },
  { id: 'puc', label: 'PUC Certificate', description: 'Pollution Under Control certificate', required: true },
  { id: 'license', label: "Driver's License", description: 'Valid driving license', required: false },
  { id: 'permit', label: 'Permit', description: 'Vehicle permit (if applicable)', required: false },
  { id: 'fitness', label: 'Fitness Certificate', description: 'Vehicle fitness certificate', required: false },
  { id: 'tax', label: 'Road Tax Receipt', description: 'Road tax payment receipt', required: false },
  { id: 'other', label: 'Other Document', description: 'Any other vehicle-related document', required: false },
];

const DocumentUploadModal = ({ isOpen, onClose, vehicleId, onSuccess }: DocumentUploadModalProps) => {
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const { user } = useAuth();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      showToast('error', 'Please select a valid file type (JPEG, PNG, PDF)');
      return;
    }

    if (file.size > maxSize) {
      showToast('error', 'File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedType || !selectedFile) {
      showToast('error', 'Please select document type and file');
      return;
    }

    setUploading(true);

    try {
      // Import api here to avoid circular dependency
      const { api } = await import('../../lib/api');

      // Get current user from auth context
      const userId = user?.id;
      if (!userId) {
        showToast('error', 'User not authenticated');
        return;
      }

      const documentData = {
        user_id: userId,
        vehicle_id: vehicleId || null,
        document_type: selectedType,
        expiry_date: expiryDate || null,
      };

      await api.documents.uploadDocument(documentData, selectedFile);

      showToast('success', 'Document uploaded successfully!');
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Upload error:', error);
      showToast('error', 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedType('');
    setSelectedFile(null);
    setExpiryDate('');
    setUploading(false);
    setDragActive(false);
    onClose();
  };

  const selectedTypeInfo = documentTypes.find(type => type.id === selectedType);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Upload Document">
      <div className="space-y-6">
        {/* Document Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Document Type *
          </label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-elevated text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-blue"
          >
            <option value="">Select document type</option>
            {documentTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label} {type.required && '*'}
              </option>
            ))}
          </select>
          {selectedTypeInfo && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {selectedTypeInfo.description}
            </p>
          )}
        </div>

        {/* File Upload Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Document File *
          </label>
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? 'border-accent-blue bg-accent-blue/5'
                : selectedFile
                ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-accent-blue'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            {selectedFile ? (
              <div className="flex flex-col items-center">
                <CheckCircle size={48} className="text-green-500 mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change File
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload size={48} className="text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Drop your document here, or click to browse
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Supports JPEG, PNG, PDF (max 10MB)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Expiry Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Expiry Date
          </label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-elevated text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-blue"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Leave empty if document doesn't expire
          </p>
        </div>

        {/* Upload Button */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            className="flex-1"
            disabled={!selectedType || !selectedFile || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DocumentUploadModal;

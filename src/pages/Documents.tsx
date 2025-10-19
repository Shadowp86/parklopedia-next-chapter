import { useState, useEffect } from 'react';
import { Card, Loader } from '../components/ui';
import { Plus, FileText, Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui';
import { api } from '../lib/api';
import { useDocumentsRealtime } from '../hooks/useRealtime';
import DocumentUploadModal from '../components/documents/DocumentUploadModal';
import DocumentCard from '../components/documents/DocumentCard';
import DocumentViewer from '../components/documents/DocumentViewer';

interface Document {
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
}

const Documents = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchQuery, statusFilter, typeFilter]);

  const fetchDocuments = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const docs = await api.documents.getDocuments(user.id);
      setDocuments(docs);
    } catch (error) {
      console.error('Error fetching documents:', error);
      showToast('error', 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = documents;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(doc =>
        (doc.metadata?.file_name?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
        getDocumentTypeLabel(doc.document_type).toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(doc => doc.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(doc => doc.document_type === typeFilter);
    }

    setFilteredDocuments(filtered);
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

  const handleDelete = async (id: string) => {
    if (!user?.id) return;

    try {
      await api.documents.deleteDocument(id);
      setDocuments(documents.filter(doc => doc.id !== id));
      showToast('success', 'Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      showToast('error', 'Failed to delete document');
    }
  };

  const handleUploadSuccess = () => {
    fetchDocuments();
  };

  const getStats = () => {
    const total = documents.length;
    const expiringSoon = documents.filter(doc => doc.status === 'expiring_soon').length;
    const expired = documents.filter(doc => doc.status === 'expired').length;
    const valid = documents.filter(doc => doc.status === 'valid').length;

    return { total, expiringSoon, expired, valid };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader size="lg" text="Loading documents..." />
      </div>
    );
  }

  return (
    <div className="px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100">
          Documents
        </h1>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 bg-accent-blue text-white rounded-xl font-medium shadow-md flex items-center gap-2 hover:bg-accent-blue-dark transition-colors"
        >
          <Plus size={20} />
          Upload Document
        </motion.button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stats.total}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Total Documents
            </p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {stats.valid}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Valid
            </p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {stats.expiringSoon}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Expiring Soon
            </p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {stats.expired}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Expired
            </p>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-elevated text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-blue"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-elevated text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-blue"
          >
            <option value="all">All Status</option>
            <option value="valid">Valid</option>
            <option value="expiring_soon">Expiring Soon</option>
            <option value="expired">Expired</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-elevated text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-blue"
          >
            <option value="all">All Types</option>
            <option value="rc">RC</option>
            <option value="insurance">Insurance</option>
            <option value="puc">PUC</option>
            <option value="license">License</option>
            <option value="permit">Permit</option>
            <option value="fitness">Fitness</option>
            <option value="tax">Tax Receipt</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600">
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-dark-elevated rounded-full flex items-center justify-center">
                <FileText size={40} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {documents.length === 0 ? 'No Documents Uploaded' : 'No Documents Found'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {documents.length === 0
                  ? 'Upload your first vehicle document to get started'
                  : 'Try adjusting your search or filters'
                }
              </p>
              {documents.length === 0 && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="px-6 py-3 bg-accent-blue text-white rounded-xl font-medium shadow-md hover:bg-accent-blue-dark transition-colors"
                >
                  Upload Your First Document
                </button>
              )}
            </div>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filteredDocuments.map((document, index) => (
            <motion.div
              key={document.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <DocumentCard
                document={document}
                onDelete={handleDelete}
                onView={setViewingDocument}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Modals */}
      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        vehicleId={selectedVehicleId}
        onSuccess={handleUploadSuccess}
      />

      <DocumentViewer
        isOpen={!!viewingDocument}
        onClose={() => setViewingDocument(null)}
        document={viewingDocument}
      />
    </div>
  );
};

export default Documents;

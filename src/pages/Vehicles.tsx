import { useState, useEffect } from 'react';
import { Card, Loader } from '../components/ui';
import { Plus, Car } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { useToast } from '../components/ui';
import AddVehicleModal from '../components/vehicles/AddVehicleModal';
import VehicleCard from '../components/vehicles/VehicleCard';

interface Vehicle {
  id: string;
  registration_number: string;
  brand: string;
  model: string;
  variant?: string;
  year: number;
  vehicle_type: string;
  fuel_type?: string;
  color?: string;
  image_url?: string;
}

const Vehicles = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchVehicles();
    }
  }, [user]);

  const fetchVehicles = async () => {
    try {
      if (!user?.id) return;

      const data = await api.vehicles.getVehicles(user.id);
      setVehicles(data || []);
    } catch (error: any) {
      console.error('Error fetching vehicles:', error);
      showToast('error', error.message || 'Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;

    try {
      await api.vehicles.deleteVehicle(id);
      showToast('success', 'Vehicle deleted successfully');
      fetchVehicles();
    } catch (error: any) {
      showToast('error', error.message || 'Failed to delete vehicle');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader size="lg" text="Loading vehicles..." />
      </div>
    );
  }

  return (
    <div className="px-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100">
          My Garage
        </h1>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-accent-blue text-white rounded-xl font-medium shadow-md flex items-center gap-2 hover:bg-accent-blue-dark transition-colors"
        >
          <Plus size={20} />
          Add Vehicle
        </motion.button>
      </div>

      {vehicles.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card variant="outline" className="border-2 border-dashed border-gray-300 dark:border-gray-600">
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-dark-elevated rounded-full flex items-center justify-center">
                <Car size={40} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No Vehicles Added
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Add your first vehicle to start managing documents and services
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-accent-blue text-white rounded-xl font-medium shadow-md hover:bg-accent-blue-dark transition-colors"
              >
                Add Your First Vehicle
              </button>
            </div>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {vehicles.map((vehicle, index) => (
            <motion.div
              key={vehicle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <VehicleCard
                vehicle={vehicle}
                onDelete={handleDelete}
              />
            </motion.div>
          ))}
        </div>
      )}

      <AddVehicleModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchVehicles}
      />
    </div>
  );
};

export default Vehicles;

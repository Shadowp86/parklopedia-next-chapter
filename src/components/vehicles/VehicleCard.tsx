import { motion } from 'framer-motion';
import { Car, MoreVertical, Edit, Trash2, FileText } from 'lucide-react';
import { Card } from '../ui';
import { useState } from 'react';

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

interface VehicleCardProps {
  vehicle: Vehicle;
  onEdit?: (vehicle: Vehicle) => void;
  onDelete?: (id: string) => void;
  onViewDocuments?: (vehicle: Vehicle) => void;
}

const VehicleCard = ({ vehicle, onEdit, onDelete, onViewDocuments }: VehicleCardProps) => {
  const [showMenu, setShowMenu] = useState(false);

  const getVehicleIcon = (_type: string) => {
    return Car;
  };

  const Icon = getVehicleIcon(vehicle.vehicle_type);

  const getGradient = (type: string) => {
    const gradients: Record<string, string> = {
      car: 'from-blue-500 to-blue-600',
      bike: 'from-orange-500 to-orange-600',
      scooter: 'from-green-500 to-green-600',
      truck: 'from-gray-500 to-gray-600',
      bus: 'from-purple-500 to-purple-600',
    };
    return gradients[type] || 'from-gray-500 to-gray-600';
  };

  return (
    <Card hoverable className="relative overflow-hidden">
      <div className="flex items-start gap-4">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className={`w-16 h-16 bg-gradient-to-br ${getGradient(vehicle.vehicle_type)} rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0`}
        >
          <Icon size={32} className="text-white" />
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-lg text-gray-900 dark:text-gray-100 truncate">
                {vehicle.brand} {vehicle.model}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {vehicle.variant && `${vehicle.variant} • `}
                {vehicle.year}
              </p>
            </div>

            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface transition-colors"
              >
                <MoreVertical size={20} className="text-gray-600 dark:text-gray-400" />
              </motion.button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-elevated rounded-xl shadow-floating border border-gray-200 dark:border-gray-700 z-20 overflow-hidden"
                  >
                    {onViewDocuments && (
                      <button
                        onClick={() => {
                          onViewDocuments(vehicle);
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors"
                      >
                        <FileText size={18} className="text-gray-600 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Documents
                        </span>
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => {
                          onEdit(vehicle);
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors"
                      >
                        <Edit size={18} className="text-gray-600 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Edit
                        </span>
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => {
                          onDelete(vehicle.id);
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-gray-200 dark:border-gray-700"
                      >
                        <Trash2 size={18} className="text-alert" />
                        <span className="text-sm font-medium text-alert">
                          Delete
                        </span>
                      </button>
                    )}
                  </motion.div>
                </>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className="px-3 py-1 bg-gray-100 dark:bg-dark-surface rounded-lg text-xs font-mono font-semibold text-gray-900 dark:text-gray-100">
              {vehicle.registration_number}
            </span>
            {vehicle.fuel_type && (
              <span className="px-3 py-1 bg-accent-blue/10 text-accent-blue rounded-lg text-xs font-medium capitalize">
                {vehicle.fuel_type}
              </span>
            )}
            {vehicle.color && (
              <span className="px-3 py-1 bg-gray-100 dark:bg-dark-surface rounded-lg text-xs font-medium capitalize text-gray-700 dark:text-gray-300">
                {vehicle.color}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default VehicleCard;

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Modal, Input, Button } from '../ui';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui';

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddVehicleModal = ({ isOpen, onClose, onSuccess }: AddVehicleModalProps) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    registration_number: '',
    brand: '',
    model: '',
    variant: '',
    year: '',
    vehicle_type: 'car',
    fuel_type: '',
    color: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const vehicleTypes = ['car', 'bike', 'scooter', 'truck', 'bus', 'other'];
  const fuelTypes = ['petrol', 'diesel', 'electric', 'hybrid', 'cng'];

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.registration_number.trim()) {
      newErrors.registration_number = 'Registration number is required';
    }
    if (!formData.brand.trim()) {
      newErrors.brand = 'Brand is required';
    }
    if (!formData.model.trim()) {
      newErrors.model = 'Model is required';
    }
    if (!formData.year) {
      newErrors.year = 'Year is required';
    } else {
      const year = parseInt(formData.year);
      const currentYear = new Date().getFullYear();
      if (year < 1900 || year > currentYear + 1) {
        newErrors.year = 'Invalid year';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('vehicles').insert([
        {
          ...formData,
          year: parseInt(formData.year),
          user_id: user.id,
        },
      ]);

      if (error) throw error;

      showToast('success', 'Vehicle added successfully!');
      onSuccess();
      onClose();
      setFormData({
        registration_number: '',
        brand: '',
        model: '',
        variant: '',
        year: '',
        vehicle_type: 'car',
        fuel_type: '',
        color: '',
      });
    } catch (error: any) {
      showToast('error', error.message || 'Failed to add vehicle');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Vehicle" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Registration Number"
          placeholder="e.g., MH 01 AB 1234"
          value={formData.registration_number}
          onChange={(e) => handleChange('registration_number', e.target.value.toUpperCase())}
          error={errors.registration_number}
          disabled={loading}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Brand"
            placeholder="e.g., Honda"
            value={formData.brand}
            onChange={(e) => handleChange('brand', e.target.value)}
            error={errors.brand}
            disabled={loading}
          />
          <Input
            label="Model"
            placeholder="e.g., City"
            value={formData.model}
            onChange={(e) => handleChange('model', e.target.value)}
            error={errors.model}
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Variant"
            placeholder="e.g., VX"
            value={formData.variant}
            onChange={(e) => handleChange('variant', e.target.value)}
            disabled={loading}
          />
          <Input
            label="Year"
            type="number"
            placeholder="e.g., 2023"
            value={formData.year}
            onChange={(e) => handleChange('year', e.target.value)}
            error={errors.year}
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Vehicle Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {vehicleTypes.map((type) => (
              <motion.button
                key={type}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => handleChange('vehicle_type', type)}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                  formData.vehicle_type === type
                    ? 'bg-accent-blue text-white shadow-md'
                    : 'bg-gray-100 dark:bg-dark-surface text-gray-700 dark:text-gray-300'
                }`}
                disabled={loading}
              >
                {type}
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Fuel Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {fuelTypes.map((type) => (
              <motion.button
                key={type}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => handleChange('fuel_type', type)}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                  formData.fuel_type === type
                    ? 'bg-accent-blue text-white shadow-md'
                    : 'bg-gray-100 dark:bg-dark-surface text-gray-700 dark:text-gray-300'
                }`}
                disabled={loading}
              >
                {type}
              </motion.button>
            ))}
          </div>
        </div>

        <Input
          label="Color (Optional)"
          placeholder="e.g., Red"
          value={formData.color}
          onChange={(e) => handleChange('color', e.target.value)}
          disabled={loading}
        />

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            fullWidth
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
          >
            Add Vehicle
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddVehicleModal;

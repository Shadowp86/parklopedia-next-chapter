import { useState, useEffect } from 'react';
import { X, Calendar, Clock, Car, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ParkingSpot, Vehicle } from '@/types/database';

interface ParkingBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  spot: ParkingSpot;
  vehicles: Vehicle[];
  onBookingComplete: (bookingData: any) => void;
}

const ParkingBookingModal = ({
  isOpen,
  onClose,
  spot,
  vehicles,
  onBookingComplete,
}: ParkingBookingModalProps) => {
  const [step, setStep] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('1');
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      // Set default date to today
      const today = new Date().toISOString().split('T')[0];
      setBookingDate(today);
      
      // Set default start time to next hour
      const now = new Date();
      const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
      const hours = nextHour.getHours().toString().padStart(2, '0');
      const minutes = nextHour.getMinutes().toString().padStart(2, '0');
      setStartTime(`${hours}:${minutes}`);
    }
  }, [isOpen]);

  useEffect(() => {
    // Calculate total amount
    const hours = parseFloat(duration);
    setTotalAmount(spot.price_per_hour * hours);
  }, [duration, spot.price_per_hour]);

  const handleNext = () => {
    if (step === 1 && selectedVehicle) {
      setStep(2);
    } else if (step === 2 && bookingDate && startTime && duration) {
      setStep(3);
    }
  };

  const handleConfirmBooking = () => {
    const bookingData = {
      spot_id: spot.id,
      vehicle_id: selectedVehicle,
      booking_date: bookingDate,
      start_time: startTime,
      duration: parseFloat(duration),
      total_amount: totalAmount,
    };
    onBookingComplete(bookingData);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="w-full md:max-w-2xl bg-white dark:bg-dark-elevated rounded-t-3xl md:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-dark-elevated border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Book Parking</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-dark-surface rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                    step >= num
                      ? 'bg-accent-blue text-white'
                      : 'bg-gray-200 dark:bg-dark-surface text-gray-500'
                  }`}
                >
                  {num}
                </div>
                {num < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step > num ? 'bg-accent-blue' : 'bg-gray-200 dark:bg-dark-surface'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="p-6">
            {/* Step 1: Select Vehicle */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold mb-4">Select Vehicle</h3>
                <div className="space-y-2">
                  {vehicles.length === 0 ? (
                    <Card className="p-4 text-center">
                      <p className="text-gray-600 dark:text-gray-400">
                        No vehicles found. Please add a vehicle first.
                      </p>
                    </Card>
                  ) : (
                    vehicles.map((vehicle) => (
                      <Card
                        key={vehicle.id}
                        className={`p-4 cursor-pointer transition-all ${
                          selectedVehicle === vehicle.id
                            ? 'border-2 border-accent-blue bg-accent-blue/5'
                            : 'hover:bg-gray-50 dark:hover:bg-dark-surface'
                        }`}
                        onClick={() => setSelectedVehicle(vehicle.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-brand-accent to-accent-blue-dark rounded-lg flex items-center justify-center">
                            <Car size={24} className="text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">
                              {vehicle.make} {vehicle.model}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {vehicle.registration_number}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 2: Select Date & Time */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold mb-4">Select Date & Time</h3>
                
                <Card className="p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{spot.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{spot.address}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-accent-blue">₹{spot.price_per_hour}/hr</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {spot.available_spots} spots left
                      </p>
                    </div>
                  </div>
                </Card>

                <div>
                  <Label htmlFor="date">Booking Date</Label>
                  <div className="relative mt-1">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                      id="date"
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="time">Start Time</Label>
                  <div className="relative mt-1">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                      id="time"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="duration">Duration (hours)</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 8, 10, 12, 24].map((hours) => (
                        <SelectItem key={hours} value={hours.toString()}>
                          {hours} {hours === 1 ? 'hour' : 'hours'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Card className="p-4 bg-accent-blue/5 border-accent-blue">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total Amount</span>
                    <span className="text-2xl font-bold text-accent-blue">₹{totalAmount}</span>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-semibold mb-4">Payment Summary</h3>
                
                <Card className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Parking Spot</span>
                    <span className="font-medium">{spot.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Date & Time</span>
                    <span className="font-medium">{bookingDate} at {startTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Duration</span>
                    <span className="font-medium">{duration} {duration === '1' ? 'hour' : 'hours'}</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between">
                    <span className="font-semibold">Total Amount</span>
                    <span className="text-xl font-bold text-accent-blue">₹{totalAmount}</span>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <CreditCard size={24} className="text-gray-400" />
                    <span className="font-medium">Payment Method</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Payment will be processed securely. You'll receive a confirmation with QR code after booking.
                  </p>
                </Card>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="flex-1"
                >
                  Back
                </Button>
              )}
              {step < 3 ? (
                <Button
                  onClick={handleNext}
                  disabled={
                    (step === 1 && !selectedVehicle) ||
                    (step === 2 && (!bookingDate || !startTime || !duration))
                  }
                  className="flex-1"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleConfirmBooking}
                  className="flex-1 bg-accent-blue hover:bg-accent-blue-dark"
                >
                  Confirm Booking
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ParkingBookingModal;

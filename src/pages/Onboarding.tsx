import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, FileText, Shield } from 'lucide-react';
import { Button } from '../components/ui';

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const steps = [
    {
      icon: Car,
      title: 'Manage Your Vehicles',
      description: 'Add and track all your vehicles in one place. Keep digital records of registration, insurance, and maintenance.',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: FileText,
      title: 'Smart Document Tracking',
      description: 'Never miss a renewal again. Get automatic reminders for insurance, PUC, and other important documents.',
      color: 'from-green-500 to-green-600',
    },
    {
      icon: Shield,
      title: 'Book Services & Parking',
      description: 'Find nearby parking spots and book vehicle services with ease. All your automotive needs in one app.',
      color: 'from-purple-500 to-purple-600',
    },
  ];

  const currentStep = steps[step];
  const Icon = currentStep.icon;

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      navigate('/');
    }
  };

  const handleSkip = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-light-surface dark:bg-dark-base flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className={`w-32 h-32 mx-auto bg-gradient-to-br ${currentStep.color} rounded-3xl flex items-center justify-center shadow-floating`}
              >
                <Icon size={64} className="text-white" />
              </motion.div>

              <div className="text-center space-y-4">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-display font-bold text-gray-900 dark:text-gray-100"
                >
                  {currentStep.title}
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed"
                >
                  {currentStep.description}
                </motion.p>
              </div>

              <div className="flex justify-center gap-2">
                {steps.map((_, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === step
                        ? 'w-8 bg-accent-blue'
                        : 'w-2 bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-4 space-y-3"
      >
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleNext}
        >
          {step < steps.length - 1 ? 'Next' : 'Get Started'}
        </Button>

        {step < steps.length - 1 && (
          <Button
            variant="ghost"
            size="lg"
            fullWidth
            onClick={handleSkip}
          >
            Skip
          </Button>
        )}
      </motion.div>
    </div>
  );
};

export default Onboarding;

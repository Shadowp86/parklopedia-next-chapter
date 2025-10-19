import { Card } from '../components/ui';
import { Wrench, Droplet, Zap, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

const Services = () => {
  const serviceTypes = [
    { icon: Wrench, label: 'Repair', color: 'bg-orange-500' },
    { icon: Droplet, label: 'Car Wash', color: 'bg-blue-500' },
    { icon: Zap, label: 'Quick Service', color: 'bg-yellow-500' },
    { icon: Settings, label: 'Maintenance', color: 'bg-green-500' },
  ];

  return (
    <div className="px-4 space-y-6">
      <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100">
        Vehicle Services
      </h1>

      <div className="grid grid-cols-2 gap-3">
        {serviceTypes.map((service, index) => (
          <motion.button
            key={service.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Card hoverable className="text-center">
              <div className={`w-16 h-16 ${service.color} rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg`}>
                <service.icon size={32} className="text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {service.label}
              </h3>
            </Card>
          </motion.button>
        ))}
      </div>

      <section>
        <h2 className="text-xl font-display font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Popular Services
        </h2>
        <div className="space-y-3">
          {[1, 2, 3].map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card hoverable className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-accent-blue to-accent-blue-dark rounded-xl flex items-center justify-center">
                  <Wrench size={28} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    Service Available
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Add your vehicle to see available services
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-accent-blue">---</p>
                  <p className="text-xs text-gray-500">Coming Soon</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Services;

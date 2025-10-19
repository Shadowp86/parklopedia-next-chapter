import { Card } from '../components/ui';
import { Car, MapPin, Wrench, FileText, Zap, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const Home = () => {
  const quickActions = [
    { icon: Car, label: 'Add Vehicle', color: 'bg-blue-500' },
    { icon: MapPin, label: 'Find Parking', color: 'bg-green-500' },
    { icon: Wrench, label: 'Book Service', color: 'bg-orange-500' },
    { icon: FileText, label: 'Documents', color: 'bg-purple-500' },
  ];

  const stats = [
    { label: 'Vehicles', value: '0', icon: Car },
    { label: 'Bookings', value: '0', icon: MapPin },
    { label: 'Services', value: '0', icon: Wrench },
  ];

  return (
    <div className="px-4 space-y-6">
      <section>
        <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-2"
            >
              <div className={`w-14 h-14 ${action.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                <action.icon size={24} className="text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
                {action.label}
              </span>
            </motion.button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-display font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Your Dashboard
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="text-center">
                <stat.icon size={24} className="mx-auto mb-2 text-accent-blue" />
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {stat.label}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-semibold text-gray-900 dark:text-gray-100">
            Recommended Services
          </h2>
          <button className="text-sm text-accent-blue font-medium">
            View All
          </button>
        </div>
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
                  <Zap size={28} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    Service Available
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Add your first vehicle to see personalized recommendations
                  </p>
                </div>
                <TrendingUp size={20} className="text-success" />
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section>
        <Card className="bg-gradient-to-br from-accent-blue to-accent-blue-dark text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">Get Started</h3>
              <p className="text-sm opacity-90">
                Add your first vehicle to unlock all features
              </p>
            </div>
            <button className="px-4 py-2 bg-white text-accent-blue rounded-lg font-medium">
              Add Now
            </button>
          </div>
        </Card>
      </section>
    </div>
  );
};

export default Home;

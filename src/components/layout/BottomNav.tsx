import { Home, Car, ParkingCircle, Wrench, User, Trophy, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/vehicles', icon: Car, label: 'Vehicles' },
  { path: '/parking', icon: ParkingCircle, label: 'Parking' },
  { path: '/services', icon: Wrench, label: 'Services' },
  { path: '/rewards', icon: Trophy, label: 'Rewards' },
  { path: '/family', icon: Users, label: 'Family' },
  { path: '/profile', icon: User, label: 'Profile' },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-dark-base border-t border-gray-200 dark:border-gray-800 pb-safe">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors min-w-[64px]"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="relative"
              >
                <Icon
                  size={24}
                  className={`transition-colors ${
                    isActive
                      ? 'text-accent-blue'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent-blue rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </motion.div>
              <span
                className={`text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-accent-blue'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;

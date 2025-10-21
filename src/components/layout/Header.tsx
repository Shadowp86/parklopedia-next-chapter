import { Bell, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '@/assets/logo.png';

interface HeaderProps {
  userName?: string;
  showMenu?: boolean;
  onMenuClick?: () => void;
}

const Header = ({ userName = 'Guest', showMenu = false, onMenuClick }: HeaderProps) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-dark-base/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showMenu && (
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface transition-colors"
              aria-label="Menu"
            >
              <Menu size={24} className="text-gray-700 dark:text-gray-300" />
            </button>
          )}
          <img src={logo} alt="Parklopedia" className="h-10 w-10" />
          <div>
            <h1 className="text-lg font-display font-semibold text-gray-900 dark:text-gray-100">
              {getGreeting()}, {userName}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-surface transition-colors"
            aria-label="Notifications"
          >
            <Bell size={24} className="text-gray-700 dark:text-gray-300" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-alert rounded-full"></span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-blue to-accent-blue-dark flex items-center justify-center text-white font-semibold shadow-md"
            aria-label="Profile"
          >
            {userName.charAt(0).toUpperCase()}
          </motion.button>
        </div>
      </div>
    </header>
  );
};

export default Header;

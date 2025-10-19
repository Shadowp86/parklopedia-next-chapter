import { Card } from '../components/ui';
import { User, Bell, Shield, Moon, Globe, HelpCircle, LogOut, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';

const Profile = () => {
  const { user, signOut } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (user) {
      setUserProfile(user);
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await signOut();
    }
  };
  const settingsGroups = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Personal Info', path: '/profile/info' },
        { icon: Bell, label: 'Notifications', path: '/profile/notifications' },
        { icon: Shield, label: 'Privacy & Security', path: '/profile/security' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: Moon, label: 'Dark Mode', path: '/profile/theme', toggle: true },
        { icon: Globe, label: 'Language', path: '/profile/language' },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help & Support', path: '/support' },
      ],
    },
  ];

  return (
    <div className="px-4 space-y-6 pb-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-accent-blue to-accent-blue-dark rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {(userProfile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <h2 className="text-xl font-display font-bold text-gray-900 dark:text-gray-100">
            {userProfile?.full_name || 'User'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {user?.email || 'No email'}
          </p>
        </Card>
      </motion.div>

      {settingsGroups.map((group, groupIndex) => (
        <section key={group.title}>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            {group.title}
          </h3>
          <Card padding="none">
            {group.items.map((item, itemIndex) => (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (groupIndex * 0.1) + (itemIndex * 0.05) }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-dark-elevated transition-colors ${
                  itemIndex !== group.items.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''
                }`}
              >
                <div className="w-10 h-10 bg-gray-100 dark:bg-dark-surface rounded-xl flex items-center justify-center">
                  <item.icon size={20} className="text-gray-700 dark:text-gray-300" />
                </div>
                <span className="flex-1 text-left font-medium text-gray-900 dark:text-gray-100">
                  {item.label}
                </span>
                {item.toggle ? (
                  <div className="w-12 h-6 bg-gray-300 dark:bg-gray-600 rounded-full relative">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform"></div>
                  </div>
                ) : (
                  <ChevronRight size={20} className="text-gray-400" />
                )}
              </motion.button>
            ))}
          </Card>
        </section>
      ))}

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleLogout}
        className="w-full"
      >
        <Card className="bg-alert/10 border border-alert/20">
          <div className="flex items-center justify-center gap-3 text-alert">
            <LogOut size={20} />
            <span className="font-semibold">Logout</span>
          </div>
        </Card>
      </motion.button>
    </div>
  );
};

export default Profile;

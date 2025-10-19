import { Plus, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface FABAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface FloatingActionButtonProps {
  actions?: FABAction[];
  sosMode?: boolean;
}

const FloatingActionButton = ({ actions, sosMode = false }: FloatingActionButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (sosMode) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-20 right-4 z-40 w-14 h-14 bg-alert rounded-full shadow-floating flex items-center justify-center text-white"
        aria-label="Emergency SOS"
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <AlertCircle size={28} />
        </motion.div>
      </motion.button>
    );
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && actions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-20 right-4 z-40">
        <AnimatePresence>
          {isOpen && actions && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-16 right-0 flex flex-col gap-3 mb-2"
            >
              {actions.map((action, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    action.onClick();
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-full shadow-elevated ${
                    action.variant === 'danger'
                      ? 'bg-alert text-white'
                      : 'bg-white dark:bg-dark-elevated text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {action.icon}
                  <span className="text-sm font-medium whitespace-nowrap">
                    {action.label}
                  </span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-accent-blue rounded-full shadow-floating flex items-center justify-center text-white hover:bg-accent-blue-dark transition-colors"
          aria-label="Quick actions"
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Plus size={28} strokeWidth={2.5} />
          </motion.div>
        </motion.button>
      </div>
    </>
  );
};

export default FloatingActionButton;

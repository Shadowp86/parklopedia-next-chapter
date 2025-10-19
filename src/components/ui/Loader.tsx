import { motion } from 'framer-motion';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  text?: string;
}

const Loader = ({ size = 'md', fullScreen = false, text }: LoaderProps) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  const loader = (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        className={`${sizes[size]} border-4 border-accent-blue/30 border-t-accent-blue rounded-full`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      {text && (
        <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-dark-base/80 backdrop-blur-sm z-50">
        {loader}
      </div>
    );
  }

  return loader;
};

export default Loader;

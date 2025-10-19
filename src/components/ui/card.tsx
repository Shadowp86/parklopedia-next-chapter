import { HTMLAttributes, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outline';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({
    children,
    variant = 'default',
    padding = 'md',
    hoverable = false,
    className = '',
    ...props
  }, ref) => {
    const variants = {
      default: 'bg-white dark:bg-dark-surface shadow-card',
      elevated: 'bg-white dark:bg-dark-elevated shadow-elevated',
      outline: 'bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700',
    };

    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    const hoverClass = hoverable ? 'hover:shadow-elevated hover:scale-[1.02] cursor-pointer' : '';

    return (
      <motion.div
        ref={ref}
        whileTap={hoverable ? { scale: 0.98 } : undefined}
        className={`rounded-xl transition-all duration-200 ${variants[variant]} ${paddings[padding]} ${hoverClass} ${className}`}
        {...(props as any)}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

export default Card;

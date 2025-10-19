import { SignIn } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { Car } from 'lucide-react';

const Login = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-blue to-accent-blue-dark flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-20 h-20 bg-white rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-floating"
          >
            <Car size={40} className="text-accent-blue" />
          </motion.div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-blue-100">
            Sign in to manage your vehicles
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-dark-elevated rounded-2xl shadow-floating p-6"
        >
          <SignIn
            path="/login"
            routing="path"
            signUpUrl="/signup"
            redirectUrl="/"
            appearance={{
              elements: {
                formButtonPrimary: 'bg-accent-blue hover:bg-accent-blue-dark',
                card: 'shadow-none',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton: 'bg-gray-100 hover:bg-gray-200',
                formFieldInput: 'rounded-xl border-gray-300 focus:border-accent-blue',
                footerActionLink: 'text-accent-blue hover:text-accent-blue-dark',
              },
            }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;

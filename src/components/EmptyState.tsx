import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void } | { label: string; to: string };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-dashed border-gray-300 dark:border-gray-800 bg-white/50 dark:bg-[#16181d]/50 backdrop-blur-sm">
      <motion.div 
        animate={{ y: [0, -8, 0] }} 
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="mb-6 text-brand-500 bg-brand-50 dark:bg-brand-900/20 p-5 rounded-full shadow-sm"
      >
        {icon}
      </motion.div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6 leading-relaxed">{description}</p>
      
      {action && (
        'to' in action ? (
          <Link to={action.to} className="btn-primary rounded-full px-8">
            {action.label}
          </Link>
        ) : (
          <button onClick={action.onClick} className="btn-primary rounded-full px-8">
            {action.label}
          </button>
        )
      )}
    </div>
  );
}

import React from "react";
import { motion } from "framer-motion";

interface RealmPlaceholderProps {
  realmName: string;
  realmColor: string;
  realmGradient: string;
  onReturn: () => void;
}

const RealmPlaceholder: React.FC<RealmPlaceholderProps> = ({ 
  realmName, 
  realmColor, 
  realmGradient,
  onReturn 
}) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center"
         style={{ background: `linear-gradient(to bottom, ${realmColor}20, #000000)` }}>
      <motion.h1 
        className={`text-4xl font-pixel mb-8 text-transparent bg-clip-text bg-gradient-to-r ${realmGradient}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {realmName}
      </motion.h1>
      
      <motion.div 
        className="max-w-lg text-center mb-8 p-6 border border-gray-700 bg-black bg-opacity-50 relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <p className="text-lg text-gray-300 mb-4">
          This realm is under construction. The challenge awaits implementation.
        </p>
        <p className="text-gray-400">
          Each realm features a unique puzzle or challenge related to its theme.
        </p>
        
        {/* Decorative elements */}
        <motion.div
          className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-tl ${realmGradient} opacity-10`}
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 180, 270, 360]
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity,
            ease: "linear" 
          }}
        />
        
        <motion.div 
          className="absolute top-0 left-0 w-full h-0.5"
          style={{ background: `linear-gradient(to right, transparent, ${realmColor}, transparent)` }}
        />
        
        <motion.div 
          className="absolute bottom-0 right-0 w-full h-0.5"
          style={{ background: `linear-gradient(to left, transparent, ${realmColor}, transparent)` }}
        />
      </motion.div>
      
      {/* Interactive elements */}
      <div className="flex gap-4">
        <motion.button 
          onClick={onReturn}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`px-6 py-3 bg-black hover:bg-gray-900 text-white border transition-all duration-300`}
          style={{ borderColor: realmColor }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          Return to Hub
        </motion.button>
        
        <motion.button 
          className={`px-6 py-3 bg-gradient-to-r ${realmGradient} text-white opacity-50 cursor-not-allowed`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.5, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          Coming Soon
        </motion.button>
      </div>
      
      {/* Floating particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute rounded-full bg-white"
          style={{ 
            width: `${Math.random() * 3 + 1}px`,
            height: `${Math.random() * 3 + 1}px`,
            boxShadow: `0 0 ${Math.random() * 5 + 2}px ${realmColor}`
          }}
          animate={{
            x: [
              Math.random() * window.innerWidth,
              Math.random() * window.innerWidth
            ],
            y: [
              Math.random() * window.innerHeight,
              Math.random() * window.innerHeight
            ],
            opacity: [0, 0.7, 0]
          }}
          transition={{
            duration: Math.random() * 10 + 5,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
};

export default RealmPlaceholder;
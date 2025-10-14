import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedBackgroundProps {
  children: ReactNode
  className?: string
  variant?: 'gradient' | 'mesh' | 'particles'
}

export const AnimatedBackground = ({ 
  children, 
  className = '', 
  variant = 'gradient' 
}: AnimatedBackgroundProps) => {
  const gradientVariants = {
    animate: {
      background: [
        'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(45deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(45deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
      ],
      transition: {
        duration: 10,
        repeat: Infinity,
        ease: "linear" as const
      }
    }
  }

  const meshVariants = {
    animate: {
      background: [
        'radial-gradient(circle at 20% 80%, #120078 0%, transparent 50%), radial-gradient(circle at 80% 20%, #ff006e 0%, transparent 50%), radial-gradient(circle at 40% 40%, #8338ec 0%, transparent 50%)',
        'radial-gradient(circle at 80% 80%, #ff006e 0%, transparent 50%), radial-gradient(circle at 20% 20%, #8338ec 0%, transparent 50%), radial-gradient(circle at 60% 60%, #120078 0%, transparent 50%)',
        'radial-gradient(circle at 60% 20%, #8338ec 0%, transparent 50%), radial-gradient(circle at 40% 80%, #120078 0%, transparent 50%), radial-gradient(circle at 20% 40%, #ff006e 0%, transparent 50%)',
      ],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    }
  }

  const getVariant = () => {
    switch (variant) {
      case 'mesh':
        return meshVariants
      case 'gradient':
      default:
        return gradientVariants
    }
  }

  return (
    <motion.div
      className={`relative min-h-screen ${className}`}
      variants={getVariant()}
      animate="animate"
      style={{
        background: variant === 'gradient' 
          ? 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)'
          : 'radial-gradient(circle at 20% 80%, #120078 0%, transparent 50%), radial-gradient(circle at 80% 20%, #ff006e 0%, transparent 50%), radial-gradient(circle at 40% 40%, #8338ec 0%, transparent 50%)'
      }}
    >
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  )
}
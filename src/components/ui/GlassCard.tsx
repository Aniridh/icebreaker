import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export const GlassCard = ({ 
  children, 
  className = '', 
  hover = true,
  onClick 
}: GlassCardProps) => {
  return (
    <motion.div
      className={`
        backdrop-blur-md bg-white/10 border border-white/20 
        rounded-2xl shadow-xl relative overflow-hidden
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      whileHover={hover ? { 
        scale: 1.02, 
        y: -5,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30 
      }}
      onClick={onClick}
    >
      {/* Gradient border effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 p-[1px]">
        <div className="h-full w-full rounded-2xl bg-black/20 backdrop-blur-md" />
      </div>
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 2,
            ease: "easeInOut"
          }}
          style={{
            transform: 'skewX(-45deg)',
            width: '200%',
          }}
        />
      </div>
      
      <div className="relative z-10 p-6">
        {children}
      </div>
    </motion.div>
  )
}
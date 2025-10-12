/**
 * Scanner Page
 * Dedicated page for business card scanning functionality
 */
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, Scan } from 'lucide-react'
import Scanner from '../components/Scanner'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

const ScannerPage: React.FC = () => {
  const navigate = useNavigate()
  const [scannedContacts, setScannedContacts] = useState<any[]>([])

  const handleContactCreated = (contact: any) => {
    setScannedContacts(prev => [contact, ...prev])
    toast.success('Contact created successfully!')
  }

  const handleScanComplete = (result: any) => {
    if (result.success && result.data?.contact) {
      setScannedContacts(prev => [result.data.contact, ...prev])
    }
  }

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-50">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
        </div>
      </div>

      {/* Header */}
      <motion.div 
        className="relative z-10 bg-white/10 backdrop-blur-md border-b border-white/20"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <motion.button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </motion.button>
              
              <div className="h-6 w-px bg-white/20"></div>
              
              <motion.h1 
                className="text-xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                Business Card Scanner
              </motion.h1>
            </div>
            
            <motion.div 
              className="flex items-center gap-2 text-sm text-white/60"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Users className="h-4 w-4" />
              {scannedContacts.length} contacts scanned today
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Scanner */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <Scanner
              mode="preview"
              onContactCreated={handleContactCreated}
              onScanComplete={handleScanComplete}
            />
          </motion.div>

          {/* Recent Scans */}
          <motion.div 
            className="lg:col-span-1"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <motion.div 
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <motion.h3 
                className="text-lg font-semibold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                Recent Scans
              </motion.h3>
              
              {scannedContacts.length === 0 ? (
                <motion.div 
                  className="text-center py-8"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  <motion.div
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  >
                    <Scan className="h-12 w-12 text-purple-300 mx-auto mb-4" />
                  </motion.div>
                  <p className="text-white/70">No contacts scanned yet</p>
                  <p className="text-sm text-white/50 mt-1">
                    Scan your first business card to get started
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {scannedContacts.slice(0, 5).map((contact, index) => (
                    <motion.div
                      key={contact.id || index}
                      className="flex items-center gap-3 p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-200"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                    >
                      <motion.div 
                        className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <span className="text-white font-medium text-sm">
                          {contact.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {contact.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-white/60 truncate">
                          {contact.company || contact.title || 'No details'}
                        </p>
                      </div>
                      <div className="text-xs text-white/40">
                        Just now
                      </div>
                    </motion.div>
                  ))}
                  
                  {scannedContacts.length > 5 && (
                    <motion.button
                      onClick={() => navigate('/dashboard')}
                      className="w-full text-center py-2 text-sm text-purple-300 hover:text-purple-200 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      View all contacts ({scannedContacts.length})
                    </motion.button>
                  )}
                </div>
              )}
            </motion.div>

            {/* Tips */}
            <motion.div 
              className="mt-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-md border border-white/20 rounded-2xl p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
              whileHover={{ scale: 1.02 }}
            >
              <motion.h4 
                className="text-sm font-medium text-white mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                📸 Scanning Tips
              </motion.h4>
              <motion.ul 
                className="text-xs text-white/80 space-y-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
              >
                <motion.li whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>• Ensure good lighting and clear image</motion.li>
                <motion.li whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>• Keep the card flat and fully visible</motion.li>
                <motion.li whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>• Avoid shadows and reflections</motion.li>
                <motion.li whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>• Higher resolution images work better</motion.li>
              </motion.ul>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

export default ScannerPage
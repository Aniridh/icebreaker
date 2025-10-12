/**
 * Scanner Component
 * Multimodal scanning interface for business cards and documents
 */
import React, { useState, useRef, useCallback } from 'react'
import { Camera, Upload, FileImage, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface ScanResult {
  success: boolean
  data?: {
    extractedText: string
    contact?: any
    confidence: number
    filename?: string
    canCreateContact?: boolean
  }
  error?: string
}

interface ScannerProps {
  onContactCreated?: (contact: any) => void
  onScanComplete?: (result: ScanResult) => void
  mode?: 'preview' | 'create' // preview shows data, create automatically creates contact
}

export const Scanner: React.FC<ScannerProps> = ({ 
  onContactCreated, 
  onScanComplete,
  mode = 'preview' 
}) => {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleScan = useCallback(async (file: File) => {
    if (!file) return

    setIsScanning(true)
    setScanResult(null)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const endpoint = mode === 'create' ? '/api/scanner/create-contact' : '/api/scanner/preview-contact'
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        setScanResult(result)
        onScanComplete?.(result)
        
        if (mode === 'create' && result.data.contact) {
          onContactCreated?.(result.data.contact)
          toast.success(`Contact "${result.data.contact.name}" created successfully!`)
        } else if (mode === 'preview') {
          toast.success('Business card scanned successfully!')
        }
      } else {
        setScanResult(result)
        toast.error(result.error || 'Failed to scan image')
      }
    } catch (error) {
      console.error('Scan error:', error)
      const errorResult = {
        success: false,
        error: 'Network error occurred while scanning'
      }
      setScanResult(errorResult)
      toast.error('Failed to scan image')
    } finally {
      setIsScanning(false)
    }
  }, [mode, onContactCreated, onScanComplete])

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return
    
    const file = files[0]
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    
    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }
    
    handleScan(file)
  }, [handleScan])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files)
    }
  }, [handleFileSelect])

  const createContactFromPreview = async () => {
    if (!scanResult?.data?.contact) return

    setIsScanning(true)
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(scanResult.data.contact)
      })

      const result = await response.json()
      
      if (result.success) {
        onContactCreated?.(result.data)
        toast.success(`Contact "${result.data.name}" created successfully!`)
        setScanResult(null)
      } else {
        toast.error(result.error || 'Failed to create contact')
      }
    } catch (error) {
      console.error('Error creating contact:', error)
      toast.error('Failed to create contact')
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <motion.div 
      className="w-full max-w-2xl mx-auto p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div 
        className="text-center mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          📱 Business Card Scanner
        </h2>
        <p className="text-white/80 text-lg">
          Scan business cards to automatically extract contact information
        </p>
      </motion.div>

      {/* Upload Area */}
      <motion.div
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
          dragActive
            ? 'border-purple-400 bg-purple-500/20 scale-105'
            : 'border-white/30 hover:border-white/50 bg-white/5'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        whileHover={{ scale: dragActive ? 1.05 : 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <AnimatePresence mode="wait">
          {isScanning ? (
            <motion.div 
              className="flex flex-col items-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              key="scanning"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="h-16 w-16 text-purple-400 mb-4" />
              </motion.div>
              <motion.p 
                className="text-xl font-medium text-white mb-2"
                animate={{ opacity: [1, 0.7, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Processing image...
              </motion.p>
              <p className="text-sm text-white/60">This may take a few seconds</p>
            </motion.div>
          ) : (
            <motion.div 
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              key="upload"
            >
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <FileImage className="h-16 w-16 text-white/60 mb-4" />
              </motion.div>
              <p className="text-xl font-medium text-white mb-2">
                Drop your business card image here
              </p>
              <p className="text-sm text-white/60 mb-6">
                or click to browse files
              </p>
              
              <div className="flex gap-4">
                <motion.button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Upload className="h-5 w-5" />
                  Choose File
                </motion.button>
                
                <motion.button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Camera className="h-5 w-5" />
                  Take Photo
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </motion.div>

      {/* Scan Result */}
      <AnimatePresence>
        {scanResult && (
          <motion.div 
            className="mt-6 p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            {scanResult.success ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  >
                    <CheckCircle className="h-6 w-6 text-green-400" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-white">
                    ✨ Scan Successful
                  </h3>
                  <motion.button
                    onClick={() => setScanResult(null)}
                    className="ml-auto p-2 hover:bg-white/10 rounded-lg transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="h-5 w-5 text-white/60" />
                  </motion.button>
                </div>

              {scanResult.data?.contact && (
                <motion.div 
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h4 className="font-medium text-white mb-4 text-lg flex items-center gap-2">
                    👤 Extracted Contact Information:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {scanResult.data.contact.name && (
                      <motion.div 
                        className="text-white/80"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <span className="font-medium text-purple-300">Name:</span> {scanResult.data.contact.name}
                      </motion.div>
                    )}
                    {scanResult.data.contact.title && (
                      <motion.div 
                        className="text-white/80"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <span className="font-medium text-pink-300">Title:</span> {scanResult.data.contact.title}
                      </motion.div>
                    )}
                    {scanResult.data.contact.company && (
                      <motion.div 
                        className="text-white/80"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                      >
                        <span className="font-medium text-blue-300">Company:</span> {scanResult.data.contact.company}
                      </motion.div>
                    )}
                    {scanResult.data.contact.email && (
                      <motion.div 
                        className="text-white/80"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                      >
                        <span className="font-medium text-green-300">Email:</span> {scanResult.data.contact.email}
                      </motion.div>
                    )}
                    {scanResult.data.contact.phone && (
                      <motion.div 
                        className="text-white/80"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                      >
                        <span className="font-medium text-cyan-300">Phone:</span> {scanResult.data.contact.phone}
                      </motion.div>
                    )}
                    {scanResult.data.contact.location && (
                      <motion.div 
                        className="text-white/80"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                      >
                        <span className="font-medium text-yellow-300">Location:</span> {scanResult.data.contact.location}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {mode === 'preview' && scanResult.data?.canCreateContact && (
                <motion.div 
                  className="flex gap-3 mt-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                >
                  <motion.button
                    onClick={createContactFromPreview}
                    disabled={isScanning}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isScanning ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 className="h-5 w-5" />
                      </motion.div>
                    ) : (
                      <CheckCircle className="h-5 w-5" />
                    )}
                    ✨ Create Contact
                  </motion.button>
                </motion.div>
              )}

              {scanResult.data?.confidence && (
                <motion.div 
                  className="mt-4 text-sm text-white/60 flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1 }}
                >
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  Confidence: {Math.round(scanResult.data.confidence)}%
                </motion.div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  <AlertCircle className="h-6 w-6 text-red-400" />
                </motion.div>
                <h3 className="text-xl font-semibold text-white">❌ Scan Failed</h3>
                <motion.button
                  onClick={() => setScanResult(null)}
                  className="ml-auto p-2 hover:bg-white/10 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="h-5 w-5 text-white/60" />
                </motion.button>
              </div>
              <motion.p 
                className="text-red-300 bg-red-500/20 p-4 rounded-xl border border-red-400/30"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {scanResult.error}
              </motion.p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>

      {/* Supported Formats */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Supported formats: JPEG, PNG, WebP, BMP, TIFF • Max size: 10MB
      </div>
    </motion.div>
  )
}

export default Scanner
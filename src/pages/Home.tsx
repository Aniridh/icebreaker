import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '@/hooks/useTheme'
import ProfileDataViewer from '@/components/ProfileDataViewer'

interface ProfileData {
  profile: {
    name?: string
    title?: string
    bio?: string
    skills?: string[]
    interests?: string[]
    experience?: any[]
    projects?: any[]
  }
  summary: string
  icebreakers: string[]
}

export default function Home() {
  const { theme, toggleTheme } = useTheme()
  const [formData, setFormData] = useState({
    linkedin_url: ''
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ProfileData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showProfileViewer, setShowProfileViewer] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.linkedin_url) {
      setError('Please provide a LinkedIn profile URL')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/linkedin/generate-icebreakers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ linkedin_url: formData.linkedin_url })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate icebreakers')
      }

      setResult({
        profile: data.profile,
        summary: data.icebreakers.summary || `${data.profile.name || 'This person'} appears to be a ${data.profile.title || 'professional'} with interesting background and experience. They seem to have diverse skills and would be great to connect with.`,
        icebreakers: data.icebreakers.icebreakers || []
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
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
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex justify-between items-center mb-8">
            <div></div>
            <motion.button
              onClick={toggleTheme}
              className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg hover:bg-white/20 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </motion.button>
          </div>
          
          <motion.h1 
            className="text-6xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            🧊 Icebreaker
          </motion.h1>
          <motion.p 
            className="text-xl text-white/80 max-w-2xl mx-auto mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Transform LinkedIn profiles into personalized conversation starters using AI
          </motion.p>
          
          {/* Info Banner */}
          <motion.div 
            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 mb-8 max-w-2xl mx-auto shadow-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <div className="flex items-center gap-3 text-white">
              <motion.svg 
                className="w-6 h-6" 
                fill="currentColor" 
                viewBox="0 0 24 24"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </motion.svg>
              <span className="font-medium text-lg">Simply paste any LinkedIn profile URL below to get started!</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Form */}
        <motion.div 
          className="max-w-2xl mx-auto mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-3">
                  LinkedIn Profile URL
                </label>
                <motion.input
                  type="url"
                  value={formData.linkedin_url}
                  onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-4 py-4 bg-white/10 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent text-white placeholder-white/60 transition-all"
                  whileFocus={{ scale: 1.02 }}
                />
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white py-4 px-6 rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-2xl relative overflow-hidden"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 opacity-0"
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
                <span className="relative z-10">
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <motion.div 
                        className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full mr-3"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Generating Icebreakers...
                    </div>
                  ) : (
                    'Generate Icebreakers ✨'
                  )}
                </span>
              </motion.button>
            </div>
          </form>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div 
            className="max-w-2xl mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="bg-red-500/20 backdrop-blur-md border border-red-400/30 rounded-xl p-4 shadow-lg">
              <p className="text-red-200 font-medium">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Results */}
        {result && (
          <motion.div 
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-8">
              <motion.h2 
                className="text-3xl font-bold text-white mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Generated Icebreakers for {result.profile.name} ✨
              </motion.h2>
              
              {/* Profile Summary */}
              <motion.div 
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-8"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                  👤 Profile Summary
                </h3>
                <p className="text-white/80 leading-relaxed">{result.summary}</p>
              </motion.div>

              {/* Icebreakers */}
              <div className="space-y-4">
                <motion.h3 
                  className="text-xl font-semibold text-white mb-4 flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  💬 Conversation Starters ({result.icebreakers.length})
                </motion.h3>
                {result.icebreakers.map((icebreaker, index) => (
                  <motion.div 
                    key={index} 
                    className="bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:border-white/40 transition-all group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-white text-lg flex-1 mr-4 leading-relaxed">
                        "{icebreaker}"
                      </p>
                      <motion.button
                        onClick={() => copyToClipboard(icebreaker)}
                        className="p-3 text-white/60 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                        title="Copy to clipboard"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        📋
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Profile Data Viewer */}
      <ProfileDataViewer 
        profile={result?.profile || null}
        isVisible={showProfileViewer}
        onToggle={() => setShowProfileViewer(!showProfileViewer)}
      />
      
      {/* Profile Data Toggle Button */}
      {result && (
        <motion.button
          onClick={() => setShowProfileViewer(!showProfileViewer)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all z-40"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </motion.button>
      )}
    </div>
  )
}
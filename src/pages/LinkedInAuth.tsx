import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Linkedin, User, Briefcase, GraduationCap, Sparkles, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import ProfileDataViewer from '@/components/ProfileDataViewer'

interface LinkedInProfile {
  id: string
  name: string
  headline?: string
  about?: string
  profilePicture?: string
  experience?: Array<{
    title: string
    company: string
    duration?: string
    description?: string
  }>
  education?: Array<{
    school: string
    degree?: string
    field?: string
    year?: string
  }>
  skills?: string[]
}

interface IcebreakerResponse {
  success: boolean
  profile: LinkedInProfile
  icebreakers: {
    summary: string
    icebreakers: string[]
  }
  error?: string
}

const LinkedInAuth: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [profile, setProfile] = useState<LinkedInProfile | null>(null)
  const [icebreakers, setIcebreakers] = useState<{ summary: string; icebreakers: string[] } | null>(null)
  const [showManualForm, setShowManualForm] = useState(false)
  const [manualData, setManualData] = useState({
    name: '',
    headline: '',
    about: '',
    experience: '',
    education: '',
    skills: ''
  })
  const [showProfileViewer, setShowProfileViewer] = useState(false)

  useEffect(() => {
    // Check if user just completed OAuth
    const authSuccess = searchParams.get('linkedin_auth')
    if (authSuccess === 'success') {
      toast.success('LinkedIn authentication successful!')
      checkAuthStatus()
      // Clean up URL
      navigate('/linkedin', { replace: true })
    }

    // Check initial auth status
    checkAuthStatus()
  }, [searchParams, navigate])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/linkedin/status', {
        credentials: 'include'
      })
      const data = await response.json()
      
      if (data.success && data.authenticated) {
        setIsAuthenticated(true)
        toast.success(`Welcome back, ${data.user.name}!`)
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
    }
  }

  const handleLinkedInLogin = () => {
    setIsLoading(true)
    toast.info('Redirecting to LinkedIn...')
    window.location.href = '/api/linkedin/auth'
  }

  const handleGenerateIcebreakers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/linkedin/generate-icebreakers', {
        method: 'POST',
        credentials: 'include'
      })
      
      const data: IcebreakerResponse = await response.json()
      
      if (data.success) {
        setProfile(data.profile)
        setIcebreakers(data.icebreakers)
        toast.success('Icebreakers generated successfully!')
      } else {
        throw new Error(data.error || 'Failed to generate icebreakers')
      }
    } catch (error: any) {
      console.error('Error generating icebreakers:', error)
      toast.error(error.message || 'Failed to generate icebreakers')
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/linkedin/manual-icebreakers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: manualData.name,
          headline: manualData.headline,
          about: manualData.about,
          experience: manualData.experience.split('\n').filter(Boolean),
          education: manualData.education.split('\n').filter(Boolean),
          skills: manualData.skills.split(',').map(s => s.trim()).filter(Boolean)
        })
      })
      
      const data: IcebreakerResponse = await response.json()
      
      if (data.success) {
        setProfile(data.profile)
        setIcebreakers(data.icebreakers)
        setShowManualForm(false)
        toast.success('Icebreakers generated from manual input!')
      } else {
        throw new Error(data.error || 'Failed to generate icebreakers')
      }
    } catch (error: any) {
      console.error('Error generating manual icebreakers:', error)
      toast.error(error.message || 'Failed to generate icebreakers')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/linkedin/logout', {
        method: 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        setIsAuthenticated(false)
        setProfile(null)
        setIcebreakers(null)
        toast.success('Logged out successfully')
      }
    } catch (error) {
      console.error('Error logging out:', error)
      toast.error('Failed to logout')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Linkedin className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">LinkedIn Profile Analyzer</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Generate personalized icebreakers using your LinkedIn profile data or manual input. 
            All data processing is secure and compliant with LinkedIn's terms of service.
          </p>
        </div>

        {/* Authentication Section */}
        {!isAuthenticated && !showManualForm && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Get Started</h2>
              <p className="text-gray-600 mb-6">
                Choose how you'd like to provide your profile information
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleLinkedInLogin}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Linkedin className="w-5 h-5" />
                  )}
                  Sign in with LinkedIn
                </button>
                
                <button
                  onClick={() => setShowManualForm(true)}
                  className="flex items-center justify-center gap-3 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  <User className="w-5 h-5" />
                  Enter Manually
                </button>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Privacy &amp; Security</p>
                    <p>We use LinkedIn's official API with your consent. No scraping or unauthorized data access.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manual Input Form */}
        {showManualForm && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Manual Profile Input</h2>
              <button
                onClick={() => setShowManualForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleManualSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualData.name}
                    onChange={(e) => setManualData({ ...manualData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Professional Headline
                  </label>
                  <input
                    type="text"
                    value={manualData.headline}
                    onChange={(e) => setManualData({ ...manualData, headline: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Software Engineer @ Company"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  About / Bio
                </label>
                <textarea
                  value={manualData.about}
                  onChange={(e) => setManualData({ ...manualData, about: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description about yourself, your interests, and professional background..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience (one per line)
                </label>
                <textarea
                  value={manualData.experience}
                  onChange={(e) => setManualData({ ...manualData, experience: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Software Engineer at Tech Corp&#10;Product Manager at StartUp Inc&#10;Intern at Big Company"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Education (one per line)
                </label>
                <textarea
                  value={manualData.education}
                  onChange={(e) => setManualData({ ...manualData, education: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="BS Computer Science - MIT&#10;MBA - Stanford University"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={manualData.skills}
                  onChange={(e) => setManualData({ ...manualData, skills: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="React, Python, Machine Learning, Project Management"
                />
              </div>
              
              <button
                type="submit"
                disabled={isLoading || !manualData.name}
                className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                Generate Icebreakers
              </button>
            </form>
          </div>
        )}

        {/* Authenticated User Actions */}
        {isAuthenticated && !icebreakers && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Ready to Generate Icebreakers</h2>
              <p className="text-gray-600 mb-6">
                You're successfully connected to LinkedIn. Generate personalized icebreakers based on your profile.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleGenerateIcebreakers}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                  Generate Icebreakers
                </button>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-3 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Display */}
        {profile && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="flex items-start gap-6 mb-6">
              {profile.profilePicture ? (
                <img
                  src={profile.profilePicture}
                  alt={profile.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-10 h-10 text-blue-600" />
                </div>
              )}
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
                {profile.headline && (
                  <p className="text-lg text-gray-600 mt-1">{profile.headline}</p>
                )}
                {profile.about && (
                  <p className="text-gray-700 mt-3 leading-relaxed">{profile.about}</p>
                )}
              </div>
            </div>

            {/* Experience */}
            {profile.experience && profile.experience.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Experience</h3>
                </div>
                <div className="space-y-3">
                  {profile.experience.slice(0, 3).map((exp, index) => (
                    <div key={index} className="border-l-2 border-blue-200 pl-4">
                      <p className="font-medium text-gray-900">{exp.title}</p>
                      <p className="text-gray-600">{exp.company}</p>
                      {exp.duration && (
                        <p className="text-sm text-gray-500">{exp.duration}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {profile.education && profile.education.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Education</h3>
                </div>
                <div className="space-y-2">
                  {profile.education.slice(0, 2).map((edu, index) => (
                    <div key={index}>
                      <p className="font-medium text-gray-900">{edu.school}</p>
                      {edu.degree && (
                        <p className="text-gray-600">{edu.degree} {edu.field && `in ${edu.field}`}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.slice(0, 10).map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Icebreakers Display */}
        {icebreakers && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl font-bold text-gray-900">AI-Generated Icebreakers</h2>
            </div>

            {/* Summary */}
            {icebreakers.summary && (
              <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Profile Summary</h3>
                <p className="text-gray-700 leading-relaxed">{icebreakers.summary}</p>
              </div>
            )}

            {/* Icebreaker Questions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Icebreakers</h3>
              <div className="space-y-4">
                {icebreakers.icebreakers.map((icebreaker, index) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <p className="text-gray-800 leading-relaxed">{icebreaker}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={isAuthenticated ? handleGenerateIcebreakers : () => setShowManualForm(true)}
                disabled={isLoading}
                className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                Generate New Icebreakers
              </button>
              
              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-3 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Profile Data Viewer */}
      {profile && (
        <ProfileDataViewer
          profile={profile}
          isVisible={showProfileViewer}
          onToggle={() => setShowProfileViewer(!showProfileViewer)}
        />
      )}

      {/* Floating Action Button for Profile Viewer */}
      {profile && (
        <button
          onClick={() => setShowProfileViewer(!showProfileViewer)}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-50"
          title="View Profile Data"
        >
          <User className="w-6 h-6" />
        </button>
      )}
    </div>
  )
}

export default LinkedInAuth
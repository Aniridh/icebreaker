import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronDownIcon, 
  ChevronUpIcon,
  UserIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  StarIcon,
  TrophyIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface LinkedInProfile {
  name?: string
  title?: string
  bio?: string
  skills?: string[]
  experience?: WorkExperience[]
  education?: Education[]
  location?: string
  industry?: string
  currentCompany?: string
  currentRole?: string
  yearsOfExperience?: number
  keyAchievements?: string[]
  connections?: number
  followers?: number
  languages?: string[]
  certifications?: string[]
  profileSummary?: string
  careerProgression?: CareerProgression
  skillCategories?: SkillCategory[]
  personalityTraits?: string[]
  communicationStyle?: string
  professionalGoals?: string[]
  industryExpertise?: IndustryExpertise[]
  leadershipStyle?: string
  workPreferences?: WorkPreferences
  achievements?: Achievement[]
  projects?: Project[]
  dataQuality?: DataQuality
  technologyRecommendations?: TechnologyRecommendations
}

interface WorkExperience {
  title: string
  company: string
  duration?: string
  description?: string
  location?: string
  isCurrent?: boolean
}

interface Education {
  school: string
  degree?: string
  field?: string
  startYear?: string
  endYear?: string
  description?: string
}

interface CareerProgression {
  totalYears: number
  careerLevel: 'Entry' | 'Mid' | 'Senior' | 'Executive' | 'C-Level'
  promotionRate: number
  industryChanges: number
  roleTransitions: string[]
  careerGrowthPattern: 'Linear' | 'Lateral' | 'Rapid' | 'Diverse'
  leadershipProgression: boolean
}

interface SkillCategory {
  category: string
  skills: string[]
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
  endorsements?: number
}

interface IndustryExpertise {
  industry: string
  yearsOfExperience: number
  depth: 'Surface' | 'Moderate' | 'Deep' | 'Expert'
  specializations: string[]
}

interface WorkPreferences {
  workStyle: string[]
  teamSize: 'Individual' | 'Small Team' | 'Large Team' | 'Cross-functional'
  communicationPreference: string[]
  workEnvironment: string[]
}

interface Achievement {
  title: string
  description: string
  impact?: string
  metrics?: string
}

interface Project {
  name: string
  description: string
  role: string
  duration?: string
  technologies?: string[]
  outcomes?: string[]
}

interface DataQuality {
  completeness: number
  freshness: string
  accuracy: number
  extractionConfidence: number
  missingFields: string[]
  dataSource: string
  lastUpdated?: string
}

interface TechnologyRecommendations {
  emergingTechnologies: string[]
  skillGaps: string[]
  industryTrends: string[]
  learningPaths: string[]
}

interface ProfileDataViewerProps {
  profile: LinkedInProfile | null
  isVisible: boolean
  onToggle: () => void
}

const ProfileDataViewer: React.FC<ProfileDataViewerProps> = ({ profile, isVisible, onToggle }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']))

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getQualityIcon = (score: number) => {
    if (score >= 80) return <CheckCircleIcon className="w-5 h-5 text-green-400" />
    return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />
  }

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case 'Expert': return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      case 'Advanced': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'Intermediate': return 'bg-green-500/20 text-green-300 border-green-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const getCareerLevelColor = (level: string) => {
    switch (level) {
      case 'C-Level': return 'bg-gradient-to-r from-purple-500 to-pink-500'
      case 'Executive': return 'bg-gradient-to-r from-blue-500 to-purple-500'
      case 'Senior': return 'bg-gradient-to-r from-green-500 to-blue-500'
      case 'Mid': return 'bg-gradient-to-r from-yellow-500 to-green-500'
      default: return 'bg-gradient-to-r from-gray-500 to-yellow-500'
    }
  }

  if (!profile) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : 300 }}
        className="fixed right-0 top-0 h-full w-96 bg-gray-900/95 backdrop-blur-xl border-l border-gray-700/50 z-50"
      >
        <div className="p-6 flex items-center justify-center h-full">
          <div className="text-center">
            <UserIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No profile data available</p>
            <p className="text-sm text-gray-500 mt-2">Upload a LinkedIn profile to see detailed analysis</p>
          </div>
        </div>
      </motion.div>
    )
  }

  const sections = [
    {
      id: 'basic',
      title: 'Basic Information',
      icon: <UserIcon className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {profile.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <h3 className="text-white font-semibold">{profile.name || 'Unknown'}</h3>
              <p className="text-gray-400 text-sm">{profile.title || 'No title'}</p>
            </div>
          </div>
          
          {profile.bio && (
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Bio</h4>
              <p className="text-gray-400 text-sm leading-relaxed">{profile.bio}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            {profile.location && (
              <div className="bg-gray-800/30 rounded-lg p-3">
                <p className="text-xs text-gray-500">Location</p>
                <p className="text-white text-sm">{profile.location}</p>
              </div>
            )}
            {profile.industry && (
              <div className="bg-gray-800/30 rounded-lg p-3">
                <p className="text-xs text-gray-500">Industry</p>
                <p className="text-white text-sm">{profile.industry}</p>
              </div>
            )}
            {profile.yearsOfExperience && (
              <div className="bg-gray-800/30 rounded-lg p-3">
                <p className="text-xs text-gray-500">Experience</p>
                <p className="text-white text-sm">{profile.yearsOfExperience} years</p>
              </div>
            )}
            {profile.connections && (
              <div className="bg-gray-800/30 rounded-lg p-3">
                <p className="text-xs text-gray-500">Connections</p>
                <p className="text-white text-sm">{profile.connections.toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      id: 'career',
      title: 'Career Progression',
      icon: <ChartBarIcon className="w-5 h-5" />,
      content: profile.careerProgression && (
        <div className="space-y-4">
          <div className={`${getCareerLevelColor(profile.careerProgression.careerLevel)} rounded-lg p-4 text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">{profile.careerProgression.careerLevel} Level</h4>
                <p className="text-sm opacity-90">{profile.careerProgression.totalYears} years total experience</p>
              </div>
              <TrophyIcon className="w-8 h-8 opacity-80" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800/50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Growth Pattern</p>
              <p className="text-white text-sm font-medium">{profile.careerProgression.careerGrowthPattern}</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Industry Changes</p>
              <p className="text-white text-sm font-medium">{profile.careerProgression.industryChanges}</p>
            </div>
          </div>
          
          {profile.careerProgression.leadershipProgression && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <StarIcon className="w-4 h-4 text-blue-400" />
                <span className="text-blue-300 text-sm">Leadership Progression Detected</span>
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'skills',
      title: 'Skills & Expertise',
      icon: <StarIcon className="w-5 h-5" />,
      content: profile.skillCategories && (
        <div className="space-y-4">
          {profile.skillCategories.map((category, index) => (
            <div key={index} className="bg-gray-800/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-medium">{category.category}</h4>
                <span className={`px-2 py-1 rounded-full text-xs border ${getProficiencyColor(category.proficiencyLevel)}`}>
                  {category.proficiencyLevel}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {category.skills.map((skill, skillIndex) => (
                  <span key={skillIndex} className="px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-md">
                    {skill}
                  </span>
                ))}
              </div>
              {category.endorsements && (
                <p className="text-xs text-gray-500 mt-2">{category.endorsements} endorsements</p>
              )}
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'experience',
      title: 'Work Experience',
      icon: <BriefcaseIcon className="w-5 h-5" />,
      content: profile.experience && (
        <div className="space-y-4">
          {profile.experience.map((exp, index) => (
            <div key={index} className="bg-gray-800/30 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-white font-medium">{exp.title}</h4>
                  <p className="text-blue-400 text-sm">{exp.company}</p>
                </div>
                {exp.isCurrent && (
                  <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full border border-green-500/30">
                    Current
                  </span>
                )}
              </div>
              {exp.duration && (
                <p className="text-gray-500 text-xs mb-2">{exp.duration}</p>
              )}
              {exp.description && (
                <p className="text-gray-400 text-sm leading-relaxed">{exp.description}</p>
              )}
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'insights',
      title: 'AI Insights',
      icon: <StarIcon className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          {/* Technology Recommendations */}
          {profile.technologyRecommendations && (
            <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-lg p-4 border border-purple-500/20">
              <h4 className="text-white font-medium mb-4 flex items-center">
                <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                Technology Recommendations
              </h4>
              
              {/* Emerging Technologies */}
              {profile.technologyRecommendations.emergingTechnologies.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-purple-300 text-sm font-medium mb-2">🚀 Emerging Technologies</h5>
                  <div className="flex flex-wrap gap-2">
                    {profile.technologyRecommendations.emergingTechnologies.map((tech, index) => (
                      <span key={index} className="px-3 py-1 bg-purple-600/20 text-purple-200 text-xs rounded-full border border-purple-500/30">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Skill Gaps */}
              {profile.technologyRecommendations.skillGaps.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-orange-300 text-sm font-medium mb-2">🎯 Skill Development Areas</h5>
                  <div className="flex flex-wrap gap-2">
                    {profile.technologyRecommendations.skillGaps.map((skill, index) => (
                      <span key={index} className="px-3 py-1 bg-orange-600/20 text-orange-200 text-xs rounded-full border border-orange-500/30">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Industry Trends */}
              {profile.technologyRecommendations.industryTrends.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-green-300 text-sm font-medium mb-2">📈 Industry Trends</h5>
                  <div className="flex flex-wrap gap-2">
                    {profile.technologyRecommendations.industryTrends.map((trend, index) => (
                      <span key={index} className="px-3 py-1 bg-green-600/20 text-green-200 text-xs rounded-full border border-green-500/30">
                        {trend}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Learning Paths */}
              {profile.technologyRecommendations.learningPaths.length > 0 && (
                <div>
                  <h5 className="text-blue-300 text-sm font-medium mb-2">📚 Recommended Learning Paths</h5>
                  <div className="space-y-1">
                    {profile.technologyRecommendations.learningPaths.map((path, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                        <span className="text-blue-200 text-sm">{path}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Existing AI Insights */}
          {profile.personalityTraits && profile.personalityTraits.length > 0 && (
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">Personality Traits</h4>
              <div className="flex flex-wrap gap-2">
                {profile.personalityTraits.map((trait, index) => (
                  <span key={index} className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full border border-purple-500/30">
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {profile.communicationStyle && (
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Communication Style</h4>
              <p className="text-blue-400 text-sm">{profile.communicationStyle}</p>
            </div>
          )}
          
          {profile.leadershipStyle && (
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Leadership Style</h4>
              <p className="text-green-400 text-sm">{profile.leadershipStyle}</p>
            </div>
          )}
          
          {profile.professionalGoals && profile.professionalGoals.length > 0 && (
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">Professional Goals</h4>
              <div className="space-y-2">
                {profile.professionalGoals.map((goal, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-gray-400 text-sm">{goal}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'quality',
      title: 'Data Quality',
      icon: <ClockIcon className="w-5 h-5" />,
      content: profile.dataQuality && (
        <div className="space-y-4">
          <div className="bg-gray-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-medium">Overall Quality</h4>
              {getQualityIcon(profile.dataQuality.completeness)}
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Completeness</span>
                  <span className={getQualityColor(profile.dataQuality.completeness)}>
                    {profile.dataQuality.completeness}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${profile.dataQuality.completeness}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Accuracy</span>
                  <span className={getQualityColor(profile.dataQuality.accuracy)}>
                    {profile.dataQuality.accuracy}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-yellow-500 to-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${profile.dataQuality.accuracy}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Confidence</span>
                  <span className={getQualityColor(profile.dataQuality.extractionConfidence)}>
                    {profile.dataQuality.extractionConfidence}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${profile.dataQuality.extractionConfidence}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-500">
                Data Source: {profile.dataQuality.dataSource}
              </p>
              {profile.dataQuality.lastUpdated && (
                <p className="text-xs text-gray-500">
                  Last Updated: {new Date(profile.dataQuality.lastUpdated).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )
    }
  ]

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 h-full w-96 bg-gray-900/95 backdrop-blur-xl border-l border-gray-700/50 z-50 overflow-hidden"
        >
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-700/50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Profile Analysis</h2>
                <button
                  onClick={onToggle}
                  className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
                >
                  <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              {profile.profileSummary && (
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                  {profile.profileSummary}
                </p>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-4">
                {sections.map((section) => (
                  <div key={section.id} className="bg-gray-800/20 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-gray-800/30 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-blue-400">
                          {section.icon}
                        </div>
                        <span className="text-white font-medium">{section.title}</span>
                      </div>
                      {expandedSections.has(section.id) ? (
                        <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    
                    <AnimatePresence>
                      {expandedSections.has(section.id) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 pt-0">
                            {section.content}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ProfileDataViewer
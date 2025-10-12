/**
 * LinkedIn profile scraper
 * Uses external scraping service for reliable data extraction
 */

import axios from 'axios'

// LinkedIn Profile API configuration
const LINKEDIN_API_KEY = process.env.LINKEDIN_PROFILE_API_KEY || '4c62a082-e285-46ce-980c-ea6dc6901435:sk-ZWEyOTBlYzQtNjM0Yi00ZjVhLWIxNWYtMzY0MjAyMjQyY2M4'
const LINKEDIN_API_ENDPOINT = process.env.LINKEDIN_PROFILE_API_ENDPOINT || 'https://api-bcbe5a.stack.tryrelevance.com/latest/studios/b07cc2be-7398-4196-8fd3-c4e0a33b1d90/trigger_webhook?project=4c62a082-e285-46ce-980c-ea6dc6901435'

interface LinkedInProfile {
  name?: string
  title?: string
  bio?: string
  skills?: string[]
  experience?: WorkExperience[]
  education?: Education[]
  posts?: {
    content: string
    date?: string
    likes?: number
    comments?: number
    hashtags?: string[]
    topics?: string[]
  }[]
  activity?: {
    recentComments?: string[]
    frequentHashtags?: string[]
    engagementPatterns?: string[]
  }
  interests?: {
    industries?: string[]
    technologies?: string[]
    causes?: string[]
    hobbies?: string[]
    professionalInterests?: string[]
  }
  socialSignals?: {
    groups?: string[]
    events?: string[]
    certifications?: string[]
    volunteerWork?: string[]
    courses?: string[]
  }
  // Enhanced fields for better RAG
  location?: string
  industry?: string
  currentCompany?: string
  currentRole?: string
  yearsOfExperience?: number
  keyAchievements?: string[]
  connections?: number
  languages?: string[]
  certifications?: string[]
  volunteerExperience?: VolunteerExperience[]
  recommendations?: number
  profileViews?: number
  // New comprehensive fields
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
  publications?: Publication[]
  patents?: Patent[]
  projects?: Project[]
  speakingEngagements?: SpeakingEngagement[]
  awards?: Award[]
  dataQuality?: DataQuality
  technologyRecommendations?: TechnologyRecommendations
}

interface WorkExperience {
  title: string
  company: string
  duration?: string
  description?: string
  startDate?: string
  endDate?: string
  location?: string
  isCurrent?: boolean
  achievements?: string[]
  skills?: string[]
}

interface Education {
  school: string
  degree?: string
  field?: string
  startYear?: string
  endYear?: string
  description?: string
  achievements?: string[]
  gpa?: string
  activities?: string[]
}

interface VolunteerExperience {
  organization: string
  role: string
  duration?: string
  description?: string
  cause?: string
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
  yearsOfExperience?: number
  endorsements?: number
}

interface IndustryExpertise {
  industry: string
  yearsOfExperience: number
  depth: 'Surface' | 'Moderate' | 'Deep' | 'Expert'
  specializations: string[]
  trends: string[]
}

interface WorkPreferences {
  workStyle: string[]
  teamSize: 'Individual' | 'Small Team' | 'Large Team' | 'Cross-functional'
  managementStyle?: string
  communicationPreference: string[]
  workEnvironment: string[]
}

interface Achievement {
  title: string
  description: string
  date?: string
  impact?: string
  recognition?: string
  metrics?: string
}

interface Publication {
  title: string
  journal?: string
  date?: string
  coAuthors?: string[]
  citations?: number
  topic: string
}

interface Patent {
  title: string
  patentNumber?: string
  date?: string
  description?: string
  inventors?: string[]
}

interface Project {
  name: string
  description: string
  role: string
  duration?: string
  technologies?: string[]
  outcomes?: string[]
  teamSize?: number
  budget?: string
}

interface SpeakingEngagement {
  title: string
  event: string
  date?: string
  topic: string
  audience?: string
  type: 'Conference' | 'Webinar' | 'Workshop' | 'Panel' | 'Keynote'
}

interface Award {
  title: string
  organization: string
  date?: string
  description?: string
  category?: string
}

interface DataQuality {
  completeness: number // 0-100%
  freshness: string // 'Recent' | 'Moderate' | 'Outdated'
  accuracy: number // 0-100%
  extractionConfidence: number // 0-100%
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

/**
 * Analyze career progression from LinkedIn profile data
 */
function analyzeCareerProgression(profile: LinkedInProfile): CareerProgression {
  const experience = profile.experience || []
  
  // Calculate total years from experience array if not already set
  let totalYears = profile.yearsOfExperience || 0
  
  if (totalYears === 0 && experience.length > 0) {
    let totalMonths = 0
    
    for (const exp of experience) {
      if (exp.duration) {
        // Parse duration strings like "1 yr 6 mos", "9 mos", "1 yr", etc.
        let experienceMonths = 0
        
        // Extract years
        const yearMatches = exp.duration.match(/(\d+)\s*yr/gi)
        if (yearMatches) {
          const years = parseInt(yearMatches[0].match(/\d+/)?.[0] || '0')
          experienceMonths += years * 12
        }
        
        // Extract months
        const monthMatches = exp.duration.match(/(\d+)\s*mos?/gi)
        if (monthMatches) {
          const months = parseInt(monthMatches[0].match(/\d+/)?.[0] || '0')
          experienceMonths += months
        }
        
        // If no duration format found, try to parse date ranges
        if (experienceMonths === 0) {
          const dateRangeMatch = exp.duration.match(/(\w{3}\s+\d{4})\s*-\s*(\w{3}\s+\d{4}|Present)/i)
          if (dateRangeMatch) {
            const startDate = new Date(dateRangeMatch[1])
            const endDate = dateRangeMatch[2].toLowerCase() === 'present' ? new Date() : new Date(dateRangeMatch[2])
            
            if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
              const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
              const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44)) // Average days per month
              experienceMonths = diffMonths
            }
          }
        }
        
        totalMonths += experienceMonths
      }
    }
    
    // Convert total months to years (rounded to 1 decimal place)
    totalYears = Math.round((totalMonths / 12) * 10) / 10
  }
  
  // Determine career level based on titles and experience
  const seniorTitles = ['senior', 'lead', 'principal', 'staff', 'architect']
  const executiveTitles = ['director', 'vp', 'vice president', 'head of', 'chief']
  const cLevelTitles = ['ceo', 'cto', 'cfo', 'coo', 'cmo']
  
  const currentTitle = (profile.currentRole || profile.title || '').toLowerCase()
  let careerLevel: CareerProgression['careerLevel'] = 'Entry'
  
  if (cLevelTitles.some(title => currentTitle.includes(title))) {
    careerLevel = 'C-Level'
  } else if (executiveTitles.some(title => currentTitle.includes(title))) {
    careerLevel = 'Executive'
  } else if (seniorTitles.some(title => currentTitle.includes(title)) || totalYears > 7) {
    careerLevel = 'Senior'
  } else if (totalYears > 3) {
    careerLevel = 'Mid'
  }
  
  // Calculate promotion rate and transitions
    const promotionRate = experience.length > 0 ? totalYears / experience.length : 0
    const roleTransitions = experience.map(exp => exp.title)
    const industryChanges = new Set(experience.map(exp => exp.company)).size - 1
  
  // Determine growth pattern
  let careerGrowthPattern: CareerProgression['careerGrowthPattern'] = 'Linear'
  if (promotionRate < 2) careerGrowthPattern = 'Rapid'
  else if (industryChanges > 2) careerGrowthPattern = 'Diverse'
  else if (roleTransitions.some(role => role.toLowerCase().includes('lateral'))) careerGrowthPattern = 'Lateral'
  
  const leadershipProgression = roleTransitions.some(role => 
    ['lead', 'manager', 'director', 'head', 'chief'].some(keyword => 
      role.toLowerCase().includes(keyword)
    )
  )
  
  return {
    totalYears,
    careerLevel,
    promotionRate,
    industryChanges,
    roleTransitions,
    careerGrowthPattern,
    leadershipProgression
  }
}

/**
 * Categorize skills by type and proficiency
 */
function categorizeSkills(profile: LinkedInProfile): SkillCategory[] {
  const skills = profile.skills || []
  const skillCategories: { [key: string]: string[] } = {
    'Programming Languages': [],
    'Frameworks & Libraries': [],
    'Cloud & Infrastructure': [],
    'Databases': [],
    'Tools & Platforms': [],
    'Soft Skills': [],
    'Domain Expertise': []
  }
  
  const categoryMappings = {
    'Programming Languages': ['javascript', 'python', 'java', 'typescript', 'go', 'rust', 'c++', 'c#', 'php', 'ruby', 'swift', 'kotlin'],
    'Frameworks & Libraries': ['react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring', 'laravel', 'rails'],
    'Cloud & Infrastructure': ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'ci/cd'],
    'Databases': ['mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'cassandra', 'dynamodb'],
    'Tools & Platforms': ['git', 'jira', 'confluence', 'slack', 'figma', 'adobe', 'salesforce'],
    'Soft Skills': ['leadership', 'communication', 'teamwork', 'problem solving', 'project management', 'mentoring'],
    'Domain Expertise': ['machine learning', 'data science', 'cybersecurity', 'blockchain', 'iot', 'fintech', 'healthcare']
  }
  
  skills.forEach(skill => {
    const skillLower = skill.toLowerCase()
    let categorized = false
    
    for (const [category, keywords] of Object.entries(categoryMappings)) {
      if (keywords.some(keyword => skillLower.includes(keyword))) {
        skillCategories[category].push(skill)
        categorized = true
        break
      }
    }
    
    if (!categorized) {
      skillCategories['Domain Expertise'].push(skill)
    }
  })
  
  return Object.entries(skillCategories)
    .filter(([_, skills]) => skills.length > 0)
    .map(([category, skills]) => ({
      category,
      skills,
      proficiencyLevel: skills.length > 5 ? 'Expert' : skills.length > 3 ? 'Advanced' : 'Intermediate' as SkillCategory['proficiencyLevel'],
      endorsements: Math.floor(Math.random() * 50) + 10 // Mock endorsements
    }))
}

/**
 * Analyze industry expertise
 */
function analyzeIndustryExpertise(profile: LinkedInProfile): IndustryExpertise[] {
  const experience = profile.experience || []
  const industryMap: { [key: string]: { years: number, companies: Set<string> } } = {}
  
  experience.forEach(exp => {
    const industry = profile.industry || 'Technology' // Default fallback
    if (!industryMap[industry]) {
      industryMap[industry] = { years: 0, companies: new Set() }
    }
    
    // Estimate years from duration string
    const duration = exp.duration || ''
    const yearMatch = duration.match(/(\d+)\s*year/i)
    const years = yearMatch ? parseInt(yearMatch[1]) : 2 // Default 2 years
    
    industryMap[industry].years += years
    industryMap[industry].companies.add(exp.company)
  })
  
  return Object.entries(industryMap).map(([industry, data]) => ({
    industry,
    yearsOfExperience: data.years,
    depth: data.years > 10 ? 'Expert' : data.years > 5 ? 'Deep' : data.years > 2 ? 'Moderate' : 'Surface' as IndustryExpertise['depth'],
    specializations: profile.skills?.slice(0, 5) || [],
    trends: ['AI/ML', 'Cloud Computing', 'Remote Work', 'Sustainability'] // Mock trends
  }))
}

/**
 * Infer personality traits and communication style
 */
function inferPersonalityTraits(profile: LinkedInProfile): { traits: string[], communicationStyle: string } {
  const bio = profile.bio || ''
  const traits: string[] = []
  let communicationStyle = 'Professional'
  
  // Analyze bio for personality indicators
  if (bio.toLowerCase().includes('passionate') || bio.toLowerCase().includes('enthusiastic')) {
    traits.push('Passionate')
  }
  if (bio.toLowerCase().includes('lead') || bio.toLowerCase().includes('mentor')) {
    traits.push('Leadership-oriented')
  }
  if (bio.toLowerCase().includes('innovative') || bio.toLowerCase().includes('creative')) {
    traits.push('Innovative')
  }
  if (bio.toLowerCase().includes('collaborative') || bio.toLowerCase().includes('team')) {
    traits.push('Collaborative')
  }
  if (bio.toLowerCase().includes('analytical') || bio.toLowerCase().includes('data')) {
    traits.push('Analytical')
  }
  
  // Determine communication style
  if (bio.length > 200) {
    communicationStyle = 'Detailed'
  } else if (bio.includes('!') || bio.includes('excited')) {
    communicationStyle = 'Enthusiastic'
  } else if (bio.includes('results') || bio.includes('metrics')) {
    communicationStyle = 'Results-focused'
  }
  
  return { traits, communicationStyle }
}

/**
 * Generate comprehensive profile summary
 */
function generateProfileSummary(profile: LinkedInProfile): string {
  const name = profile.name || 'Professional'
  const title = profile.currentRole || profile.title || 'Professional'
  const company = profile.currentCompany || 'their current organization'
  const years = profile.yearsOfExperience || 0
  const skills = profile.skills?.slice(0, 3).join(', ') || 'various technologies'
  
  return `${name} is a ${title} at ${company} with ${years} years of experience. They specialize in ${skills} and have demonstrated expertise across multiple roles and organizations. Their professional journey shows strong growth in technical capabilities and leadership responsibilities.`
}

/**
 * Assess data quality and completeness
 */
function assessDataQuality(profile: LinkedInProfile): DataQuality {
  const fields = [
    'name', 'title', 'bio', 'skills', 'experience', 'education',
    'location', 'industry', 'currentCompany', 'currentRole'
  ]
  
  const presentFields = fields.filter(field => profile[field as keyof LinkedInProfile])
  const completeness = Math.round((presentFields.length / fields.length) * 100)
  
  const missingFields = fields.filter(field => !profile[field as keyof LinkedInProfile])
  
  return {
    completeness,
    freshness: 'Recent', // Mock - would be determined by scraping timestamp
    accuracy: 85, // Mock - would be determined by validation
    extractionConfidence: 90, // Mock - would be determined by scraping success
    missingFields,
    dataSource: 'LinkedIn Profile',
    lastUpdated: new Date().toISOString()
  }
}

/**
 * Scrape LinkedIn profile data using external scraping service
 */
export async function scrapeLinkedInProfile(url: string): Promise<LinkedInProfile> {
  console.log(`Starting LinkedIn profile data extraction for: ${url}`)
  
  try {
    // Use LinkedIn Profile API
    console.log('Attempting LinkedIn Profile API...')
    const profile = await scrapeWithExternalService(url)
    if (profile.name || profile.title || profile.bio || (profile.skills && profile.skills.length > 0)) {
      console.log('LinkedIn Profile API successful:', profile)
      
      // Enhance profile with comprehensive analysis
      const careerProgression = analyzeCareerProgression(profile)
      const skillCategories = categorizeSkills(profile)
      const industryExpertise = analyzeIndustryExpertise(profile)
      const { traits, communicationStyle } = inferPersonalityTraits(profile)
      const profileSummary = generateProfileSummary(profile)
      const dataQuality = assessDataQuality(profile)
      
      const technologyRecommendations = generateTechnologyRecommendations(profile)
      
      const enhancedProfile: LinkedInProfile = {
        ...profile,
        profileSummary,
        careerProgression,
        skillCategories,
        personalityTraits: traits,
        communicationStyle,
        professionalGoals: ["Technical Leadership", "Team Building", "Innovation", "Mentoring"],
        industryExpertise,
        leadershipStyle: "Collaborative and Mentoring-focused",
        workPreferences: {
          workStyle: ["Collaborative", "Agile", "Remote-friendly"],
          teamSize: "Small Team",
          communicationPreference: ["Direct", "Regular check-ins", "Documentation"],
          workEnvironment: ["Flexible", "Innovation-focused", "Learning-oriented"]
        },
        achievements: profile.keyAchievements?.map(achievement => ({
          title: achievement,
          description: achievement,
          impact: "Positive impact on team and organization",
          metrics: "Quantifiable results achieved"
        })) || [],
        dataQuality,
        technologyRecommendations
      }
      
      return enhancedProfile
    }
    console.log('LinkedIn Profile API returned empty profile')
  } catch (error) {
    console.error('LinkedIn Profile API failed with error:', error)
  }

  // If API fails, return basic extracted info from URL
  console.log('Data extraction failed, using URL fallback')
  return extractBasicInfoFromUrl(url)
}

/**
 * Fetch LinkedIn profile using the new API
 */
async function scrapeWithExternalService(url: string): Promise<LinkedInProfile> {
  try {
    console.log('Making request to LinkedIn Profile API...')
    console.log('API Endpoint:', process.env.LINKEDIN_PROFILE_API_ENDPOINT)
    console.log('API Key (first 10 chars):', process.env.LINKEDIN_PROFILE_API_KEY?.substring(0, 10))
    
    const response = await axios.post(
      process.env.LINKEDIN_PROFILE_API_ENDPOINT!,
      {
        linkedin_url: url,
        output_format: "JSON"
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': process.env.LINKEDIN_PROFILE_API_KEY!
        }
      }
    )

    console.log('LinkedIn Profile API response status:', response.status)
    console.log('LinkedIn Profile API response data:', JSON.stringify(response.data, null, 2))
    
    // Check if we have valid data
    if (response.data && response.data.output) {
      console.log('Profile data to transform:', typeof response.data.output, response.data.output)
      return transformApiResponse(response.data.output)
    } else if (response.data) {
      console.log('Profile data to transform:', typeof response.data, response.data)
      return transformApiResponse(response.data)
    } else {
      console.log('No data returned from LinkedIn Profile API, falling back to URL extraction')
      return null
    }
} catch (error: any) {
    console.error('LinkedIn Profile API error:', error.response?.data || error.message)
    console.error('Full error:', error)
    throw error
  }
}

/**
 * Transform API response to LinkedInProfile format with enhanced data extraction
 */
function transformApiResponse(data: any): LinkedInProfile {
  const profile: LinkedInProfile = {}

  // The API returns data as a string, so we need to parse it
  let parsedData = data
  if (typeof data === 'string') {
    // Try to parse as structured data
    try {
      // The data appears to be in a markdown-like format, let's extract key information
      const lines = data.split('\n')
      parsedData = {}
      
      // Extract basic info
      for (const line of lines) {
        if (line.includes('first_name:')) {
          parsedData.first_name = line.split('first_name:')[1]?.trim()
        }
        if (line.includes('last_name:')) {
          parsedData.last_name = line.split('last_name:')[1]?.trim()
        }
        if (line.includes('full_name:')) {
          parsedData.full_name = line.split('full_name:')[1]?.trim()
        }
        if (line.includes('headline:')) {
          parsedData.headline = line.split('headline:')[1]?.trim()
        }
        if (line.includes('about:')) {
          parsedData.about = line.split('about:')[1]?.trim()
        }
        if (line.includes('location:')) {
          parsedData.location = line.split('location:')[1]?.trim()
        }
        if (line.includes('industry:')) {
          parsedData.industry = line.split('industry:')[1]?.trim()
        }
        if (line.includes('connections:')) {
          const connectionsStr = line.split('connections:')[1]?.trim()
          parsedData.connections = parseInt(connectionsStr) || 0
        }
      }
      
      // Extract experiences with enhanced details
      const experienceSection = data.match(/## experiences([\s\S]*?)(?=##|$)/)?.[1]
      if (experienceSection) {
        parsedData.experiences = []
        const expBlocks = experienceSection.split('  *').filter(block => block.trim())
        
        for (const block of expBlocks) {
          const exp: WorkExperience = {
            title: '',
            company: ''
          }
          const expLines = block.split('\n')
          
          for (const line of expLines) {
            if (line.includes('title:')) {
              exp.title = line.split('title:')[1]?.trim() || ''
            }
            if (line.includes('company:')) {
              exp.company = line.split('company:')[1]?.trim() || ''
            }
            if (line.includes('description:')) {
              exp.description = line.split('description:')[1]?.trim()
            }
            if (line.includes('date_range:')) {
              exp.duration = line.split('date_range:')[1]?.trim()
              // Check if it's current position
              exp.isCurrent = exp.duration?.toLowerCase().includes('present') || 
                             exp.duration?.toLowerCase().includes('current') || false
            }
            if (line.includes('location:')) {
              exp.location = line.split('location:')[1]?.trim()
            }
          }
          
          if (exp.title || exp.company) {
            parsedData.experiences.push(exp)
          }
        }
      }

      // Extract education with enhanced details
      const educationSection = data.match(/## education([\s\S]*?)(?=##|$)/)?.[1]
      if (educationSection) {
        parsedData.education = []
        const eduBlocks = educationSection.split('  *').filter(block => block.trim())
        
        for (const block of eduBlocks) {
          const edu: Education = {
            school: ''
          }
          const eduLines = block.split('\n')
          
          for (const line of eduLines) {
            if (line.includes('school:')) {
              edu.school = line.split('school:')[1]?.trim() || ''
            }
            if (line.includes('degree:')) {
              edu.degree = line.split('degree:')[1]?.trim()
            }
            if (line.includes('field:') || line.includes('field_of_study:')) {
              edu.field = line.split(/field:|field_of_study:/)[1]?.trim()
            }
            if (line.includes('start_year:')) {
              edu.startYear = line.split('start_year:')[1]?.trim()
            }
            if (line.includes('end_year:')) {
              edu.endYear = line.split('end_year:')[1]?.trim()
            }
            if (line.includes('description:')) {
              edu.description = line.split('description:')[1]?.trim()
            }
            if (line.includes('activities:')) {
              const activitiesStr = line.split('activities:')[1]?.trim()
              edu.activities = activitiesStr ? activitiesStr.split(',').map(a => a.trim()) : []
            }
          }
          
          if (edu.school) {
            parsedData.education.push(edu)
          }
        }
      }

      // Extract skills
      const skillsSection = data.match(/## skills([\s\S]*?)(?=##|$)/)?.[1]
      if (skillsSection) {
        const skillLines = skillsSection.split('\n').filter(line => line.trim() && !line.includes('##'))
        parsedData.skills = skillLines.map(line => line.replace(/^\s*[-*]\s*/, '').trim()).filter(Boolean)
      }

      // Extract certifications
      const certificationsSection = data.match(/## certifications([\s\S]*?)(?=##|$)/)?.[1]
      if (certificationsSection) {
        const certLines = certificationsSection.split('\n').filter(line => line.trim() && !line.includes('##'))
        parsedData.certifications = certLines.map(line => line.replace(/^\s*[-*]\s*/, '').trim()).filter(Boolean)
      }

      // Extract volunteer experience
      const volunteerSection = data.match(/## volunteer([\s\S]*?)(?=##|$)/)?.[1]
      if (volunteerSection) {
        parsedData.volunteerExperience = []
        const volBlocks = volunteerSection.split('  *').filter(block => block.trim())
        
        for (const block of volBlocks) {
          const vol: VolunteerExperience = {
            organization: '',
            role: ''
          }
          const volLines = block.split('\n')
          
          for (const line of volLines) {
            if (line.includes('organization:')) {
              vol.organization = line.split('organization:')[1]?.trim() || ''
            }
            if (line.includes('role:')) {
              vol.role = line.split('role:')[1]?.trim() || ''
            }
            if (line.includes('duration:')) {
              vol.duration = line.split('duration:')[1]?.trim()
            }
            if (line.includes('description:')) {
              vol.description = line.split('description:')[1]?.trim()
            }
            if (line.includes('cause:')) {
              vol.cause = line.split('cause:')[1]?.trim()
            }
          }
          
          if (vol.organization || vol.role) {
            parsedData.volunteerExperience.push(vol)
          }
        }
      }

      // Extract languages
      const languagesSection = data.match(/## languages([\s\S]*?)(?=##|$)/)?.[1]
      if (languagesSection) {
        const langLines = languagesSection.split('\n').filter(line => line.trim() && !line.includes('##'))
        parsedData.languages = langLines.map(line => line.replace(/^\s*[-*]\s*/, '').trim()).filter(Boolean)
      }

    } catch (error) {
      console.error('Error parsing API response:', error)
    }
  }

  // Extract basic profile information
  if (parsedData.first_name && parsedData.last_name) {
    profile.name = `${parsedData.first_name} ${parsedData.last_name}`.trim()
  } else if (parsedData.full_name) {
    profile.name = parsedData.full_name
  }

  if (parsedData.headline) {
    profile.title = parsedData.headline
  }

  if (parsedData.about) {
    profile.bio = parsedData.about
  }

  // Enhanced profile fields
  if (parsedData.location) {
    profile.location = parsedData.location
  }

  if (parsedData.industry) {
    profile.industry = parsedData.industry
  }

  if (parsedData.connections) {
    profile.connections = parsedData.connections
  }

  // Extract current company and role from most recent experience
  if (parsedData.experiences && parsedData.experiences.length > 0) {
    const currentExp = parsedData.experiences.find((exp: WorkExperience) => exp.isCurrent) || parsedData.experiences[0]
    if (currentExp) {
      profile.currentCompany = currentExp.company
      profile.currentRole = currentExp.title
    }
    profile.experience = parsedData.experiences
  }

  // Calculate years of experience
  if (parsedData.experiences && parsedData.experiences.length > 0) {
    let totalMonths = 0
    
    for (const exp of parsedData.experiences) {
      if (exp.duration) {
        // Parse duration strings like "1 yr 6 mos", "9 mos", "1 yr", etc.
        let experienceMonths = 0
        
        // Extract years
        const yearMatches = exp.duration.match(/(\d+)\s*yr/gi)
        if (yearMatches) {
          const years = parseInt(yearMatches[0].match(/\d+/)?.[0] || '0')
          experienceMonths += years * 12
        }
        
        // Extract months
        const monthMatches = exp.duration.match(/(\d+)\s*mos?/gi)
        if (monthMatches) {
          const months = parseInt(monthMatches[0].match(/\d+/)?.[0] || '0')
          experienceMonths += months
        }
        
        // If no duration format found, try to parse date ranges
        if (experienceMonths === 0) {
          const dateRangeMatch = exp.duration.match(/(\w{3}\s+\d{4})\s*-\s*(\w{3}\s+\d{4}|Present)/i)
          if (dateRangeMatch) {
            const startDate = new Date(dateRangeMatch[1])
            const endDate = dateRangeMatch[2].toLowerCase() === 'present' ? new Date() : new Date(dateRangeMatch[2])
            
            if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
              const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
              const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44)) // Average days per month
              experienceMonths = diffMonths
            }
          }
        }
        
        totalMonths += experienceMonths
      }
    }
    
    // Convert total months to years (rounded to 1 decimal place)
    profile.yearsOfExperience = Math.round((totalMonths / 12) * 10) / 10
  }

  // Extract education
  if (parsedData.education && Array.isArray(parsedData.education)) {
    profile.education = parsedData.education
  }

  // Extract skills
  if (parsedData.skills && Array.isArray(parsedData.skills)) {
    profile.skills = parsedData.skills
  }

  // Extract certifications
  if (parsedData.certifications && Array.isArray(parsedData.certifications)) {
    profile.certifications = parsedData.certifications
  }

  // Extract volunteer experience
  if (parsedData.volunteerExperience && Array.isArray(parsedData.volunteerExperience)) {
    profile.volunteerExperience = parsedData.volunteerExperience
  }

  // Extract languages
  if (parsedData.languages && Array.isArray(parsedData.languages)) {
    profile.languages = parsedData.languages
  }

  // Initialize other fields with empty arrays/objects
  profile.posts = []
  profile.activity = {
    recentComments: [],
    frequentHashtags: [],
    engagementPatterns: []
  }
  profile.interests = {
    industries: [],
    technologies: [],
    causes: [],
    hobbies: [],
    professionalInterests: []
  }
  profile.socialSignals = {
    groups: [],
    events: [],
    certifications: profile.certifications || [],
    volunteerWork: profile.volunteerExperience?.map(v => v.organization) || [],
    courses: []
  }

  console.log('Enhanced profile transformation complete:', {
    name: profile.name,
    title: profile.title,
    currentCompany: profile.currentCompany,
    experienceCount: profile.experience?.length || 0,
    educationCount: profile.education?.length || 0,
    skillsCount: profile.skills?.length || 0,
    certificationsCount: profile.certifications?.length || 0,
    volunteerCount: profile.volunteerExperience?.length || 0
  })

  return profile
}

/**
 * Extract basic info from LinkedIn URL as fallback
 */
function extractBasicInfoFromUrl(url: string): LinkedInProfile {
  console.log('Extracting basic info from LinkedIn URL as fallback - data extraction failed')
  
  // Try to extract username from URL
  const usernameMatch = url.match(/linkedin\.com\/in\/([^\/\?]+)/)
  const username = usernameMatch ? usernameMatch[1] : 'Unknown'
  
  return {
    name: username.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    title: 'Unable to extract profile data - LinkedIn may be blocking data extraction',
    bio: '',
    skills: [],
    experience: [],
    education: [],
    posts: [],
    activity: {},
    interests: {
      industries: [],
      technologies: [],
      causes: [],
      hobbies: [],
      professionalInterests: []
    },
    socialSignals: {
      groups: [],
      events: [],
      certifications: [],
      volunteerWork: [],
      courses: []
    }
  }
}

/**
 * Generate technology recommendations based on profile analysis
 */
function generateTechnologyRecommendations(profile: LinkedInProfile): {
  emergingTechnologies: string[]
  skillGaps: string[]
  industryTrends: string[]
  learningPaths: string[]
} {
  const currentSkills = profile.skills || []
  const experience = profile.experience || []
  const industry = profile.industry || ''
  const currentRole = profile.currentRole || profile.title || ''
  
  // Analyze current tech stack and role
  const techStack = currentSkills.filter(skill => 
    skill.toLowerCase().includes('javascript') ||
    skill.toLowerCase().includes('python') ||
    skill.toLowerCase().includes('react') ||
    skill.toLowerCase().includes('node') ||
    skill.toLowerCase().includes('aws') ||
    skill.toLowerCase().includes('docker') ||
    skill.toLowerCase().includes('kubernetes') ||
    skill.toLowerCase().includes('typescript') ||
    skill.toLowerCase().includes('sql') ||
    skill.toLowerCase().includes('mongodb') ||
    skill.toLowerCase().includes('redis') ||
    skill.toLowerCase().includes('graphql') ||
    skill.toLowerCase().includes('microservices')
  )
  
  const isManager = currentRole.toLowerCase().includes('manager') || 
                   currentRole.toLowerCase().includes('lead') ||
                   currentRole.toLowerCase().includes('director') ||
                   currentRole.toLowerCase().includes('vp')
  
  const isTechnical = currentRole.toLowerCase().includes('engineer') ||
                     currentRole.toLowerCase().includes('developer') ||
                     currentRole.toLowerCase().includes('architect') ||
                     currentRole.toLowerCase().includes('devops')
  
  const isProduct = currentRole.toLowerCase().includes('product') ||
                   currentRole.toLowerCase().includes('pm')
  
  const isData = currentRole.toLowerCase().includes('data') ||
                currentRole.toLowerCase().includes('analytics') ||
                currentRole.toLowerCase().includes('ml') ||
                currentRole.toLowerCase().includes('ai')
  
  // Generate recommendations based on role and current skills
  let emergingTechnologies: string[] = []
  let skillGaps: string[] = []
  let industryTrends: string[] = []
  let learningPaths: string[] = []
  
  // AI/ML recommendations (hot trend for all roles)
  if (!currentSkills.some(skill => skill.toLowerCase().includes('ai') || skill.toLowerCase().includes('ml'))) {
    emergingTechnologies.push('Large Language Models (LLMs)', 'Generative AI', 'Machine Learning')
    learningPaths.push('AI/ML Fundamentals', 'Prompt Engineering')
  }
  
  // Cloud and DevOps (essential for modern development)
  if (!currentSkills.some(skill => skill.toLowerCase().includes('aws') || skill.toLowerCase().includes('azure') || skill.toLowerCase().includes('gcp'))) {
    emergingTechnologies.push('Cloud Computing (AWS/Azure)', 'Infrastructure as Code')
    skillGaps.push('Cloud Architecture', 'DevOps Practices')
  }
  
  // Role-specific recommendations
  if (isTechnical) {
    if (!currentSkills.some(skill => skill.toLowerCase().includes('typescript'))) {
      skillGaps.push('TypeScript', 'Modern JavaScript (ES6+)')
    }
    if (!currentSkills.some(skill => skill.toLowerCase().includes('docker'))) {
      emergingTechnologies.push('Containerization (Docker/Kubernetes)')
    }
    if (!currentSkills.some(skill => skill.toLowerCase().includes('graphql'))) {
      emergingTechnologies.push('GraphQL', 'API Design')
    }
    industryTrends.push('Microservices Architecture', 'Serverless Computing', 'Edge Computing')
    learningPaths.push('System Design', 'Distributed Systems', 'Performance Optimization')
  }
  
  if (isManager) {
    emergingTechnologies.push('AI-Powered Development Tools', 'Low-Code/No-Code Platforms')
    industryTrends.push('Engineering Management', 'Team Productivity Tools', 'Agile at Scale')
    learningPaths.push('Technical Leadership', 'Engineering Strategy', 'Data-Driven Decision Making')
    skillGaps.push('Technical Vision', 'Cross-functional Collaboration')
  }
  
  if (isProduct) {
    emergingTechnologies.push('Product Analytics AI', 'User Behavior Analysis')
    industryTrends.push('Product-Led Growth', 'Customer Success Platforms', 'A/B Testing Tools')
    learningPaths.push('Data-Driven Product Management', 'User Research Methods', 'Growth Hacking')
    skillGaps.push('Technical Product Skills', 'Analytics Interpretation')
  }
  
  if (isData) {
    emergingTechnologies.push('MLOps', 'Real-time Analytics', 'Vector Databases')
    industryTrends.push('Streaming Data Processing', 'Data Mesh Architecture', 'Privacy-Preserving ML')
    learningPaths.push('Advanced Statistics', 'Deep Learning', 'Data Engineering')
    skillGaps.push('Production ML Systems', 'Data Governance')
  }
  
  // Industry-specific trends
  if (industry.toLowerCase().includes('fintech') || industry.toLowerCase().includes('finance')) {
    industryTrends.push('Blockchain Technology', 'Regulatory Technology (RegTech)', 'Digital Banking')
    emergingTechnologies.push('Cryptocurrency', 'DeFi Protocols', 'Payment Systems')
  }
  
  if (industry.toLowerCase().includes('healthcare') || industry.toLowerCase().includes('health')) {
    industryTrends.push('Digital Health', 'Telemedicine Platforms', 'Health Data Analytics')
    emergingTechnologies.push('FHIR Standards', 'Medical AI', 'IoT in Healthcare')
  }
  
  if (industry.toLowerCase().includes('ecommerce') || industry.toLowerCase().includes('retail')) {
    industryTrends.push('Headless Commerce', 'Personalization Engines', 'Supply Chain Tech')
    emergingTechnologies.push('AR/VR Shopping', 'Voice Commerce', 'Social Commerce')
  }
  
  // Ensure we have meaningful recommendations
  if (emergingTechnologies.length === 0) {
    emergingTechnologies = ['Artificial Intelligence', 'Cloud Computing', 'Cybersecurity', 'Blockchain']
  }
  
  if (industryTrends.length === 0) {
    industryTrends = ['Digital Transformation', 'Remote Work Technologies', 'Automation', 'Sustainability Tech']
  }
  
  if (learningPaths.length === 0) {
    learningPaths = ['Leadership Development', 'Technical Skills Enhancement', 'Industry Certifications']
  }
  
  if (skillGaps.length === 0) {
    skillGaps = ['Cross-functional Collaboration', 'Strategic Thinking', 'Communication Skills']
  }
  
  return {
    emergingTechnologies: emergingTechnologies.slice(0, 4),
    skillGaps: skillGaps.slice(0, 3),
    industryTrends: industryTrends.slice(0, 4),
    learningPaths: learningPaths.slice(0, 3)
  }
}
/**
 * RAG-based Profile Analysis Service
 * Analyzes LinkedIn profile data to create structured context for personalized icebreaker generation
 */

interface ProfileContext {
  personalInfo: PersonalContext
  professionalJourney: ProfessionalJourney
  expertise: ExpertiseContext
  interests: InterestContext
  conversationTopics: ConversationTopic[]
  networkingOpportunities: NetworkingOpportunity[]
}

interface PersonalContext {
  name: string
  currentRole: string
  currentCompany: string
  location?: string
  industry?: string
  yearsOfExperience?: number
  careerLevel: 'entry' | 'mid' | 'senior' | 'executive'
}

interface ProfessionalJourney {
  careerProgression: CareerStep[]
  keyTransitions: CareerTransition[]
  industryExperience: string[]
  companyTypes: string[]
  roleTypes: string[]
}

interface CareerStep {
  title: string
  company: string
  duration?: string
  isCurrent: boolean
  significance: 'high' | 'medium' | 'low'
}

interface CareerTransition {
  from: string
  to: string
  type: 'promotion' | 'career_change' | 'industry_switch' | 'company_change'
  significance: string
}

interface ExpertiseContext {
  coreSkills: string[]
  technicalSkills: string[]
  industryKnowledge: string[]
  certifications: string[]
  specializations: string[]
}

interface InterestContext {
  professionalInterests: string[]
  volunteerCauses: string[]
  educationalBackground: string[]
  languages: string[]
  likelyTopics: string[]
}

interface ConversationTopic {
  topic: string
  relevance: 'high' | 'medium' | 'low'
  context: string
  suggestedApproach: string
}

interface NetworkingOpportunity {
  type: 'shared_experience' | 'industry_connection' | 'skill_synergy' | 'educational_background' | 'career_advice'
  description: string
  confidence: 'high' | 'medium' | 'low'
}

/**
 * Analyze LinkedIn profile and create structured context for RAG-based icebreaker generation
 */
export function analyzeProfileForRAG(profile: any): ProfileContext {
  console.log('Starting RAG-based profile analysis...')
  
  const personalInfo = extractPersonalContext(profile)
  const professionalJourney = analyzeProfessionalJourney(profile)
  const expertise = extractExpertiseContext(profile)
  const interests = extractInterestContext(profile)
  const conversationTopics = generateConversationTopics(profile, personalInfo, professionalJourney, expertise)
  const networkingOpportunities = identifyNetworkingOpportunities(profile, personalInfo, professionalJourney, expertise)

  const context: ProfileContext = {
    personalInfo,
    professionalJourney,
    expertise,
    interests,
    conversationTopics,
    networkingOpportunities
  }

  console.log('RAG profile analysis complete:', {
    careerLevel: personalInfo.careerLevel,
    experienceYears: personalInfo.yearsOfExperience,
    conversationTopicsCount: conversationTopics.length,
    networkingOpportunitiesCount: networkingOpportunities.length
  })

  return context
}

/**
 * Extract personal context information
 */
function extractPersonalContext(profile: any): PersonalContext {
  const yearsOfExperience = profile.yearsOfExperience || calculateExperienceYears(profile.experience)
  
  return {
    name: profile.name || 'Professional',
    currentRole: profile.currentRole || profile.title || 'Professional',
    currentCompany: profile.currentCompany || 'Current Company',
    location: profile.location,
    industry: profile.industry,
    yearsOfExperience,
    careerLevel: determineCareerLevel(yearsOfExperience, profile.experience)
  }
}

/**
 * Analyze professional journey and career progression
 */
function analyzeProfessionalJourney(profile: any): ProfessionalJourney {
  const experience = profile.experience || []
  
  const careerProgression: CareerStep[] = experience.map((exp: any, index: number) => ({
    title: exp.title || 'Position',
    company: exp.company || 'Company',
    duration: exp.duration,
    isCurrent: exp.isCurrent || index === 0,
    significance: determineRoleSignificance(exp, index)
  }))

  const keyTransitions = identifyCareerTransitions(experience)
  const industryExperience = extractIndustries(experience)
  const companyTypes = categorizeCompanies(experience)
  const roleTypes = categorizeRoles(experience)

  return {
    careerProgression,
    keyTransitions,
    industryExperience,
    companyTypes,
    roleTypes
  }
}

/**
 * Extract expertise and skills context
 */
function extractExpertiseContext(profile: any): ExpertiseContext {
  const skills = profile.skills || []
  const certifications = profile.certifications || []
  
  return {
    coreSkills: identifyCoreSkills(skills),
    technicalSkills: identifyTechnicalSkills(skills),
    industryKnowledge: extractIndustryKnowledge(profile),
    certifications,
    specializations: identifySpecializations(profile)
  }
}

/**
 * Extract interests and personal context
 */
function extractInterestContext(profile: any): InterestContext {
  const education = profile.education || []
  const volunteerExperience = profile.volunteerExperience || []
  
  return {
    professionalInterests: extractProfessionalInterests(profile),
    volunteerCauses: volunteerExperience.map((v: any) => v.cause || v.organization).filter(Boolean),
    educationalBackground: education.map((e: any) => `${e.degree} from ${e.school}`).filter(Boolean),
    languages: profile.languages || [],
    likelyTopics: generateLikelyTopics(profile)
  }
}

/**
 * Generate conversation topics based on profile analysis
 */
function generateConversationTopics(
  profile: any, 
  personalInfo: PersonalContext, 
  professionalJourney: ProfessionalJourney, 
  expertise: ExpertiseContext
): ConversationTopic[] {
  const topics: ConversationTopic[] = []

  // Current role and company topics
  if (personalInfo.currentRole && personalInfo.currentCompany) {
    topics.push({
      topic: `Current role at ${personalInfo.currentCompany}`,
      relevance: 'high',
      context: `${personalInfo.name} is currently working as ${personalInfo.currentRole} at ${personalInfo.currentCompany}`,
      suggestedApproach: `Ask about their experience in their current role or recent projects at ${personalInfo.currentCompany}`
    })
  }

  // Industry expertise topics
  if (personalInfo.industry) {
    topics.push({
      topic: `${personalInfo.industry} industry insights`,
      relevance: 'high',
      context: `Professional with ${personalInfo.yearsOfExperience || 'several'} years in ${personalInfo.industry}`,
      suggestedApproach: `Discuss industry trends, challenges, or opportunities in ${personalInfo.industry}`
    })
  }

  // Career transition topics
  professionalJourney.keyTransitions.forEach(transition => {
    if (transition.significance) {
      topics.push({
        topic: `Career transition: ${transition.from} to ${transition.to}`,
        relevance: 'medium',
        context: transition.significance,
        suggestedApproach: `Ask about their experience transitioning from ${transition.from} to ${transition.to}`
      })
    }
  })

  // Technical skills topics
  if (expertise.technicalSkills.length > 0) {
    topics.push({
      topic: `Technical expertise in ${expertise.technicalSkills.slice(0, 3).join(', ')}`,
      relevance: 'medium',
      context: `Skilled in ${expertise.technicalSkills.join(', ')}`,
      suggestedApproach: `Discuss technical challenges, tools, or best practices in their area of expertise`
    })
  }

  // Education topics
  const education = profile.education || []
  if (education.length > 0) {
    const primaryEducation = education[0]
    topics.push({
      topic: `Educational background at ${primaryEducation.school}`,
      relevance: 'low',
      context: `Studied ${primaryEducation.degree || 'at'} ${primaryEducation.school}`,
      suggestedApproach: `Mention shared educational experiences or ask about their time at ${primaryEducation.school}`
    })
  }

  return topics.sort((a, b) => {
    const relevanceOrder = { high: 3, medium: 2, low: 1 }
    return relevanceOrder[b.relevance] - relevanceOrder[a.relevance]
  })
}

/**
 * Identify networking opportunities based on profile analysis
 */
function identifyNetworkingOpportunities(
  profile: any,
  personalInfo: PersonalContext,
  professionalJourney: ProfessionalJourney,
  expertise: ExpertiseContext
): NetworkingOpportunity[] {
  const opportunities: NetworkingOpportunity[] = []

  // Industry connection opportunities
  if (personalInfo.industry) {
    opportunities.push({
      type: 'industry_connection',
      description: `Connect over shared ${personalInfo.industry} industry experience`,
      confidence: 'high'
    })
  }

  // Skill synergy opportunities
  if (expertise.coreSkills.length > 0) {
    opportunities.push({
      type: 'skill_synergy',
      description: `Potential collaboration in ${expertise.coreSkills.slice(0, 2).join(' and ')}`,
      confidence: 'medium'
    })
  }

  // Career advice opportunities
  if (personalInfo.careerLevel === 'senior' || personalInfo.careerLevel === 'executive') {
    opportunities.push({
      type: 'career_advice',
      description: `Seek insights from their ${personalInfo.yearsOfExperience}+ years of experience`,
      confidence: 'high'
    })
  }

  // Educational background opportunities
  const education = profile.education || []
  if (education.length > 0) {
    opportunities.push({
      type: 'educational_background',
      description: `Connect over shared educational experiences or alma mater`,
      confidence: 'low'
    })
  }

  return opportunities
}

// Helper functions
function calculateExperienceYears(experience: any[]): number {
  if (!experience || experience.length === 0) return 0
  
  let totalMonths = 0
  
  experience.forEach(exp => {
    if (exp.duration) {
      let months = 0
      
      // Handle duration strings like "1 yr 6 mos", "2 years", "9 mos"
      const yearMatch = exp.duration.match(/(\d+)\s*(?:yr|year)s?/i)
      const monthMatch = exp.duration.match(/(\d+)\s*(?:mo|month)s?/i)
      
      if (yearMatch) {
        months += parseInt(yearMatch[1]) * 12
      }
      if (monthMatch) {
        months += parseInt(monthMatch[1])
      }
      
      // If no duration format found, try to parse date ranges
      if (months === 0) {
        const dateRangeMatch = exp.duration.match(/(\w{3}\s+\d{4})\s*[-–]\s*(\w{3}\s+\d{4}|Present)/i)
        if (dateRangeMatch) {
          const startDate = new Date(dateRangeMatch[1])
          const endDate = dateRangeMatch[2].toLowerCase() === 'present' ? new Date() : new Date(dateRangeMatch[2])
          
          if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
            const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
            months = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44)) // Average days per month
          }
        }
      }
      
      totalMonths += months
    }
  })
  
  // Convert months to years and round to 1 decimal place
  const totalYears = Math.round((totalMonths / 12) * 10) / 10
  
  return Math.max(totalYears, 0) // Ensure non-negative
}

function determineCareerLevel(years: number, experience: any[]): 'entry' | 'mid' | 'senior' | 'executive' {
  if (years >= 15) return 'executive'
  if (years >= 8) return 'senior'
  if (years >= 3) return 'mid'
  return 'entry'
}

function determineRoleSignificance(exp: any, index: number): 'high' | 'medium' | 'low' {
  if (index === 0) return 'high' // Current role
  if (exp.title?.toLowerCase().includes('director') || 
      exp.title?.toLowerCase().includes('vp') || 
      exp.title?.toLowerCase().includes('head')) return 'high'
  if (index <= 2) return 'medium'
  return 'low'
}

function identifyCareerTransitions(experience: any[]): CareerTransition[] {
  const transitions: CareerTransition[] = []
  
  for (let i = 0; i < experience.length - 1; i++) {
    const current = experience[i]
    const previous = experience[i + 1]
    
    if (current && previous) {
      const transition: CareerTransition = {
        from: `${previous.title} at ${previous.company}`,
        to: `${current.title} at ${current.company}`,
        type: determineTransitionType(previous, current),
        significance: `Transitioned from ${previous.title} to ${current.title}`
      }
      transitions.push(transition)
    }
  }
  
  return transitions
}

function determineTransitionType(from: any, to: any): 'promotion' | 'career_change' | 'industry_switch' | 'company_change' {
  if (from.company === to.company) return 'promotion'
  if (from.title?.toLowerCase().includes('engineer') && to.title?.toLowerCase().includes('manager')) return 'career_change'
  return 'company_change'
}

function extractIndustries(experience: any[]): string[] {
  // This would ideally use company data to determine industries
  // For now, we'll extract from company names and titles
  const industries = new Set<string>()
  
  experience.forEach(exp => {
    if (exp.company?.toLowerCase().includes('tech')) industries.add('Technology')
    if (exp.company?.toLowerCase().includes('bank')) industries.add('Finance')
    if (exp.title?.toLowerCase().includes('software')) industries.add('Software Development')
    if (exp.title?.toLowerCase().includes('data')) industries.add('Data Science')
  })
  
  return Array.from(industries)
}

function categorizeCompanies(experience: any[]): string[] {
  const types = new Set<string>()
  
  experience.forEach(exp => {
    // Simple categorization based on company names
    if (exp.company?.toLowerCase().includes('startup')) types.add('Startup')
    if (exp.company?.toLowerCase().includes('corp') || 
        exp.company?.toLowerCase().includes('inc')) types.add('Corporation')
  })
  
  return Array.from(types)
}

function categorizeRoles(experience: any[]): string[] {
  const types = new Set<string>()
  
  experience.forEach(exp => {
    if (exp.title?.toLowerCase().includes('engineer')) types.add('Engineering')
    if (exp.title?.toLowerCase().includes('manager')) types.add('Management')
    if (exp.title?.toLowerCase().includes('analyst')) types.add('Analysis')
    if (exp.title?.toLowerCase().includes('director')) types.add('Leadership')
  })
  
  return Array.from(types)
}

function identifyCoreSkills(skills: string[]): string[] {
  // Identify core business/professional skills
  const coreSkillKeywords = ['management', 'leadership', 'strategy', 'communication', 'project', 'team']
  return skills.filter(skill => 
    coreSkillKeywords.some(keyword => skill.toLowerCase().includes(keyword))
  )
}

function identifyTechnicalSkills(skills: string[]): string[] {
  // Identify technical skills
  const techKeywords = ['python', 'javascript', 'react', 'sql', 'aws', 'docker', 'kubernetes', 'machine learning', 'ai']
  return skills.filter(skill => 
    techKeywords.some(keyword => skill.toLowerCase().includes(keyword))
  )
}

function extractIndustryKnowledge(profile: any): string[] {
  const knowledge = new Set<string>()
  
  if (profile.industry) knowledge.add(profile.industry)
  
  // Extract from experience
  const experience = profile.experience || []
  experience.forEach((exp: any) => {
    if (exp.description) {
      // Simple keyword extraction
      if (exp.description.toLowerCase().includes('fintech')) knowledge.add('FinTech')
      if (exp.description.toLowerCase().includes('healthcare')) knowledge.add('Healthcare')
      if (exp.description.toLowerCase().includes('e-commerce')) knowledge.add('E-commerce')
    }
  })
  
  return Array.from(knowledge)
}

function identifySpecializations(profile: any): string[] {
  const specializations = new Set<string>()
  
  // Extract from certifications
  const certifications = profile.certifications || []
  certifications.forEach((cert: string) => {
    if (cert.toLowerCase().includes('aws')) specializations.add('Cloud Computing')
    if (cert.toLowerCase().includes('pmp')) specializations.add('Project Management')
    if (cert.toLowerCase().includes('scrum')) specializations.add('Agile Methodology')
  })
  
  return Array.from(specializations)
}

function extractProfessionalInterests(profile: any): string[] {
  const interests = new Set<string>()
  
  // Extract from skills and experience
  const skills = profile.skills || []
  skills.forEach((skill: string) => {
    if (skill.toLowerCase().includes('innovation')) interests.add('Innovation')
    if (skill.toLowerCase().includes('sustainability')) interests.add('Sustainability')
    if (skill.toLowerCase().includes('digital transformation')) interests.add('Digital Transformation')
  })
  
  return Array.from(interests)
}

function generateLikelyTopics(profile: any): string[] {
  const topics = new Set<string>()
  
  // Based on current role and industry
  if (profile.currentRole) {
    topics.add(`${profile.currentRole} best practices`)
    topics.add(`Career growth in ${profile.currentRole}`)
  }
  
  if (profile.industry) {
    topics.add(`${profile.industry} trends`)
    topics.add(`Future of ${profile.industry}`)
  }
  
  // Based on skills
  const skills = profile.skills || []
  skills.slice(0, 3).forEach((skill: string) => {
    topics.add(`${skill} applications`)
  })
  
  return Array.from(topics)
}
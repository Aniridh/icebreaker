/**
 * AI service using Google Gemini for generating icebreakers
 */
import { GoogleGenerativeAI } from '@google/generative-ai'
import { analyzeProfileForRAG } from './profileAnalysisService.js'
import { IntelligentQuestionService } from './intelligentQuestionService.js'
import { 
  ConversationService,
  ConversationContext,
  PersonalizedQuestion
} from './conversationService.js'
import { ConversationStarter } from '../data/conversationStarters.js'

interface ScrapedProfile {
  name?: string
  title?: string
  bio?: string
  skills?: string[]
  interests?: {
    industries?: string[]
    technologies?: string[]
    causes?: string[]
    hobbies?: string[]
    professionalInterests?: string[]
  }
  experience?: any[]
  education?: {
    school: string
    degree?: string
    field?: string
    startYear?: string
    endYear?: string
    description?: string
    achievements?: string[]
  }[]
  projects?: any[]
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
  socialSignals?: {
    groups?: string[]
    events?: string[]
    certifications?: string[]
    volunteerWork?: string[]
    courses?: string[]
  }
}

interface AIResult {
  summary: string
  icebreakers: string[]
}

/**
 * Generate icebreakers using Google Gemini AI with RAG enhancement and conversation starter database
 */
export async function generateIcebreakers(profile: ScrapedProfile, sessionId?: string): Promise<AIResult> {
  console.log('Generating personalized icebreakers for profile:', profile.name)
  
  // Step 1: Use intelligent question selection with Gemini AI and RAG approach
  const profileContext = {
    name: profile.name,
    title: profile.title,
    company: profile.experience?.[0]?.company,
    industry: profile.experience?.[0]?.industry,
    skills: profile.skills,
    experience: profile.experience,
    education: profile.education,
    yearsOfExperience: profile.experience?.reduce((total, exp) => {
      const years = exp.duration ? parseInt(exp.duration) : 1
      return total + years
    }, 0),
    // Enhanced profile context for personalization
    currentRole: profile.title,
    previousRoles: profile.experience?.slice(1).map(exp => exp.title).filter(Boolean) || [],
    keySkillsExpertise: profile.skills || [],
    industryExperience: profile.experience?.map(exp => exp.industry).filter(Boolean) || [],
    location: undefined, // Location not available in ScrapedProfile
    // Analyze career transitions from experience
    careerTransitions: profile.experience && profile.experience.length > 1 ? [{
      from: {
        role: profile.experience[1]?.title,
        company: profile.experience[1]?.company,
        industry: profile.experience[1]?.industry
      },
      to: {
        role: profile.experience[0]?.title,
        company: profile.experience[0]?.company,
        industry: profile.experience[0]?.industry
      },
      timeframe: profile.experience[0]?.startYear?.toString(),
      significance: 'major'
    }] : [],
    // Extract achievements from experience descriptions
    achievements: profile.experience?.map(exp => exp.description).filter(Boolean) || []
  }
  
  console.log('Using intelligent question selection for:', profileContext.name)
  
  try {
    // Use the new intelligent question service
    const intelligentQuestions = await IntelligentQuestionService.getIntelligentQuestions(profileContext, 5)
    console.log('Intelligent questions selected:', intelligentQuestions.map(q => q.category))
    
    const personalizedIcebreakers = intelligentQuestions.map(q => q.customizedQuestion)
    
    // Step 2: Analyze profile using RAG approach for summary
    const ragContext = analyzeProfileForRAG(profile)
    console.log('RAG analysis complete:', {
      conversationTopics: ragContext.conversationTopics.length,
      networkingOpportunities: ragContext.networkingOpportunities.length,
      careerLevel: ragContext.personalInfo.careerLevel
    })
    
    return {
      summary: generateProfileSummary(profile, ragContext),
      icebreakers: personalizedIcebreakers
    }
  } catch (error) {
    console.warn('Intelligent question selection failed, falling back to database selection:', error)
    
    // Fallback to original method if intelligent selection fails
    const context: ConversationContext = {
      profileData: {
        name: profile.name,
        title: profile.title,
        company: profile.experience?.[0]?.company,
        industry: profile.experience?.[0]?.industry,
        skills: profile.skills,
        education: profile.education?.map(e => `${e.degree} from ${e.school}`),
        experience: profile.experience,
        location: undefined
      },
      sessionId
    }
    
    const selectedQuestions = ConversationService.getDiverseQuestions(context, 5)
    console.log('Fallback: Selected diverse questions:', selectedQuestions.map(q => q.category))
    
    const personalizedIcebreakers = selectedQuestions.map(q => q.personalizedQuestion)
    
    // Step 2: Analyze profile using RAG approach for summary
    const ragContext = analyzeProfileForRAG(profile)
    console.log('RAG analysis complete:', {
      conversationTopics: ragContext.conversationTopics.length,
      networkingOpportunities: ragContext.networkingOpportunities.length,
      careerLevel: ragContext.personalInfo.careerLevel
    })
    
    return {
      summary: generateProfileSummary(profile, ragContext),
      icebreakers: personalizedIcebreakers
    }
  }
}

/**
 * Generate a profile summary using RAG analysis
 */
function generateProfileSummary(profile: ScrapedProfile, context: any): string {
  const personalInfo = context.personalInfo
  const expertise = context.expertise
  const name = personalInfo.name || 'This person'
  const role = personalInfo.currentRole || 'professional'
  const company = personalInfo.currentCompany || 'their organization'
  const experience = personalInfo.yearsOfExperience || 'several'
  const industry = personalInfo.industry || 'their field'
  const skills = [...expertise.coreSkills, ...expertise.technicalSkills].slice(0, 3).join(', ') || 'diverse skills'
  
  return `${name} is a ${role} at ${company} with ${experience} years of experience in ${industry}. They have expertise in ${skills} and would be a valuable connection for networking and professional collaboration.`
}

/**
 * Create an enhanced prompt that refines database questions with AI
 */
function createEnhancedIcebreakerPrompt(profile: ScrapedProfile, context: any, baseIcebreakers: string[]): string {
  const personalInfo = context.personalInfo
  const expertise = context.expertise
  
  return `You are an expert LinkedIn networking strategist. I have 5 conversation starters that were generated from a professional question database and personalized with LinkedIn profile data. Please enhance and refine these to make them more natural, engaging, and specific to this person's background.

PROFILE CONTEXT:
- Name: ${personalInfo.name}
- Role: ${personalInfo.currentRole} at ${personalInfo.currentCompany}
- Experience: ${personalInfo.yearsOfExperience}+ years in ${personalInfo.industry}
- Key Skills: ${[...expertise.coreSkills, ...expertise.technicalSkills].slice(0, 5).join(', ')}

CURRENT CONVERSATION STARTERS TO ENHANCE:
${baseIcebreakers.map((ice, index) => `${index + 1}. ${ice}`).join('\n')}

ENHANCEMENT REQUIREMENTS:
1. Keep the core intent and professional focus of each starter
2. Make them sound more natural and conversational
3. Add specific details from their LinkedIn profile where appropriate
4. Ensure each one feels unique and not repetitive
5. Maintain professional networking tone
6. Keep each message 1-2 sentences maximum

Please respond with ONLY a JSON array of the 5 enhanced icebreakers:
["enhanced icebreaker 1", "enhanced icebreaker 2", "enhanced icebreaker 3", "enhanced icebreaker 4", "enhanced icebreaker 5"]`
}

/**
 * Create a personalized prompt using RAG-analyzed profile context
 */
function createPersonalizedIcebreakerPrompt(profile: ScrapedProfile, context: any): string {
  const personalInfo = context.personalInfo
  const professionalJourney = context.professionalJourney
  const expertise = context.expertise
  const interests = context.interests
  const conversationTopics = context.conversationTopics
  const networkingOpportunities = context.networkingOpportunities

  // Build context sections
  const currentRoleContext = `Currently working as ${personalInfo.currentRole} at ${personalInfo.currentCompany} with ${personalInfo.yearsOfExperience || 'several'} years of experience in ${personalInfo.industry || 'their field'}.`
  
  const careerJourneyContext = professionalJourney.careerProgression.length > 1 
    ? `Career progression: ${professionalJourney.careerProgression.slice(0, 3).map((step: any) => `${step.title} at ${step.company}`).join(' → ')}.`
    : ''
  
  const expertiseContext = expertise.coreSkills.length > 0 || expertise.technicalSkills.length > 0
    ? `Key expertise: ${[...expertise.coreSkills, ...expertise.technicalSkills].slice(0, 5).join(', ')}.`
    : ''
  
  const educationContext = interests.educationalBackground.length > 0
    ? `Education: ${interests.educationalBackground[0]}.`
    : ''
  
  const topConversationTopics = conversationTopics.slice(0, 3).map((topic: any) => 
    `- ${topic.topic}: ${topic.suggestedApproach}`
  ).join('\n')
  
  const topNetworkingOpportunities = networkingOpportunities.slice(0, 2).map((opp: any) => 
    `- ${opp.type}: ${opp.description}`
  ).join('\n')

  return `You are an expert LinkedIn networking strategist specializing in personalized outreach. Generate 5 highly personalized conversation starters for reaching out to ${personalInfo.name}.

PROFILE ANALYSIS:
${currentRoleContext}
${careerJourneyContext}
${expertiseContext}
${educationContext}

CONVERSATION TOPICS (High Priority):
${topConversationTopics}

NETWORKING OPPORTUNITIES:
${topNetworkingOpportunities}

PERSONALIZATION REQUIREMENTS:
1. Reference specific details from their current role at ${personalInfo.currentCompany}
2. Mention their expertise in ${expertise.coreSkills.concat(expertise.technicalSkills).slice(0, 2).join(' and ') || 'their field'}
3. Show knowledge of their ${personalInfo.careerLevel}-level experience (${personalInfo.yearsOfExperience}+ years)
4. Reference their industry background in ${personalInfo.industry || 'their sector'}
5. Make each icebreaker unique and conversation-worthy

STYLE GUIDELINES:
- Be specific and knowledgeable about their background
- Show genuine professional interest
- Ask thoughtful questions that demonstrate research
- Avoid generic networking language
- Keep each message 1-2 sentences
- Make them feel valued for their specific expertise

EXAMPLES OF GOOD PERSONALIZATION:
- "I noticed your transition from ${professionalJourney.careerProgression[1]?.title || 'your previous role'} to ${personalInfo.currentRole} - that's an interesting career move in ${personalInfo.industry}."
- "Your experience with ${expertise.technicalSkills[0] || expertise.coreSkills[0]} at ${personalInfo.currentCompany} caught my attention."
- "I'd love to hear your perspective on [specific industry trend] given your ${personalInfo.yearsOfExperience}+ years in ${personalInfo.industry}."

Generate 5 icebreakers that feel like they come from someone who has genuinely researched their profile and has specific reasons for connecting.

Format as JSON array: ["icebreaker 1", "icebreaker 2", "icebreaker 3", "icebreaker 4", "icebreaker 5"]`
}

/**
 * Create a detailed prompt for Gemini to generate icebreakers
 */
function createIcebreakerPrompt(profile: ScrapedProfile): string {
  const profileInfo = []

  if (profile.name) profileInfo.push(`Name: ${profile.name}`)
  if (profile.title) profileInfo.push(`Title: ${profile.title}`)
  if (profile.bio) profileInfo.push(`Bio: ${profile.bio}`)
  if (profile.skills?.length) profileInfo.push(`Skills: ${profile.skills.join(', ')}`)
  
  // Handle interests object structure
  if (profile.interests) {
    const allInterests = [
      ...(profile.interests.industries || []),
      ...(profile.interests.technologies || []),
      ...(profile.interests.causes || []),
      ...(profile.interests.hobbies || []),
      ...(profile.interests.professionalInterests || [])
    ]
    if (allInterests.length > 0) {
      profileInfo.push(`Interests: ${allInterests.join(', ')}`)
    }
  }
  
  if (profile.experience?.length) {
    const expSummary = profile.experience.slice(0, 3).map(exp => 
      `${exp.title} at ${exp.company}`
    ).join(', ')
    profileInfo.push(`Recent Experience: ${expSummary}`)
  }

  if (profile.projects?.length) {
    const projectSummary = profile.projects.slice(0, 2).map(proj => proj.name).join(', ')
    profileInfo.push(`Notable Projects: ${projectSummary}`)
  }

  // Add education information
  if (profile.education?.length) {
    const eduSummary = profile.education.slice(0, 2).map(edu => 
      `${edu.degree || 'Degree'} from ${edu.school}`
    ).join(', ')
    profileInfo.push(`Education: ${eduSummary}`)
  }

  // Add posts/activity information
  if (profile.posts?.length) {
    const postTopics = profile.posts.slice(0, 3).map(post => 
      post.hashtags?.join(', ') || 'general topics'
    ).filter(topics => topics !== 'general topics').join(', ')
    if (postTopics) {
      profileInfo.push(`Recent Post Topics: ${postTopics}`)
    }
  }

  // Add social signals
  if (profile.socialSignals) {
    if (profile.socialSignals.certifications?.length) {
      profileInfo.push(`Certifications: ${profile.socialSignals.certifications.slice(0, 3).join(', ')}`)
    }
    if (profile.socialSignals.volunteerWork?.length) {
      profileInfo.push(`Volunteer Work: ${profile.socialSignals.volunteerWork.slice(0, 2).join(', ')}`)
    }
  }

  const profileText = profileInfo.join('\n')

  return `Based on this person's profile information, generate a brief summary and 5 personalized icebreaker messages for networking:

${profileText}

Please respond in this exact JSON format:
{
  "summary": "A brief 2-3 sentence summary of this person's background and what makes them interesting to connect with",
  "icebreakers": [
    "Personalized icebreaker message 1",
    "Personalized icebreaker message 2", 
    "Personalized icebreaker message 3",
    "Personalized icebreaker message 4",
    "Personalized icebreaker message 5"
  ]
}

Make the icebreakers conversational, friendly, and specific to their background. Each should be 1-2 sentences and mention something specific from their profile.`
}

/**
 * Parse AI response and extract structured data
 */
function parseAIResponse(text: string): AIResult {
  try {
    // Clean the response text
    const cleanText = text.trim()
    
    // Try to extract JSON array from the response (for enhanced icebreakers)
    const arrayMatch = cleanText.match(/\[[\s\S]*\]/)
    if (arrayMatch) {
      const parsed = JSON.parse(arrayMatch[0])
      if (Array.isArray(parsed) && parsed.length > 0) {
        return {
          summary: '', // Summary will be generated separately
          icebreakers: parsed.slice(0, 5) // Ensure max 5 icebreakers
        }
      }
    }
    
    // Try to extract full JSON object from the response
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      
      if (parsed.summary && parsed.icebreakers && Array.isArray(parsed.icebreakers)) {
        return {
          summary: parsed.summary,
          icebreakers: parsed.icebreakers.slice(0, 5) // Ensure max 5 icebreakers
        }
      }
    }
    
    // If JSON parsing fails, return empty result (will use database questions)
    console.warn('Could not parse AI response as JSON, using database questions')
    return {
      summary: '',
      icebreakers: []
    }
  } catch (error) {
    console.error('Error parsing AI response:', error)
    
    // Return empty result (will use database questions)
    return {
      summary: '',
      icebreakers: []
    }
  }
}
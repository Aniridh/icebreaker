/**
 * Profile processing service that coordinates LinkedIn data fetching and AI generation
 */
import { scrapeLinkedInProfile } from './scrapers/linkedinScraper.js'
import { generateIcebreakers } from './aiService.js'

interface ProfileUrls {
  linkedin_url?: string
}

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

interface ProcessedResult {
  profile: ScrapedProfile
  summary: string
  icebreakers: string[]
  errors?: string[]
}

/**
 * Process profile URLs and generate icebreakers
 */
export async function processProfileUrls(urls: ProfileUrls): Promise<ProcessedResult> {
  const scrapedData: ScrapedProfile = {}
  const errors: string[] = []

  // Process LinkedIn profile if URL provided
  if (urls.linkedin_url) {
    try {
      console.log('Processing LinkedIn profile...')
      const linkedinData = await scrapeLinkedInProfile(urls.linkedin_url)
      Object.assign(scrapedData, linkedinData)
      console.log('LinkedIn processing completed successfully')
    } catch (error) {
      const errorMessage = handleProcessingError('LinkedIn', error)
      errors.push(errorMessage)
      console.error('LinkedIn processing failed:', errorMessage)
    }
  }

  // Generate icebreakers using AI
  let aiResult
  try {
    console.log('Generating icebreakers with AI...')
    aiResult = await generateIcebreakers(scrapedData)
    console.log('AI generation completed successfully')
  } catch (error) {
    console.error('AI generation failed:', error)
    // Fallback to basic icebreakers if AI fails
    aiResult = {
      summary: 'Profile information gathered successfully. Ready to connect!',
      icebreakers: [
        'Hi! I came across your profile and would love to connect.',
        'Hello! Your background looks really interesting - would be great to network.',
        'Hi there! I\'d love to learn more about your experience.',
        'Hello! Your profile caught my attention - let\'s connect!',
        'Hi! Would love to connect and potentially collaborate.'
      ]
    }
    errors.push('AI generation failed, using fallback icebreakers')
  }

  const result: ProcessedResult = {
    profile: scrapedData,
    summary: aiResult.summary,
    icebreakers: aiResult.icebreakers
  }

  if (errors.length > 0) {
    result.errors = errors
  }

  return result
}

/**
 * Handle and categorize processing errors
 */
function handleProcessingError(platform: string, error: any): string {
  const errorMessage = error?.message || error?.toString() || 'Unknown error'
  
  // Check for common error patterns
  if (errorMessage.includes('timeout') || errorMessage.includes('TIMEOUT')) {
    return `${platform}: Request timeout - the profile may be slow to load or temporarily unavailable`
  }
  
  if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
    return `${platform}: Access forbidden - the profile may be private or have restricted access`
  }
  
  if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
    return `${platform}: Profile not found - please check the URL is correct`
  }
  
  if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
    return `${platform}: Rate limited - too many requests, please try again later`
  }
  
  if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('network')) {
    return `${platform}: Network error - please check your internet connection`
  }
  
  if (errorMessage.includes('private') || errorMessage.includes('login required')) {
    return `${platform}: Profile is private or requires login to access`
  }
  
  if (errorMessage.includes('blocked') || errorMessage.includes('bot')) {
    return `${platform}: Request blocked - the platform may have detected automated access`
  }
  
  // Generic error message
  return `${platform}: ${errorMessage.substring(0, 100)}${errorMessage.length > 100 ? '...' : ''}`
}
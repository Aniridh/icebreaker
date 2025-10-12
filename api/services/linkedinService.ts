/**
 * LinkedIn API service for OAuth authentication and profile data fetching
 * Uses official LinkedIn API endpoints only - no scraping
 */
import axios from 'axios'

export interface LinkedInProfile {
  id: string
  name: string
  headline?: string
  about?: string
  profilePicture?: string
  experience?: LinkedInExperience[]
  education?: LinkedInEducation[]
  skills?: string[]
}

export interface LinkedInExperience {
  title: string
  company: string
  duration?: string
  description?: string
  startDate?: string
  endDate?: string
}

export interface LinkedInEducation {
  school: string
  degree?: string
  field?: string
  year?: string
  startDate?: string
  endDate?: string
}

export interface LinkedInTokens {
  accessToken: string
  refreshToken?: string
  expiresIn?: number
}

/**
 * Fetch LinkedIn profile data using OAuth access token
 */
export async function fetchLinkedInProfile(accessToken: string): Promise<LinkedInProfile> {
  try {
    console.log('Fetching LinkedIn profile data...')
    
    // Use the new userinfo endpoint for OpenID Connect
    const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    const profile = profileResponse.data
    console.log('Profile data fetched successfully:', profile)

    const linkedInProfile: LinkedInProfile = {
      id: profile.sub || 'unknown',
      name: profile.name || 'LinkedIn User',
      headline: profile.headline || '', // May not be available in userinfo
      about: profile.about || '', // May not be available in userinfo
      profilePicture: profile.picture || '',
      experience: [],
      education: [],
      skills: []
    }

    console.log('LinkedIn profile data compiled successfully:', {
      name: linkedInProfile.name,
      headline: linkedInProfile.headline,
      id: linkedInProfile.id
    })

    return linkedInProfile

  } catch (error: any) {
    console.error('Error fetching LinkedIn profile:', error.response?.data || error.message)
    
    // Try fallback to v2/me endpoint if userinfo fails
    try {
      console.log('Trying fallback to v2/me endpoint...')
      
      const fallbackResponse = await axios.get('https://api.linkedin.com/v2/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-RestLi-Protocol-Version': '2.0.0'
        }
      })

      const fallbackProfile = fallbackResponse.data
      console.log('Fallback profile data fetched:', fallbackProfile)

      // Construct full name from localized fields
      const firstName = fallbackProfile.localizedFirstName || 
                       fallbackProfile.firstName?.localized?.en_US || 
                       fallbackProfile.firstName?.preferredLocale?.language || ''
      const lastName = fallbackProfile.localizedLastName || 
                      fallbackProfile.lastName?.localized?.en_US || 
                      fallbackProfile.lastName?.preferredLocale?.language || ''
      const fullName = `${firstName} ${lastName}`.trim()

      return {
        id: fallbackProfile.id || 'unknown',
        name: fullName || 'LinkedIn User',
        headline: fallbackProfile.localizedHeadline || 
                 fallbackProfile.headline?.localized?.en_US || '',
        about: fallbackProfile.summary?.localized?.en_US || '',
        profilePicture: '',
        experience: [],
        education: [],
        skills: []
      }

    } catch (fallbackError: any) {
      console.error('Fallback also failed:', fallbackError.response?.data || fallbackError.message)
      throw new Error(`Failed to fetch LinkedIn profile: ${error.response?.data?.message || error.message}`)
    }
  }
}

/**
 * Fetch LinkedIn experience/positions data
 */
async function fetchLinkedInExperience(accessToken: string): Promise<LinkedInExperience[]> {
  try {
    const response = await axios.get('https://api.linkedin.com/v2/positions', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        q: 'members',
        projection: '(elements*(id,title,summary,startDate,endDate,company~(name)))'
      }
    })

    const positions = response.data.elements || []
    return positions.map((position: any) => ({
      title: position.title?.localized?.en_US || position.title || 'Position',
      company: position.company?.name || 'Company',
      description: position.summary?.localized?.en_US || position.summary,
      startDate: formatLinkedInDate(position.startDate),
      endDate: formatLinkedInDate(position.endDate),
      duration: calculateDuration(position.startDate, position.endDate)
    }))

  } catch (error: any) {
    console.warn('LinkedIn experience API may not be available:', error.response?.status)
    return []
  }
}

/**
 * Fetch LinkedIn education data
 */
async function fetchLinkedInEducation(accessToken: string): Promise<LinkedInEducation[]> {
  try {
    const response = await axios.get('https://api.linkedin.com/v2/educations', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        q: 'members',
        projection: '(elements*(school~(name),degree,fieldOfStudy,startDate,endDate))'
      }
    })

    const educations = response.data.elements || []
    return educations.map((education: any) => ({
      school: education.school?.name || 'School',
      degree: education.degree?.localized?.en_US || education.degree,
      field: education.fieldOfStudy?.localized?.en_US || education.fieldOfStudy,
      startDate: formatLinkedInDate(education.startDate),
      endDate: formatLinkedInDate(education.endDate),
      year: education.endDate ? education.endDate.year?.toString() : undefined
    }))

  } catch (error: any) {
    console.warn('LinkedIn education API may not be available:', error.response?.status)
    return []
  }
}

/**
 * Fetch LinkedIn skills data
 */
async function fetchLinkedInSkills(accessToken: string): Promise<string[]> {
  try {
    const response = await axios.get('https://api.linkedin.com/v2/skills', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        q: 'members',
        projection: '(elements*(name))'
      }
    })

    const skills = response.data.elements || []
    return skills.map((skill: any) => skill.name?.localized?.en_US || skill.name).filter(Boolean)

  } catch (error: any) {
    console.warn('LinkedIn skills API may not be available:', error.response?.status)
    return []
  }
}

/**
 * Format LinkedIn date object to readable string
 */
function formatLinkedInDate(dateObj: any): string {
  if (!dateObj) return ''
  
  const { year, month } = dateObj
  if (!year) return ''
  
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]
  
  const monthStr = month ? monthNames[month - 1] : ''
  return monthStr ? `${monthStr} ${year}` : year.toString()
}

/**
 * Calculate duration between two LinkedIn date objects
 */
function calculateDuration(startDate: any, endDate: any): string {
  if (!startDate) return ''
  
  const start = new Date(startDate.year, (startDate.month || 1) - 1)
  const end = endDate ? new Date(endDate.year, (endDate.month || 12) - 1) : new Date()
  
  const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
  
  if (diffMonths < 12) {
    return `${diffMonths} month${diffMonths !== 1 ? 's' : ''}`
  } else {
    const years = Math.floor(diffMonths / 12)
    const months = diffMonths % 12
    let duration = `${years} year${years !== 1 ? 's' : ''}`
    if (months > 0) {
      duration += ` ${months} month${months !== 1 ? 's' : ''}`
    }
    return duration
  }
}

/**
 * Convert LinkedIn profile to ScrapedProfile format for AI service
 */
export function convertLinkedInToScrapedProfile(linkedInProfile: LinkedInProfile): any {
  return {
    name: linkedInProfile.name,
    title: linkedInProfile.headline,
    bio: linkedInProfile.about,
    skills: linkedInProfile.skills || [],
    experience: linkedInProfile.experience?.map(exp => ({
      title: exp.title,
      company: exp.company,
      duration: exp.duration,
      description: exp.description
    })) || [],
    education: linkedInProfile.education?.map(edu => ({
      school: edu.school,
      degree: edu.degree,
      field: edu.field,
      startYear: edu.startDate,
      endYear: edu.endDate
    })) || [],
    interests: {
      industries: [],
      technologies: [],
      causes: [],
      hobbies: [],
      professionalInterests: []
    },
    projects: [],
    posts: [],
    activity: {},
    socialSignals: {}
  }
}
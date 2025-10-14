/**
 * LinkedIn profile data extraction routes
 * Uses web scraping to extract profile data from LinkedIn URLs
 */
import express from 'express'
import { scrapeLinkedInProfile } from '../../lib/services/scrapers/linkedinScraper.js'
import { generateIcebreakers } from '../../lib/services/aiService.js'

const router = express.Router()

/**
 * POST /api/linkedin/scrape
 * Extract LinkedIn profile data from URL
 */
router.post('/scrape', async (req, res) => {
  try {
    const { url } = req.body
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'LinkedIn URL is required'
      })
    }

    console.log('Starting LinkedIn profile data extraction for:', url)
    
    // Extract profile data using scraper
    const profile = await scrapeLinkedInProfile(url)
    
    if (!profile || (!profile.name && !profile.title)) {
      return res.status(404).json({
        success: false,
        error: 'Unable to extract profile data - LinkedIn may be blocking data extraction'
      })
    }

    res.json({
      success: true,
      profile
    })

  } catch (error: any) {
    console.error('Error extracting LinkedIn profile:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to extract LinkedIn profile'
    })
  }
})

/**
 * POST /api/linkedin/generate-icebreakers
 * Generate icebreakers from LinkedIn profile data
 */
router.post('/generate-icebreakers', async (req, res) => {
  try {
    const { linkedin_url, linkedinUrl } = req.body
    const url = linkedin_url || linkedinUrl
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'LinkedIn URL is required'
      })
    }

    console.log('Generating icebreakers for LinkedIn profile:', url)
    
    // Extract profile data
    const profile = await scrapeLinkedInProfile(url)
    
    if (!profile || (!profile.name && !profile.title)) {
      return res.status(404).json({
        success: false,
        error: 'Unable to extract profile data - LinkedIn may be blocking data extraction'
      })
    }

    // Generate icebreakers using AI
    const icebreakers = await generateIcebreakers(profile)
    
    res.json({
      success: true,
      profile,
      icebreakers
    })
  } catch (error: any) {
    console.error('Error generating icebreakers:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate icebreakers'
    })
  }
})

/**
 * POST /api/linkedin/analyze
 * Generate personalized icebreakers using RAG-enhanced AI from profile data
 */
router.post('/analyze', async (req, res) => {
  try {
    console.log('RAG-enhanced icebreaker generation request received')
    
    const { 
      profileUrl, 
      name, 
      title, 
      currentRole, 
      currentCompany, 
      industry, 
      experience, 
      education, 
      skills,
      bio,
      yearsOfExperience
    } = req.body
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required'
      })
    }

    // Create enhanced profile object for RAG analysis
    const enhancedProfile = {
      name,
      title: title || currentRole,
      currentRole: currentRole || title,
      currentCompany: currentCompany || 'Current Company',
      industry: industry || 'Technology',
      bio: bio || `${currentRole || title} with expertise in ${skills?.slice(0, 3).join(', ') || 'their field'}`,
      skills: skills || [],
      experience: experience || [],
      education: education || [],
      yearsOfExperience: yearsOfExperience || (experience?.length || 0),
      interests: {
        industries: [industry].filter(Boolean),
        technologies: skills?.filter((skill: string) => 
          ['python', 'javascript', 'react', 'sql', 'machine learning', 'ai'].some(tech => 
            skill.toLowerCase().includes(tech)
          )
        ) || [],
        causes: [],
        hobbies: [],
        professionalInterests: skills?.slice(0, 5) || []
      },
      projects: [],
      posts: [],
      activity: {},
      socialSignals: {}
    }
    
    console.log('Generating RAG-enhanced icebreakers for profile:', name, 'at', currentCompany)
    
    // Generate icebreakers using enhanced AI service with RAG
    const result = await generateIcebreakers(enhancedProfile)
    
    res.json({
      success: true,
      profile: {
        name,
        title,
        currentRole,
        currentCompany,
        industry,
        experience,
        education,
        skills
      },
      icebreakers: result.icebreakers,
      summary: result.summary
    })

  } catch (error: any) {
    console.error('Error generating RAG-enhanced icebreakers:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate personalized icebreakers'
    })
  }
})

/**
 * POST /api/linkedin/manual-icebreakers
 * Generate AI icebreakers from manually provided profile data
 */
router.post('/manual-icebreakers', async (req, res) => {
  try {
    console.log('Manual icebreaker generation request received')
    
    const { name, headline, about, experience, education, skills } = req.body
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required'
      })
    }

    // Create profile object from manual input
    const manualProfile = {
      name,
      title: headline,
      bio: about,
      skills: skills || [],
      experience: experience || [],
      education: education || [],
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
    
    console.log('Generating icebreakers for manual profile:', name)
    
    // Generate icebreakers using AI service
    const icebreakers = await generateIcebreakers(manualProfile)
    
    res.json({
      success: true,
      profile: {
        name,
        headline,
        about,
        experience,
        education,
        skills
      },
      icebreakers
    })

  } catch (error: any) {
    console.error('Error generating manual icebreakers:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate icebreakers'
    })
  }
})

/**
 * GET /api/linkedin/status
 * Check service status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'LinkedIn data extraction service is running',
    timestamp: new Date().toISOString()
  })
})

export default router
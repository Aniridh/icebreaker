/**
 * Profile processing API route for generating icebreakers
 * Handles LinkedIn profile analysis
 */
import { Router, type Request, type Response } from 'express'
import { processProfileUrls } from '../services/profileProcessor.js'

const router = Router()

interface ProcessRequest {
  linkedin_url?: string
}

/**
 * Process profile URLs and generate icebreakers
 * POST /api/process
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { linkedin_url }: ProcessRequest = req.body

    // Validate that LinkedIn URL is provided
    if (!linkedin_url) {
      res.status(400).json({
        success: false,
        error: 'LinkedIn URL is required'
      })
      return
    }

    // Process the LinkedIn profile and generate icebreakers
    const result = await processProfileUrls({
      linkedin_url
    })

    res.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error processing profiles:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to process profiles and generate icebreakers'
    })
  }
})

export default router
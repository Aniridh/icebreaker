/**
 * Contact Management API Routes
 * RESTful endpoints for contact management with local storage
 */
import express from 'express'
import { ContactService, Contact, Interaction, Meeting } from '../services/contactService.js'

const router = express.Router()

// Initialize contact service
ContactService.initialize().catch(console.error)

/**
 * GET /api/contacts
 * Get all contacts with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const { search, relationship, source } = req.query
    
    let contacts = await ContactService.getAllContacts()
    
    // Apply filters
    if (search) {
      contacts = await ContactService.searchContacts(search as string)
    }
    
    if (relationship) {
      contacts = contacts.filter(contact => contact.relationship === relationship)
    }
    
    if (source) {
      contacts = contacts.filter(contact => contact.source === source)
    }
    
    res.json({
      success: true,
      data: contacts,
      count: contacts.length
    })
  } catch (error) {
    console.error('Error fetching contacts:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contacts'
    })
  }
})

/**
 * GET /api/contacts/:id
 * Get specific contact by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const contact = await ContactService.getContactById(req.params.id)
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      })
    }
    
    // Get related data
    const interactions = await ContactService.getContactInteractions(contact.id)
    const meetings = await ContactService.getContactMeetings(contact.id)
    
    res.json({
      success: true,
      data: {
        contact,
        interactions,
        meetings
      }
    })
  } catch (error) {
    console.error('Error fetching contact:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contact'
    })
  }
})

/**
 * POST /api/contacts
 * Create new contact
 */
router.post('/', async (req, res) => {
  try {
    const contactData = req.body
    
    // Validate required fields
    if (!contactData.name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required'
      })
    }
    
    // Set defaults
    const newContactData = {
      tags: [],
      notes: '',
      relationship: 'prospect' as const,
      source: 'manual' as const,
      ...contactData
    }
    
    const contact = await ContactService.createContact(newContactData)
    
    res.status(201).json({
      success: true,
      data: contact
    })
  } catch (error) {
    console.error('Error creating contact:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create contact'
    })
  }
})

/**
 * PUT /api/contacts/:id
 * Update existing contact
 */
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body
    const contact = await ContactService.updateContact(req.params.id, updates)
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      })
    }
    
    res.json({
      success: true,
      data: contact
    })
  } catch (error) {
    console.error('Error updating contact:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update contact'
    })
  }
})

/**
 * DELETE /api/contacts/:id
 * Delete contact
 */
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await ContactService.deleteContact(req.params.id)
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      })
    }
    
    res.json({
      success: true,
      message: 'Contact deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting contact:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete contact'
    })
  }
})

/**
 * GET /api/contacts/follow-ups/needed
 * Get contacts requiring follow-up
 */
router.get('/follow-ups/needed', async (req, res) => {
  try {
    const contacts = await ContactService.getContactsRequiringFollowUp()
    
    res.json({
      success: true,
      data: contacts,
      count: contacts.length
    })
  } catch (error) {
    console.error('Error fetching follow-ups:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch follow-ups'
    })
  }
})

/**
 * POST /api/contacts/:id/interactions
 * Add interaction to contact
 */
router.post('/:id/interactions', async (req, res) => {
  try {
    const contactId = req.params.id
    const interactionData = req.body
    
    // Validate contact exists
    const contact = await ContactService.getContactById(contactId)
    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      })
    }
    
    // Validate required fields
    if (!interactionData.type || !interactionData.content || !interactionData.date) {
      return res.status(400).json({
        success: false,
        error: 'Type, content, and date are required'
      })
    }
    
    const interaction = await ContactService.addInteraction({
      contactId,
      tags: [],
      ...interactionData
    })
    
    res.status(201).json({
      success: true,
      data: interaction
    })
  } catch (error) {
    console.error('Error adding interaction:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to add interaction'
    })
  }
})

/**
 * GET /api/contacts/:id/interactions
 * Get interactions for contact
 */
router.get('/:id/interactions', async (req, res) => {
  try {
    const interactions = await ContactService.getContactInteractions(req.params.id)
    
    res.json({
      success: true,
      data: interactions,
      count: interactions.length
    })
  } catch (error) {
    console.error('Error fetching interactions:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch interactions'
    })
  }
})

/**
 * POST /api/contacts/meetings
 * Create new meeting
 */
router.post('/meetings', async (req, res) => {
  try {
    const meetingData = req.body
    
    // Validate required fields
    if (!meetingData.title || !meetingData.date || !meetingData.contactIds || meetingData.contactIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Title, date, and at least one contact ID are required'
      })
    }
    
    // Validate contacts exist
    for (const contactId of meetingData.contactIds) {
      const contact = await ContactService.getContactById(contactId)
      if (!contact) {
        return res.status(400).json({
          success: false,
          error: `Contact with ID ${contactId} not found`
        })
      }
    }
    
    const meeting = await ContactService.createMeeting({
      duration: 60, // default 1 hour
      type: 'video_call' as const,
      status: 'scheduled' as const,
      ...meetingData
    })
    
    res.status(201).json({
      success: true,
      data: meeting
    })
  } catch (error) {
    console.error('Error creating meeting:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create meeting'
    })
  }
})

/**
 * GET /api/contacts/analytics
 * Get networking analytics
 */
router.get('/analytics/overview', async (req, res) => {
  try {
    const analytics = await ContactService.getNetworkingAnalytics()
    
    res.json({
      success: true,
      data: analytics
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics'
    })
  }
})

export default router
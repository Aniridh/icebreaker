/**
 * Contact Management Service
 * Handles local JSON file storage for contacts and networking data
 */
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Data directory for local storage
const DATA_DIR = path.join(__dirname, '../../data')
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json')
const INTERACTIONS_FILE = path.join(DATA_DIR, 'interactions.json')
const MEETINGS_FILE = path.join(DATA_DIR, 'meetings.json')

export interface Contact {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  title?: string
  industry?: string
  location?: string
  linkedinUrl?: string
  profilePicture?: string
  
  // LinkedIn profile data
  skills?: string[]
  experience?: ExperienceDetail[]
  education?: EducationDetail[]
  yearsOfExperience?: number
  seniority?: 'entry' | 'mid' | 'senior' | 'executive'
  
  // Networking context
  source: 'linkedin' | 'business_card' | 'manual' | 'event' | 'referral'
  tags: string[]
  notes: string
  relationship: 'prospect' | 'contact' | 'connection' | 'close_contact' | 'mentor' | 'mentee'
  
  // Metadata
  createdAt: string
  updatedAt: string
  lastContactedAt?: string
  nextFollowUpAt?: string
  
  // AI insights
  aiInsights?: {
    personalityType?: string
    communicationStyle?: string
    interests?: string[]
    networkingPotential?: number
    recommendedTopics?: string[]
  }
}

export interface ExperienceDetail {
  company: string
  title: string
  duration: string
  description?: string
  skills?: string[]
  startYear?: number
  endYear?: number
  industry?: string
}

export interface EducationDetail {
  school: string
  degree: string
  field: string
  startYear?: string
  endYear?: string
  achievements?: string[]
}

export interface Interaction {
  id: string
  contactId: string
  type: 'message' | 'call' | 'meeting' | 'email' | 'linkedin' | 'event' | 'note'
  content: string
  date: string
  outcome?: string
  nextAction?: string
  sentiment?: 'positive' | 'neutral' | 'negative'
  tags: string[]
  createdAt: string
}

export interface Meeting {
  id: string
  contactIds: string[]
  title: string
  description?: string
  date: string
  duration: number // minutes
  location?: string
  type: 'in_person' | 'video_call' | 'phone_call' | 'coffee' | 'lunch' | 'conference'
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
  
  // Meeting preparation
  agenda?: string[]
  conversationStarters?: string[]
  objectives?: string[]
  
  // Meeting outcomes
  notes?: string
  actionItems?: string[]
  followUpTasks?: string[]
  nextMeetingDate?: string
  
  createdAt: string
  updatedAt: string
}

export class ContactService {
  
  /**
   * Initialize data directory and files
   */
  static async initialize(): Promise<void> {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true })
      
      // Initialize files if they don't exist
      const files = [CONTACTS_FILE, INTERACTIONS_FILE, MEETINGS_FILE]
      for (const file of files) {
        try {
          await fs.access(file)
        } catch {
          await fs.writeFile(file, JSON.stringify([], null, 2))
        }
      }
      
      console.log('📁 Contact service initialized with local storage')
    } catch (error) {
      console.error('❌ Error initializing contact service:', error)
      throw error
    }
  }

  /**
   * Get all contacts
   */
  static async getAllContacts(): Promise<Contact[]> {
    try {
      const data = await fs.readFile(CONTACTS_FILE, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      console.error('Error reading contacts:', error)
      return []
    }
  }

  /**
   * Get contact by ID
   */
  static async getContactById(id: string): Promise<Contact | null> {
    const contacts = await this.getAllContacts()
    return contacts.find(contact => contact.id === id) || null
  }

  /**
   * Create new contact
   */
  static async createContact(contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact> {
    const contacts = await this.getAllContacts()
    
    const newContact: Contact = {
      ...contactData,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    contacts.push(newContact)
    await fs.writeFile(CONTACTS_FILE, JSON.stringify(contacts, null, 2))
    
    console.log(`✅ Created new contact: ${newContact.name}`)
    return newContact
  }

  /**
   * Update existing contact
   */
  static async updateContact(id: string, updates: Partial<Contact>): Promise<Contact | null> {
    const contacts = await this.getAllContacts()
    const index = contacts.findIndex(contact => contact.id === id)
    
    if (index === -1) {
      return null
    }
    
    contacts[index] = {
      ...contacts[index],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    
    await fs.writeFile(CONTACTS_FILE, JSON.stringify(contacts, null, 2))
    
    console.log(`✅ Updated contact: ${contacts[index].name}`)
    return contacts[index]
  }

  /**
   * Delete contact
   */
  static async deleteContact(id: string): Promise<boolean> {
    const contacts = await this.getAllContacts()
    const filteredContacts = contacts.filter(contact => contact.id !== id)
    
    if (filteredContacts.length === contacts.length) {
      return false // Contact not found
    }
    
    await fs.writeFile(CONTACTS_FILE, JSON.stringify(filteredContacts, null, 2))
    
    // Also delete related interactions and meetings
    await this.deleteContactInteractions(id)
    await this.deleteContactMeetings(id)
    
    console.log(`🗑️ Deleted contact: ${id}`)
    return true
  }

  /**
   * Search contacts
   */
  static async searchContacts(query: string): Promise<Contact[]> {
    const contacts = await this.getAllContacts()
    const searchTerm = query.toLowerCase()
    
    return contacts.filter(contact => 
      contact.name.toLowerCase().includes(searchTerm) ||
      contact.company?.toLowerCase().includes(searchTerm) ||
      contact.title?.toLowerCase().includes(searchTerm) ||
      contact.industry?.toLowerCase().includes(searchTerm) ||
      contact.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
      contact.notes.toLowerCase().includes(searchTerm)
    )
  }

  /**
   * Get contacts by relationship type
   */
  static async getContactsByRelationship(relationship: Contact['relationship']): Promise<Contact[]> {
    const contacts = await this.getAllContacts()
    return contacts.filter(contact => contact.relationship === relationship)
  }

  /**
   * Get contacts requiring follow-up
   */
  static async getContactsRequiringFollowUp(): Promise<Contact[]> {
    const contacts = await this.getAllContacts()
    const now = new Date()
    
    return contacts.filter(contact => 
      contact.nextFollowUpAt && new Date(contact.nextFollowUpAt) <= now
    )
  }

  /**
   * Add interaction
   */
  static async addInteraction(interaction: Omit<Interaction, 'id' | 'createdAt'>): Promise<Interaction> {
    const interactions = await this.getAllInteractions()
    
    const newInteraction: Interaction = {
      ...interaction,
      id: this.generateId(),
      createdAt: new Date().toISOString()
    }
    
    interactions.push(newInteraction)
    await fs.writeFile(INTERACTIONS_FILE, JSON.stringify(interactions, null, 2))
    
    // Update contact's last contacted date
    await this.updateContact(interaction.contactId, {
      lastContactedAt: new Date().toISOString()
    })
    
    console.log(`💬 Added interaction for contact: ${interaction.contactId}`)
    return newInteraction
  }

  /**
   * Get all interactions
   */
  static async getAllInteractions(): Promise<Interaction[]> {
    try {
      const data = await fs.readFile(INTERACTIONS_FILE, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      console.error('Error reading interactions:', error)
      return []
    }
  }

  /**
   * Get interactions for a contact
   */
  static async getContactInteractions(contactId: string): Promise<Interaction[]> {
    const interactions = await this.getAllInteractions()
    return interactions
      .filter(interaction => interaction.contactId === contactId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  /**
   * Delete contact interactions
   */
  static async deleteContactInteractions(contactId: string): Promise<void> {
    const interactions = await this.getAllInteractions()
    const filteredInteractions = interactions.filter(interaction => interaction.contactId !== contactId)
    await fs.writeFile(INTERACTIONS_FILE, JSON.stringify(filteredInteractions, null, 2))
  }

  /**
   * Create meeting
   */
  static async createMeeting(meetingData: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>): Promise<Meeting> {
    const meetings = await this.getAllMeetings()
    
    const newMeeting: Meeting = {
      ...meetingData,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    meetings.push(newMeeting)
    await fs.writeFile(MEETINGS_FILE, JSON.stringify(meetings, null, 2))
    
    console.log(`📅 Created meeting: ${newMeeting.title}`)
    return newMeeting
  }

  /**
   * Get all meetings
   */
  static async getAllMeetings(): Promise<Meeting[]> {
    try {
      const data = await fs.readFile(MEETINGS_FILE, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      console.error('Error reading meetings:', error)
      return []
    }
  }

  /**
   * Get meetings for a contact
   */
  static async getContactMeetings(contactId: string): Promise<Meeting[]> {
    const meetings = await this.getAllMeetings()
    return meetings
      .filter(meeting => meeting.contactIds.includes(contactId))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  /**
   * Delete contact meetings
   */
  static async deleteContactMeetings(contactId: string): Promise<void> {
    const meetings = await this.getAllMeetings()
    const filteredMeetings = meetings.filter(meeting => !meeting.contactIds.includes(contactId))
    await fs.writeFile(MEETINGS_FILE, JSON.stringify(filteredMeetings, null, 2))
  }

  /**
   * Get networking analytics
   */
  static async getNetworkingAnalytics(): Promise<{
    totalContacts: number
    contactsByRelationship: Record<string, number>
    contactsBySource: Record<string, number>
    recentInteractions: number
    upcomingMeetings: number
    followUpsNeeded: number
    topIndustries: Array<{ industry: string; count: number }>
    topCompanies: Array<{ company: string; count: number }>
  }> {
    const contacts = await this.getAllContacts()
    const interactions = await this.getAllInteractions()
    const meetings = await this.getAllMeetings()
    
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    // Count contacts by relationship
    const contactsByRelationship = contacts.reduce((acc, contact) => {
      acc[contact.relationship] = (acc[contact.relationship] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Count contacts by source
    const contactsBySource = contacts.reduce((acc, contact) => {
      acc[contact.source] = (acc[contact.source] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Recent interactions
    const recentInteractions = interactions.filter(
      interaction => new Date(interaction.date) >= oneWeekAgo
    ).length
    
    // Upcoming meetings
    const upcomingMeetings = meetings.filter(
      meeting => meeting.status === 'scheduled' && new Date(meeting.date) >= now
    ).length
    
    // Follow-ups needed
    const followUpsNeeded = contacts.filter(
      contact => contact.nextFollowUpAt && new Date(contact.nextFollowUpAt) <= now
    ).length
    
    // Top industries
    const industryCount = contacts.reduce((acc, contact) => {
      if (contact.industry) {
        acc[contact.industry] = (acc[contact.industry] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
    
    const topIndustries = Object.entries(industryCount)
      .map(([industry, count]) => ({ industry, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
    
    // Top companies
    const companyCount = contacts.reduce((acc, contact) => {
      if (contact.company) {
        acc[contact.company] = (acc[contact.company] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
    
    const topCompanies = Object.entries(companyCount)
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
    
    return {
      totalContacts: contacts.length,
      contactsByRelationship,
      contactsBySource,
      recentInteractions,
      upcomingMeetings,
      followUpsNeeded,
      topIndustries,
      topCompanies
    }
  }

  /**
   * Generate unique ID
   */
  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
}
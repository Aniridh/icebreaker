/**
 * Scanner Service
 * Handles multimodal scanning capabilities including OCR and business card processing
 */
// @ts-ignore – tesseract.js is optional; will be handled at runtime
const tesseract = await import('tesseract.js').catch(() => null)
const createWorker = tesseract?.createWorker
import sharp from 'sharp'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { ContactService, Contact } from './contactService.js'

interface ScanResult {
  success: boolean
  data?: {
    extractedText: string
    contact?: Partial<Contact>
    confidence: number
  }
  error?: string
}

interface BusinessCardData {
  name?: string
  title?: string
  company?: string
  email?: string
  phone?: string
  website?: string
  address?: string
  linkedin?: string
}

export class ScannerService {
  private static genAI: GoogleGenerativeAI | null = null

  private static initializeAI(): GoogleGenerativeAI {
    if (!this.genAI) {
      const apiKey = process.env.GOOGLE_API_KEY
      if (!apiKey) {
        throw new Error('GOOGLE_API_KEY is not configured')
      }
      this.genAI = new GoogleGenerativeAI(apiKey)
    }
    return this.genAI
  }

  /**
   * Process uploaded image for OCR and business card extraction
   */
  static async processImage(imageBuffer: Buffer, mimeType: string): Promise<ScanResult> {
    try {
      console.log('🔍 Starting image processing...')
      
      // Preprocess image for better OCR results
      const processedImage = await this.preprocessImage(imageBuffer)
      
      // Perform OCR
      const ocrResult = await this.performOCR(processedImage)
      
      if (!ocrResult.success || !ocrResult.text) {
        return {
          success: false,
          error: 'Failed to extract text from image'
        }
      }
      
      console.log('📝 Extracted text:', ocrResult.text.substring(0, 200) + '...')
      
      // Use AI to parse business card data
      const businessCardData = await this.parseBusinessCardWithAI(ocrResult.text)
      
      // Convert to contact format
      const contact = this.convertToContact(businessCardData)
      
      return {
        success: true,
        data: {
          extractedText: ocrResult.text,
          contact,
          confidence: ocrResult.confidence
        }
      }
      
    } catch (error) {
      console.error('❌ Error processing image:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Preprocess image for better OCR results
   */
  private static async preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(imageBuffer)
        .resize(1200, 1200, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .grayscale()
        .normalize()
        .sharpen()
        .jpeg({ quality: 95 })
        .toBuffer()
    } catch (error) {
      console.error('Error preprocessing image:', error)
      return imageBuffer // Return original if preprocessing fails
    }
  }

  /**
   * Perform OCR on image
   */
  private static async performOCR(imageBuffer: Buffer): Promise<{
    success: boolean
    text?: string
    confidence: number
  }> {
    let worker
    
    try {
      console.log('🤖 Initializing OCR worker...')
      worker = await createWorker('eng')
      
      const { data } = await worker.recognize(imageBuffer)
      
      await worker.terminate()
      
      return {
        success: true,
        text: data.text,
        confidence: data.confidence
      }
      
    } catch (error) {
      if (worker) {
        await worker.terminate()
      }
      console.error('OCR Error:', error)
      return {
        success: false,
        confidence: 0
      }
    }
  }

  /**
   * Use AI to parse business card data from extracted text
   */
  private static async parseBusinessCardWithAI(extractedText: string): Promise<BusinessCardData> {
    try {
      const genAI = this.initializeAI()
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

      const prompt = `You are an expert at parsing business card information. Extract structured data from the following text that was extracted from a business card using OCR.

EXTRACTED TEXT:
${extractedText}

Please extract the following information and return it as JSON:
- name: Full name of the person
- title: Job title or position
- company: Company or organization name
- email: Email address
- phone: Phone number (format as cleanly as possible)
- website: Website URL
- address: Physical address
- linkedin: LinkedIn profile URL or username

IMPORTANT INSTRUCTIONS:
1. Only extract information that is clearly present in the text
2. Clean up any OCR errors in names, emails, and phone numbers
3. Format phone numbers consistently
4. If information is not clearly present, leave the field empty
5. Be conservative - only include information you're confident about
6. Return valid JSON format

Example output:
{
  "name": "John Smith",
  "title": "Senior Software Engineer",
  "company": "Tech Corp",
  "email": "john.smith@techcorp.com",
  "phone": "+1 (555) 123-4567",
  "website": "www.techcorp.com",
  "address": "123 Main St, San Francisco, CA 94105",
  "linkedin": "linkedin.com/in/johnsmith"
}`

      const result = await model.generateContent(prompt)
      const response = result.response.text()
      
      console.log('🤖 AI parsing response:', response.substring(0, 200) + '...')
      
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response')
      }
      
      const parsedData = JSON.parse(jsonMatch[0])
      return parsedData
      
    } catch (error) {
      console.error('Error parsing business card with AI:', error)
      return this.fallbackParsing(extractedText)
    }
  }

  /**
   * Fallback parsing using regex patterns
   */
  private static fallbackParsing(text: string): BusinessCardData {
    const data: BusinessCardData = {}
    
    // Email regex
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)
    if (emailMatch) {
      data.email = emailMatch[0]
    }
    
    // Phone regex (various formats)
    const phoneMatch = text.match(/(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g)
    if (phoneMatch) {
      data.phone = phoneMatch[0]
    }
    
    // Website regex
    const websiteMatch = text.match(/(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/g)
    if (websiteMatch) {
      data.website = websiteMatch[0]
    }
    
    // LinkedIn regex
    const linkedinMatch = text.match(/(?:linkedin\.com\/in\/|linkedin\.com\/pub\/)[a-zA-Z0-9-]+/g)
    if (linkedinMatch) {
      data.linkedin = linkedinMatch[0]
    }
    
    console.log('📋 Fallback parsing result:', data)
    return data
  }

  /**
   * Convert business card data to contact format
   */
  private static convertToContact(businessCardData: BusinessCardData): Partial<Contact> {
    const contact: Partial<Contact> = {
      source: 'business_card',
      relationship: 'prospect',
      tags: ['scanned'],
      notes: 'Contact created from business card scan'
    }
    
    if (businessCardData.name) {
      contact.name = businessCardData.name
    }
    
    if (businessCardData.title) {
      contact.title = businessCardData.title
    }
    
    if (businessCardData.company) {
      contact.company = businessCardData.company
    }
    
    if (businessCardData.email) {
      contact.email = businessCardData.email
    }
    
    if (businessCardData.phone) {
      contact.phone = businessCardData.phone
    }
    
    if (businessCardData.linkedin) {
      contact.linkedinUrl = businessCardData.linkedin.startsWith('http') 
        ? businessCardData.linkedin 
        : `https://${businessCardData.linkedin}`
    }
    
    if (businessCardData.address) {
      contact.location = businessCardData.address
    }
    
    return contact
  }

  /**
   * Create contact from scan result
   */
  static async createContactFromScan(scanResult: ScanResult): Promise<Contact | null> {
    if (!scanResult.success || !scanResult.data?.contact) {
      return null
    }
    
    const contactData = scanResult.data.contact
    
    // Validate required fields
    if (!contactData.name) {
      throw new Error('Name is required to create contact')
    }
    
    // Create the contact
    const contact = await ContactService.createContact({
      ...contactData,
      name: contactData.name,
      source: 'business_card',
      relationship: 'prospect',
      tags: ['scanned', ...(contactData.tags || [])],
      notes: contactData.notes || 'Contact created from business card scan'
    } as Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>)
    
    console.log('✅ Created contact from scan:', contact.name)
    return contact
  }

  /**
   * Process multiple images in batch
   */
  static async processBatch(images: Array<{ buffer: Buffer; mimeType: string }>): Promise<ScanResult[]> {
    const results: ScanResult[] = []
    
    for (const image of images) {
      try {
        const result = await this.processImage(image.buffer, image.mimeType)
        results.push(result)
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    return results
  }

  /**
   * Get supported file types
   */
  static getSupportedFileTypes(): string[] {
    return [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/bmp',
      'image/tiff'
    ]
  }

  /**
   * Validate file type
   */
  static isValidFileType(mimeType: string): boolean {
    return this.getSupportedFileTypes().includes(mimeType.toLowerCase())
  }

  /**
   * Get maximum file size (in bytes)
   */
  static getMaxFileSize(): number {
    return 10 * 1024 * 1024 // 10MB
  }
}
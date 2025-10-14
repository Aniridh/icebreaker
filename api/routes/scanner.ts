/**
 * Scanner API Routes
 * Handles multimodal scanning endpoints for business card and document processing
 */
import express from 'express'
import multer from 'multer'
import { ScannerService } from '../../lib/services/scannerService.js'
import { ContactService } from '../../lib/services/contactService.js'

const router = express.Router()

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: ScannerService.getMaxFileSize(), // 10MB
    files: 5 // Maximum 5 files per request
  },
  fileFilter: (req, file, cb) => {
    if (ScannerService.isValidFileType(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Supported types: ${ScannerService.getSupportedFileTypes().join(', ')}`))
    }
  }
})

/**
 * GET /api/scanner/supported-types
 * Get supported file types for scanning
 */
router.get('/supported-types', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        supportedTypes: ScannerService.getSupportedFileTypes(),
        maxFileSize: ScannerService.getMaxFileSize(),
        maxFiles: 5
      }
    })
  } catch (error) {
    console.error('Error getting supported types:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get supported file types'
    })
  }
})

/**
 * POST /api/scanner/process
 * Process single image for OCR and business card extraction
 */
router.post('/process', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      })
    }

    console.log(`📸 Processing image: ${req.file.originalname} (${req.file.size} bytes)`)

    const result = await ScannerService.processImage(req.file.buffer, req.file.mimetype)

    if (!result.success) {
      return res.status(400).json(result)
    }

    res.json({
      success: true,
      data: {
        ...result.data,
        filename: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      }
    })

  } catch (error) {
    console.error('Error processing image:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process image'
    })
  }
})

/**
 * POST /api/scanner/process-batch
 * Process multiple images in batch
 */
router.post('/process-batch', upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No image files provided'
      })
    }

    console.log(`📸 Processing ${req.files.length} images in batch`)

    const images = req.files.map(file => ({
      buffer: file.buffer,
      mimeType: file.mimetype,
      filename: file.originalname,
      size: file.size
    }))

    const results = await ScannerService.processBatch(images)

    res.json({
      success: true,
      data: {
        results: results.map((result, index) => ({
          ...result,
          filename: images[index].filename,
          fileSize: images[index].size,
          mimeType: images[index].mimeType
        })),
        totalProcessed: results.length,
        successCount: results.filter(r => r.success).length,
        errorCount: results.filter(r => !r.success).length
      }
    })

  } catch (error) {
    console.error('Error processing batch:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process images'
    })
  }
})

/**
 * POST /api/scanner/create-contact
 * Create contact from scan result
 */
router.post('/create-contact', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      })
    }

    console.log(`📸 Creating contact from image: ${req.file.originalname}`)

    // Process the image
    const scanResult = await ScannerService.processImage(req.file.buffer, req.file.mimetype)

    if (!scanResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Failed to process image: ' + scanResult.error
      })
    }

    // Create contact from scan result
    const contact = await ScannerService.createContactFromScan(scanResult)

    if (!contact) {
      return res.status(400).json({
        success: false,
        error: 'Could not extract enough information to create contact'
      })
    }

    res.json({
      success: true,
      data: {
        contact,
        scanData: scanResult.data,
        filename: req.file.originalname
      }
    })

  } catch (error) {
    console.error('Error creating contact from scan:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create contact from scan'
    })
  }
})

/**
 * POST /api/scanner/preview-contact
 * Preview contact data from image without creating
 */
router.post('/preview-contact', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      })
    }

    console.log(`👀 Previewing contact from image: ${req.file.originalname}`)

    const scanResult = await ScannerService.processImage(req.file.buffer, req.file.mimetype)

    if (!scanResult.success) {
      return res.status(400).json(scanResult)
    }

    res.json({
      success: true,
      data: {
        ...scanResult.data,
        filename: req.file.originalname,
        fileSize: req.file.size,
        canCreateContact: !!(scanResult.data?.contact?.name)
      }
    })

  } catch (error) {
    console.error('Error previewing contact:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to preview contact'
    })
  }
})

/**
 * GET /api/scanner/health
 * Health check for scanner service
 */
router.get('/health', async (req, res) => {
  try {
    // Check if required environment variables are set
    const hasGoogleApiKey = !!process.env.GOOGLE_API_KEY
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        services: {
          ocr: 'available',
          ai: hasGoogleApiKey ? 'available' : 'missing_api_key',
          fileUpload: 'available'
        },
        supportedTypes: ScannerService.getSupportedFileTypes(),
        maxFileSize: ScannerService.getMaxFileSize()
      }
    })
  } catch (error) {
    console.error('Scanner health check error:', error)
    res.status(500).json({
      success: false,
      error: 'Scanner service health check failed'
    })
  }
})

// Error handling middleware for multer
router.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: `File too large. Maximum size is ${ScannerService.getMaxFileSize() / (1024 * 1024)}MB`
      })
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Maximum is 5 files per request'
      })
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Unexpected file field'
      })
    }
  }
  
  res.status(400).json({
    success: false,
    error: error.message || 'File upload error'
  })
})

export default router
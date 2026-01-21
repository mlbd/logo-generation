import express from 'express'
import multer from 'multer'
import * as ftp from 'basic-ftp'
import cors from 'cors'
import dotenv from 'dotenv'
import { Readable } from 'stream'
import path from 'path'

dotenv.config()

const app = express()
const PORT = 3001

// Enable CORS for Vite dev server
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST', 'DELETE']
}))

app.use(express.json())

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() })

// FTP Configuration from .env
const ftpConfig = {
    host: process.env.FTP_HOST,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASS,
    secure: false // Set to true if using FTPS
}

const FTP_PATH = process.env.FTP_PATH || '/uploads'
const FTP_BASE_URL = process.env.FTP_BASE_URL

// Helper function to create FTP client
async function createFTPClient() {
    const client = new ftp.Client()
    client.ftp.verbose = true
    await client.access(ftpConfig)
    return client
}

// Clear uploads folder - delete all files and subdirectories
async function clearUploadsFolder(client) {
    try {
        await client.ensureDir(FTP_PATH)
        const items = await client.list(FTP_PATH)

        for (const item of items) {
            const itemPath = `${FTP_PATH}/${item.name}`

            if (item.type === 2) { // Directory
                // Recursively delete directory and its contents
                await client.removeDir(itemPath)
                console.log(`Deleted folder: ${item.name}`)
            } else if (item.type === 1) { // Regular file
                await client.remove(itemPath)
                console.log(`Deleted file: ${item.name}`)
            }
        }
        console.log('Uploads folder cleared successfully')
    } catch (error) {
        console.error('Error clearing uploads folder:', error.message)
    }
}

// Upload files endpoint
app.post('/api/upload', upload.array('images', 20), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' })
    }

    const client = await createFTPClient()

    try {
        // Clear existing files in uploads folder first
        await clearUploadsFolder(client)

        const uploadedFiles = []

        for (const file of req.files) {
            // Create unique filename with timestamp
            const timestamp = Date.now()
            const ext = path.extname(file.originalname)
            const baseName = path.basename(file.originalname, ext)
            const filename = `${baseName}-${timestamp}${ext}`
            const remotePath = `${FTP_PATH}/${filename}`

            // Convert buffer to readable stream
            const stream = Readable.from(file.buffer)

            // Upload to FTP
            await client.uploadFrom(stream, remotePath)

            // Build public URL
            const publicUrl = `${FTP_BASE_URL}/${filename}`

            uploadedFiles.push({
                originalName: file.originalname,
                filename: filename,
                url: publicUrl,
                size: file.size
            })

            console.log(`Uploaded: ${filename}`)
        }

        res.json({
            success: true,
            files: uploadedFiles
        })

    } catch (error) {
        console.error('FTP Upload Error:', error)
        res.status(500).json({
            success: false,
            error: error.message
        })
    } finally {
        client.close()
    }
})

// Clear uploads folder endpoint
app.delete('/api/clear', async (req, res) => {
    const client = await createFTPClient()

    try {
        await clearUploadsFolder(client)
        res.json({ success: true, message: 'Uploads folder cleared' })
    } catch (error) {
        console.error('Clear Error:', error)
        res.status(500).json({ success: false, error: error.message })
    } finally {
        client.close()
    }
})

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', ftp_host: process.env.FTP_HOST })
})

app.listen(PORT, () => {
    console.log(`🚀 FTP Upload Server running on http://localhost:${PORT}`)
    console.log(`📁 FTP Host: ${process.env.FTP_HOST}`)
    console.log(`📂 Upload Path: ${FTP_PATH}`)
})

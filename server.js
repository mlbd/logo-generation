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

            // Upload to FTP (Ephemeral)
            await client.uploadFrom(stream, remotePath)

            // Upload to Saved Directory (Persistent)
            // We need a fresh stream or buffer for the second upload
            // Since we used Readable.from(file.buffer), we can create another one
            const savedDir = process.env.FTP_SAVED_DIR || '/saved'
            const savedPath = `${savedDir}/${filename}`

            try {
                // Ensure saved directory exists (once per batch ideally, but safe here)
                await client.ensureDir(savedDir)
                const stream2 = Readable.from(file.buffer)
                await client.uploadFrom(stream2, savedPath)
                console.log(`Saved backup: ${savedPath}`)
            } catch (err) {
                console.error('Failed to save backup copy:', err)
                // Don't fail the main request if backup fails
            }

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

// Proxy image endpoint to bypass CORS
app.get('/api/proxy-image', async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.startsWith('image/')) {
            return res.status(400).json({ error: 'URL is not an image' });
        }

        // Forward content type
        res.setHeader('Content-Type', contentType);

        // Pipe the image stream directly to response
        // Using arrayBuffer() since we're using native fetch now
        const arrayBuffer = await response.arrayBuffer();
        res.send(Buffer.from(arrayBuffer));

    } catch (error) {
        console.error('Proxy Error:', error);
        res.status(500).json({ error: 'Failed to fetch image' });
    }
});
// List saved logos endpoint
app.get('/api/saved-logos', async (req, res) => {
    const savedDir = process.env.FTP_SAVED_DIR || '/saved'
    const savedUrlBase = process.env.FTP_SAVED_URL
    const client = await createFTPClient()

    try {
        await client.ensureDir(savedDir)
        const items = await client.list(savedDir)

        // Filter for images only and sort by modification date (newest first)
        const files = items
            .filter(item => item.type === 1 && /\.(jpg|jpeg|png|gif|webp)$/i.test(item.name))
            .sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt))
            .map(item => ({
                name: item.name,
                url: `${savedUrlBase}/${item.name}`,
                size: item.size,
                modifiedAt: item.modifiedAt
            }))

        res.json({ success: true, files })
    } catch (error) {
        console.error('List Saved Error:', error)
        res.status(500).json({ success: false, error: error.message })
    } finally {
        client.close()
    }
})

// Delete saved logos
app.delete('/api/saved-logos', async (req, res) => {
    const { filenames } = req.body
    if (!filenames || !Array.isArray(filenames) || filenames.length === 0) {
        return res.status(400).json({ error: 'No filenames provided' })
    }

    const savedDir = process.env.FTP_SAVED_DIR || '/saved'
    const client = new ftp.Client()
    client.ftp.verbose = true

    try {
        await client.access({
            host: process.env.FTP_HOST,
            user: process.env.FTP_USER,
            password: process.env.FTP_PASSWORD,
            secure: false
        })

        const results = []
        for (const filename of filenames) {
            // Basic sanitization
            const cleanName = filename.replace(/^.*[\\\/]/, '')
            const filePath = `${savedDir}/${cleanName}`

            try {
                await client.remove(filePath)
                results.push({ name: filename, status: 'deleted' })
                console.log(`Deleted saved file: ${filePath}`)
            } catch (err) {
                console.error(`Failed to delete ${filePath}:`, err)
                results.push({ name: filename, status: 'error', error: err.message })
            }
        }

        res.json({ success: true, results })

    } catch (err) {
        console.error('Delete saved files error:', err)
        res.status(500).json({ error: 'Failed to delete saved files' })
    } finally {
        client.close()
    }
})
const distPath = path.resolve('dist')
app.use(express.static(distPath))

// Handle SPA routing - send index.html for all other routes
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, () => {
    console.log(`🚀 FTP Upload Server running on http://localhost:${PORT}`)
    console.log(`📁 FTP Host: ${process.env.FTP_HOST}`)
    console.log(`📂 Upload Path: ${FTP_PATH}`)
})

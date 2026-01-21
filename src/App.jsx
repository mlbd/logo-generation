import React, { useState, useCallback, useEffect } from 'react'
import { ImageDropzone } from '@/components/ImageDropzone'
import { LogoResultRow } from '@/components/LogoResultRow'
import { Progress } from '@/components/ui/progress'
import { uploadMultipleToFTP, clearUploadsFolder } from '@/services/uploadService'
import { generateAllLogoVersions } from '@/services/logoService'
import { Code2, Zap, RotateCcw } from 'lucide-react'

function App() {
    const [isUploading, setIsUploading] = useState(false)
    const [isClearing, setIsClearing] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [results, setResults] = useState([])
    const [processingFiles, setProcessingFiles] = useState([])

    // Clear FTP uploads folder on page load
    useEffect(() => {
        const clearOnLoad = async () => {
            setIsClearing(true)
            await clearUploadsFolder()
            setIsClearing(false)
        }
        clearOnLoad()
    }, [])

    // Handle reset - clear both state and FTP folder
    const handleReset = useCallback(async () => {
        setProcessingFiles([])
        setIsClearing(true)
        await clearUploadsFolder()
        setIsClearing(false)
    }, [])

    const handleFilesSelected = useCallback(async (files) => {
        setIsUploading(true)
        setUploadProgress(0)

        try {
            // Separate files that need FTP upload vs. direct URLs
            const urlFiles = files.filter(f => f.sourceUrl)
            const regularFiles = files.filter(f => !f.sourceUrl)

            let processingItems = []

            // 1. Handle URL files (Direct pass-through)
            const urlResults = urlFiles.map(file => ({
                originalName: file.name,
                filename: file.name,
                url: file.sourceUrl,
                size: file.size
            }))

            // 2. Handle Regular Files (FTP Upload)
            let ftpResults = []
            if (regularFiles.length > 0) {
                ftpResults = await uploadMultipleToFTP(regularFiles, (progress) => {
                    setUploadProgress(progress)
                })
            }

            // Combine results
            const allResults = [...urlResults, ...ftpResults]

            if (allResults.length === 0) {
                setIsUploading(false)
                return
            }

            // Add files to processing state with loading status
            processingItems = allResults.map(item => ({
                filename: item.filename,
                isLoading: true,
                logoVersions: null,
                error: null
            }))

            setProcessingFiles(prev => [...processingItems, ...prev])
            setIsUploading(false)

            // Step 2: Send all requests to n8n in parallel
            await generateAllLogoVersions(allResults, (result) => {
                // Update the specific item when its result comes back
                setProcessingFiles(prev => {
                    const updated = prev.map(item => {
                        if (item.filename === result.filename) {
                            return {
                                ...item,
                                isLoading: false,
                                logoVersions: result.versions,
                                error: result.success ? null : result.error
                            }
                        }
                        return item
                    })
                    return updated
                })
            })

        } catch (error) {
            console.error('Upload failed:', error)
            setIsUploading(false)
        }
    }, [])

    return (
        <div className="min-h-screen gradient-bg">
            <div className="relative z-10 min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
                <div className="max-w-6xl w-full space-y-10 text-center">
                    {/* Header */}
                    <header className="text-center space-y-4 animate-fade-in-up">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20">
                            <Code2 className="w-4 h-4 text-[var(--color-primary)]" />
                            <span className="text-sm font-medium text-[var(--color-primary)]">Python Powered Logo Generation</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">
                            <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                                Smart Logo
                            </span>
                            <br />
                            <span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
                                Generator
                            </span>
                        </h1>

                        <p className="text-lg text-[var(--color-muted-foreground)] mt-5">
                            Upload your images and instantly generate 4 unique logo variations. <br />
                            Powered by Python & Automation technology.
                        </p>
                    </header>

                    {/* Upload Section */}
                    <section className="p-6 sm:p-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>

                        <ImageDropzone
                            onFilesSelected={handleFilesSelected}
                            isUploading={isUploading}
                            isClearing={isClearing}
                        />

                        {/* Upload Progress */}
                        {isUploading && (
                            <div className="mt-6 space-y-2 animate-fade-in-up">
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--color-muted-foreground)]">Uploading images...</span>
                                    <span className="text-[var(--color-primary)] font-medium">{Math.round(uploadProgress)}%</span>
                                </div>
                                <Progress value={uploadProgress} />
                            </div>
                        )}
                    </section>

                    {/* Results Section */}
                    {processingFiles.length > 0 && (
                        <section className="space-y-6">
                            <div className="flex flex-col items-center gap-2">
                                <h2 className="text-2xl font-bold text-[var(--color-foreground)]">
                                    Generated Logos
                                </h2>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-[var(--color-muted-foreground)]">
                                        {processingFiles.filter(f => !f.isLoading).length} / {processingFiles.length} completed
                                    </span>
                                    <button
                                        onClick={handleReset}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-destructive)]/10 hover:bg-[var(--color-destructive)]/20 text-[var(--color-destructive)] text-sm font-medium transition-colors cursor-pointer"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        Reset All
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {processingFiles.map((item, index) => (
                                    <LogoResultRow
                                        key={`${item.filename}-${index}`}
                                        filename={item.filename}
                                        logoVersions={item.logoVersions}
                                        isLoading={item.isLoading}
                                        error={item.error}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* Footer */}
                <footer className="mt-16 text-center text-sm text-[var(--color-muted-foreground)]">
                    <p>Created by Sabbir Ahmed & Mohammad Limon</p>
                </footer>
            </div>
        </div>
    )
}

export default App

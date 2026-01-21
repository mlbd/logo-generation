import React, { useCallback, useState, useRef } from 'react'
import { Upload, Image, X, Loader2, Link as LinkIcon, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ImageDropzone({ onFilesSelected, isUploading, isClearing }) {
    const [isDragging, setIsDragging] = useState(false)
    const [selectedFiles, setSelectedFiles] = useState([])
    const [activeTab, setActiveTab] = useState('upload')
    const [urlInput, setUrlInput] = useState('')
    const [isImporting, setIsImporting] = useState(false)
    const inputRef = useRef(null)

    const isDisabled = isUploading || isClearing || isImporting

    const handleDragOver = useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        const files = Array.from(e.dataTransfer.files).filter(file =>
            file.type.startsWith('image/')
        )

        if (files.length > 0) {
            setSelectedFiles(prev => [...prev, ...files])
        }
    }, [])

    const handleClick = () => {
        inputRef.current?.click()
    }

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files).filter(file =>
            file.type.startsWith('image/')
        )

        if (files.length > 0) {
            setSelectedFiles(prev => [...prev, ...files])
        }
        // Reset input so same file can be selected again
        e.target.value = ''
    }

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleUpload = () => {
        if (selectedFiles.length > 0) {
            onFilesSelected(selectedFiles)
            setSelectedFiles([])
            setUrlInput('')
        }
    }

    const handleUrlImport = async () => {
        if (!urlInput.trim()) return

        setIsImporting(true)
        try {
            // Determine API URL based on environment
            const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3001'
            const proxyUrl = `${API_BASE}/api/proxy-image?url=${encodeURIComponent(urlInput)}`

            const response = await fetch(proxyUrl)
            if (!response.ok) throw new Error('Failed to fetch image')

            const blob = await response.blob()
            const contentType = response.headers.get('content-type') || 'image/png'
            const extension = contentType.split('/')[1] || 'png'

            // Create a filename from the URL or fallback to timestamp
            let filename = 'imported-image'
            try {
                const urlPath = new URL(urlInput).pathname
                const urlName = urlPath.split('/').pop()
                if (urlName) filename = urlName
            } catch (e) { } // Fallback if URL parsing fails

            if (!filename.includes('.')) filename += `.${extension}`

            const file = new File([blob], filename, { type: contentType })

            // Attach original URL so we can skip FTP upload later
            Object.defineProperty(file, 'sourceUrl', {
                value: urlInput,
                writable: false
            })

            setSelectedFiles(prev => [...prev, file])
            setUrlInput('')
            setActiveTab('upload') // Switch back to see result

        } catch (error) {
            console.error('Import error:', error)
            alert('Could not import image from this URL. Please try downloading it and uploading manually.')
        } finally {
            setIsImporting(false)
        }
    }

    return (
        <div className="w-full space-y-4">
            {/* Tabs & Dropzone */}
            <div className="w-full flex flex-col gap-4">
                <div className="flex p-1 bg-[var(--color-muted)]/50 rounded-lg self-center">
                    <button
                        onClick={() => setActiveTab('upload')}
                        disabled={isDisabled}
                        className={cn(
                            "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                            activeTab === 'upload'
                                ? "bg-[var(--color-card)] text-[var(--color-foreground)] shadow-sm"
                                : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                        )}
                    >
                        Upload File
                    </button>
                    <button
                        onClick={() => setActiveTab('url')}
                        disabled={isDisabled}
                        className={cn(
                            "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                            activeTab === 'url'
                                ? "bg-[var(--color-card)] text-[var(--color-foreground)] shadow-sm"
                                : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                        )}
                    >
                        Import URL
                    </button>
                </div>

                {activeTab === 'upload' ? (
                    <div
                        onClick={handleClick}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={cn(
                            "relative w-full min-h-[280px] rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer",
                            "flex flex-col items-center justify-center gap-4 p-8",
                            "hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5",
                            isDragging
                                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 scale-[1.02] animate-pulse-glow"
                                : "border-[var(--color-border)] bg-[var(--color-card)]/30",
                            isDisabled && "pointer-events-none opacity-60"
                        )}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        {isClearing ? (
                            <div className="p-5 rounded-full bg-gradient-to-br from-[var(--color-destructive)]/20 to-[var(--color-accent)]/20">
                                <Loader2 className="w-10 h-10 text-[var(--color-destructive)] animate-spin" />
                            </div>
                        ) : (
                            <div className={cn(
                                "p-5 rounded-full bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-accent)]/20",
                                "transition-transform duration-300",
                                isDragging && "scale-110"
                            )}>
                                <Upload className="w-10 h-10 text-[var(--color-primary)]" />
                            </div>
                        )}

                        <div className="text-center space-y-2">
                            <p className="text-lg font-medium text-[var(--color-foreground)]">
                                {isClearing ? 'Preparing server...' : 'Drop your images here'}
                            </p>
                            <p className="text-sm text-[var(--color-muted-foreground)]">
                                {isClearing ? 'Clearing previous uploads, please wait' : 'or click to browse from your computer'}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
                            <Image className="w-4 h-4" />
                            <span>Supports JPG, PNG, GIF, WebP</span>
                        </div>
                    </div>
                ) : (
                    <div className="relative w-full min-h-[280px] rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-card)]/30 flex flex-col items-center justify-center gap-6 p-8">
                        <div className="p-5 rounded-full bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-accent)]/20">
                            <LinkIcon className="w-10 h-10 text-[var(--color-primary)]" />
                        </div>

                        <div className="w-full max-w-md space-y-4">
                            <div className="text-center space-y-2">
                                <p className="text-lg font-medium text-[var(--color-foreground)]">
                                    Import from URL
                                </p>
                                <p className="text-sm text-[var(--color-muted-foreground)]">
                                    Paste a direct link to an image file
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    placeholder="https://example.com/logo.png"
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                    className="flex-1 px-4 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all placeholder:text-[var(--color-muted-foreground)]/50"
                                    onKeyDown={(e) => e.key === 'Enter' && handleUrlImport()}
                                    disabled={isImporting}
                                />
                                <button
                                    onClick={handleUrlImport}
                                    disabled={!urlInput.trim() || isImporting}
                                    className={cn(
                                        "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2",
                                        "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90",
                                        "disabled:opacity-50 disabled:cursor-not-allowed"
                                    )}
                                >
                                    {isImporting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Plus className="w-4 h-4" />
                                    )}
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
                <div className="space-y-3 animate-fade-in-up">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-[var(--color-foreground)]">
                            Selected files ({selectedFiles.length})
                        </p>
                        <button
                            onClick={handleUpload}
                            disabled={isDisabled}
                            className={cn(
                                "px-6 py-2.5 cursor-pointer rounded-xl font-medium text-sm transition-all duration-200",
                                "bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)]",
                                "text-white shadow-lg hover:shadow-[var(--color-primary)]/30 hover:scale-105",
                                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            )}
                        >
                            {isUploading ? 'Uploading...' : isClearing ? 'Please wait...' : 'Generate Logos'}
                        </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {selectedFiles.map((file, index) => (
                            <div
                                key={index}
                                className="relative group rounded-xl overflow-hidden bg-[var(--color-muted)] aspect-square"
                            >
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt={file.name}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            removeFile(index)
                                        }}
                                        className="p-2 rounded-full bg-[var(--color-destructive)] text-white hover:scale-110 transition-transform"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                    <p className="text-xs text-white truncate">{file.name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

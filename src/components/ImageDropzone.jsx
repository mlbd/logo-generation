import React, { useCallback, useState, useRef, useEffect } from 'react'
import { Upload, Image, X, Loader2, Link as LinkIcon, Plus, Grid, Check, Trash2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ImageDropzone({ onFilesSelected, isUploading, isClearing, uploadProgress }) {
    const [isDragging, setIsDragging] = useState(false)
    const [selectedFiles, setSelectedFiles] = useState([])
    const [activeTab, setActiveTab] = useState('upload')
    const [urlInput, setUrlInput] = useState('')
    const [isImporting, setIsImporting] = useState(false)
    const [savedLogos, setSavedLogos] = useState([])
    const [isLoadingSaved, setIsLoadingSaved] = useState(false)
    const [selectedSavedLogos, setSelectedSavedLogos] = useState([])
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const inputRef = useRef(null)

    const isDisabled = isUploading || isClearing || isImporting

    useEffect(() => {
        if (activeTab === 'library' && savedLogos.length === 0) {
            fetchSavedLogos()
        }
    }, [activeTab])

    const fetchSavedLogos = async () => {
        setIsLoadingSaved(true)
        try {
            const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3001'
            const response = await fetch(`${API_BASE}/api/saved-logos`)
            if (!response.ok) throw new Error('Failed to fetch saved logos')
            const data = await response.json()
            if (data.success) {
                setSavedLogos(data.files)
            }
        } catch (error) {
            console.error('Fetch saved logos error:', error)
        } finally {
            setIsLoadingSaved(false)
        }
    }

    const toggleSavedLogoSelection = (logo) => {
        setSelectedSavedLogos(prev => {
            const exists = prev.find(l => l.name === logo.name)
            if (exists) {
                return prev.filter(l => l.name !== logo.name)
            } else {
                return [...prev, logo]
            }
        })
    }

    const handleAddSelectedLogos = async () => {
        const newFiles = []

        for (const logo of selectedSavedLogos) {
            try {
                // Use proxy to fetch image to avoid CORS issues
                const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3001'
                const proxyUrl = `${API_BASE}/api/proxy-image?url=${encodeURIComponent(logo.url)}`

                const response = await fetch(proxyUrl)
                if (!response.ok) throw new Error('Failed to fetch image via proxy')

                const blob = await response.blob()
                const file = new File([blob], logo.name, { type: blob.type })

                // Attach original URL so we can skip FTP upload
                Object.defineProperty(file, 'sourceUrl', {
                    value: logo.url,
                    writable: false
                })
                newFiles.push(file)
            } catch (error) {
                console.error(`Failed to process saved logo ${logo.name}:`, error)
            }
        }

        setSelectedFiles(prev => [...prev, ...newFiles])
        setSelectedSavedLogos([])
        setActiveTab('upload')
    }

    const handleDeleteClick = () => {
        if (selectedSavedLogos.length > 0) {
            setShowDeleteConfirm(true)
        }
    }

    const confirmDelete = async () => {
        if (selectedSavedLogos.length === 0) return

        setIsDeleting(true)
        try {
            const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3001'
            const response = await fetch(`${API_BASE}/api/saved-logos`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    filenames: selectedSavedLogos.map(l => l.name)
                })
            })

            const data = await response.json()
            if (!data.success) throw new Error(data.error || 'Failed to delete files')

            // Remove deleted files from local state
            const deletedNames = data.results
                .filter(r => r.status === 'deleted')
                .map(r => r.name)

            setSavedLogos(prev => prev.filter(l => !deletedNames.includes(l.name)))
            setSelectedSavedLogos([])
            setShowDeleteConfirm(false)

        } catch (error) {
            console.error('Delete error:', error)
            alert('Failed to delete selected logos')
        } finally {
            setIsDeleting(false)
        }
    }

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
                <div className="flex p-1 bg-[var(--color-muted)]/50 rounded-lg self-center overflow-x-auto max-w-full">
                    <button
                        onClick={() => setActiveTab('upload')}
                        disabled={isDisabled}
                        className={cn(
                            "px-4 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap",
                            activeTab === 'upload'
                                ? "bg-[var(--color-card)] text-[var(--color-foreground)] shadow-sm"
                                : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                        )}
                    >
                        Upload File
                    </button>
                    <button
                        onClick={() => setActiveTab('library')}
                        disabled={isDisabled}
                        className={cn(
                            "px-4 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap flex items-center gap-1.5",
                            activeTab === 'library'
                                ? "bg-[var(--color-card)] text-[var(--color-foreground)] shadow-sm"
                                : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                        )}
                    >
                        <Grid className="w-3.5 h-3.5" />
                        Choose Logo
                    </button>
                    <button
                        onClick={() => setActiveTab('url')}
                        disabled={isDisabled}
                        className={cn(
                            "px-4 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap flex items-center gap-1.5",
                            activeTab === 'url'
                                ? "bg-[var(--color-card)] text-[var(--color-foreground)] shadow-sm"
                                : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                        )}
                    >
                        <LinkIcon className="w-3.5 h-3.5" />
                        Import URL
                    </button>
                </div>

                {activeTab === 'upload' && (
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
                )}

                {activeTab === 'url' && (
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

                {activeTab === 'library' && (
                    <div className="relative w-full h-[400px] rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-card)]/30 flex flex-col overflow-hidden">
                        {isLoadingSaved ? (
                            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-[var(--color-muted-foreground)]">
                                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
                                <p>Loading library...</p>
                            </div>
                        ) : savedLogos.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-[var(--color-muted-foreground)]">
                                <Grid className="w-12 h-12 opacity-20" />
                                <p>No saved logos found in library.</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 content-start">
                                    {savedLogos.map((logo) => {
                                        const isSelected = selectedSavedLogos.some(l => l.name === logo.name)
                                        return (
                                            <div
                                                key={logo.name}
                                                onClick={() => toggleSavedLogoSelection(logo)}
                                                className={cn(
                                                    "group relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-200",
                                                    isSelected
                                                        ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20"
                                                        : "border-transparent hover:border-[var(--color-border)] opacity-80 hover:opacity-100"
                                                )}
                                            >
                                                <img
                                                    src={logo.url}
                                                    alt={logo.name}
                                                    className="w-full h-full object-contain bg-[var(--color-muted)] p-2"
                                                />
                                                {isSelected && (
                                                    <div className="absolute top-2 right-2 md:top-1 md:right-1 bg-[var(--color-primary)] text-white rounded-full p-1 shadow-sm animate-in zoom-in duration-200">
                                                        <Check className="w-3 h-3" />
                                                    </div>
                                                )}
                                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1.5 backdrop-blur-[2px]">
                                                    <p className="text-[10px] text-white truncate text-center">{logo.name}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="p-4 border-t border-[var(--color-border)] flex justify-between items-center bg-[var(--color-card)]">
                                    <span className="text-sm text-[var(--color-muted-foreground)]">
                                        {selectedSavedLogos.length} selected
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {selectedSavedLogos.length > 0 && (
                                            <button
                                                onClick={handleDeleteClick}
                                                className="px-4 py-2 text-sm text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 rounded-lg transition-colors flex items-center gap-2"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete
                                            </button>
                                        )}
                                        <button
                                            onClick={handleAddSelectedLogos}
                                            disabled={selectedSavedLogos.length === 0}
                                            className={cn(
                                                "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2",
                                                "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90",
                                                "disabled:opacity-50 disabled:cursor-not-allowed"
                                            )}
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Selected
                                        </button>
                                    </div>
                                </div>

                                {/* Delete Confirmation Modal */}
                                {showDeleteConfirm && (
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10 p-6 animate-in fade-in duration-200">
                                        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-6 w-full max-w-sm shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
                                            <div className="flex items-center gap-3 text-[var(--color-destructive)]">
                                                <div className="p-2 rounded-full bg-[var(--color-destructive)]/10">
                                                    <AlertTriangle className="w-6 h-6" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-[var(--color-foreground)]">Delete Logos?</h3>
                                            </div>

                                            <p className="text-sm text-[var(--color-muted-foreground)]">
                                                Are you sure you want to delete {selectedSavedLogos.length} selected logo{selectedSavedLogos.length !== 1 && 's'}? This action cannot be undone.
                                            </p>

                                            <div className="flex justify-end gap-3 pt-2">
                                                <button
                                                    onClick={() => setShowDeleteConfirm(false)}
                                                    disabled={isDeleting}
                                                    className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)]/50 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={confirmDelete}
                                                    disabled={isDeleting}
                                                    className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-destructive)] text-white hover:bg-[var(--color-destructive)]/90 transition-colors flex items-center gap-2"
                                                >
                                                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
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
                            {isUploading ? `Uploading ${Math.round(uploadProgress || 0)}%...` : isClearing ? 'Please wait...' : 'Generate Logos'}
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

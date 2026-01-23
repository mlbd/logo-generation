import React, { useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

export function ImageModal({
    isOpen,
    onClose,
    images,
    currentIndex,
    onNavigate,
    title
}) {
    // Handle keyboard navigation
    const handleKeyDown = useCallback((e) => {
        if (!isOpen) return

        if (e.key === 'Escape') {
            onClose()
        } else if (e.key === 'ArrowLeft') {
            onNavigate(currentIndex - 1)
        } else if (e.key === 'ArrowRight') {
            onNavigate(currentIndex + 1)
        }
    }, [isOpen, onClose, onNavigate, currentIndex])

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    if (!isOpen || !images || images.length === 0) return null

    const currentImage = images[currentIndex]
    const hasPrev = currentIndex > 0
    const hasNext = currentIndex < images.length - 1

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />

            {/* Modal Content */}
            <div
                className="relative z-10 w-full max-w-[1400px] mx-2 sm:mx-4 animate-fade-in-up"
                onClick={e => e.stopPropagation()}
            >
                {/* Header with title and close button */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 px-1 sm:px-2 gap-2 sm:gap-0">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-3">
                        <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white truncate max-w-[250px] sm:max-w-none">{title}</h3>
                        <span className="text-xs sm:text-sm text-white/60">
                            {currentImage?.label} ({currentIndex + 1} of {images.length})
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-0 right-0 sm:relative p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                        <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </button>
                </div>

                {/* Image Container */}
                <div
                    className="relative glass-card p-2 sm:p-3 md:p-4 rounded-2xl overflow-hidden transition-colors duration-300"
                    style={{ backgroundColor: currentImage?.background || '#0d0d15' }}
                >
                    {/* Main Image */}
                    <div className="flex items-center justify-center min-h-[50vh] max-h-[60vh] sm:min-h-[60vh] sm:max-h-[75vh]">
                        <img
                            src={currentImage?.url}
                            alt={currentImage?.label}
                            className="max-w-full max-h-[60vh] sm:max-h-[70vh] object-contain rounded-lg"
                            style={{ imageRendering: 'auto' }}
                        />
                    </div>

                    {/* Navigation Buttons */}
                    {hasPrev && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onNavigate(currentIndex - 1)
                            }}
                            className={cn(
                                "absolute left-2 sm:left-4 top-1/2 -translate-y-1/2",
                                "p-2 sm:p-3 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm",
                                "border border-white/10 hover:border-white/20",
                                "transition-all duration-200 hover:scale-110",
                                "group"
                            )}
                        >
                            <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white group-hover:text-[var(--color-primary)]" />
                        </button>
                    )}

                    {hasNext && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onNavigate(currentIndex + 1)
                            }}
                            className={cn(
                                "absolute right-2 sm:right-4 top-1/2 -translate-y-1/2",
                                "p-2 sm:p-3 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm",
                                "border border-white/10 hover:border-white/20",
                                "transition-all duration-200 hover:scale-110",
                                "group"
                            )}
                        >
                            <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white group-hover:text-[var(--color-primary)]" />
                        </button>
                    )}
                </div>

                {/* Thumbnails */}
                <div className="flex items-center justify-start sm:justify-center gap-2 sm:gap-3 mt-3 sm:mt-4 overflow-x-auto px-2 sm:px-0">
                    {images.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => onNavigate(idx)}
                            className={cn(
                                "relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg overflow-hidden transition-all duration-200 flex-shrink-0",
                                "border-2",
                                idx === currentIndex
                                    ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/30 scale-110"
                                    : "border-white/10 hover:border-white/30 opacity-60 hover:opacity-100"
                            )}
                            style={{ backgroundColor: img.background || '#1a1a2e' }}
                        >
                            <img
                                src={img.url}
                                alt={img.label}
                                className="w-full h-full object-contain p-1"
                            />
                        </button>
                    ))}
                </div>

                {/* Version Label */}
                <div className="text-center mt-3 sm:mt-4">
                    <span className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-xs sm:text-sm font-medium">
                        {currentImage?.label}
                    </span>
                </div>
            </div>
        </div>
    )
}

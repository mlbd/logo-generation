import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Loader2, Image, CheckCircle2 } from 'lucide-react'
import { ImageModal } from './ImageModal'

export function LogoResultRow({ filename, logoVersions, isLoading, error }) {
    const [modalOpen, setModalOpen] = useState(false)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    const handleImageClick = (index) => {
        setCurrentImageIndex(index)
        setModalOpen(true)
    }

    const handleNavigate = (index) => {
        if (index >= 0 && index < (logoVersions?.length || 0)) {
            setCurrentImageIndex(index)
        }
    }

    return (
        <>
            <div
                className={cn(
                    "glass-card p-6 animate-fade-in-up",
                    "border border-[var(--color-border)] hover:border-[var(--color-primary)]/30",
                    "transition-all duration-300"
                )}
            >
                {/* Header with filename */}
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-accent)]/20">
                        <Image className="w-5 h-5 text-[var(--color-primary)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[var(--color-foreground)] truncate">
                            {filename}
                        </h3>
                        <p className="text-xs text-[var(--color-muted-foreground)]">
                            {isLoading ? 'Generating logo versions...' : error ? 'Generation failed' : `${logoVersions?.length || 0} versions generated`}
                        </p>
                    </div>
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 text-[var(--color-primary)] animate-spin" />
                    ) : error ? (
                        <div className="text-[var(--color-destructive)] text-sm">{error}</div>
                    ) : (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                </div>

                {/* Logo versions grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {isLoading ? (
                        // Loading skeletons
                        [...Array(4)].map((_, i) => (
                            <div
                                key={i}
                                className="aspect-square rounded-xl skeleton"
                            />
                        ))
                    ) : error ? (
                        // Error state
                        [...Array(4)].map((_, i) => (
                            <div
                                key={i}
                                className="aspect-square rounded-xl bg-[var(--color-muted)] flex items-center justify-center"
                            >
                                <span className="text-xs text-[var(--color-muted-foreground)]">Failed</span>
                            </div>
                        ))
                    ) : (
                        // Actual logo versions
                        logoVersions?.map((version, i) => (
                            <div
                                key={version.key || i}
                                onClick={() => handleImageClick(i)}
                                className={cn(
                                    "relative aspect-square rounded-xl overflow-hidden",
                                    "group cursor-pointer",
                                    "hover:ring-2 hover:ring-[var(--color-primary)] transition-all duration-200",
                                    "hover:scale-[1.02]"
                                )}
                                style={{ backgroundColor: version.background || '#1a1a2e' }}
                            >
                                <img
                                    src={version.url}
                                    alt={version.label}
                                    className="w-full h-full object-contain p-2"
                                    onError={(e) => {
                                        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🖼️</text></svg>'
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <div className="absolute bottom-2 left-2 right-2 text-center">
                                        <p className="text-xs text-white font-medium bg-black/30 rounded-full px-2 py-1 inline-block">
                                            {version.label}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Image Modal */}
            <ImageModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                images={logoVersions}
                currentIndex={currentImageIndex}
                onNavigate={handleNavigate}
                title={filename}
            />
        </>
    )
}

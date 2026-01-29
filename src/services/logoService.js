const N8N_WEBHOOK_URL = 'https://n8n.limon.dev/webhook/final-variant'

// Version label mapping
const VERSION_LABELS = {
    original_black: 'Original',
    original_white: 'Original White',
    bw_black: 'B&W Black',
    bw_white: 'B&W White'
}

// Background color mapping - white bg for black logos, black bg for white logos
const VERSION_BACKGROUNDS = {
    original_black: '#ffffff',
    original_white: '#000000',
    bw_black: '#ffffff',
    bw_white: '#000000'
}

// Add cache-busting parameter to URL
function addCacheBuster(url) {
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}t=${Date.now()}`
}

export async function generateLogoVersions(imageUrl) {
    const url = new URL(N8N_WEBHOOK_URL)
    url.searchParams.append('imageUrl', imageUrl)

    try {
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        // Map the API response to our version format with labels
        const versionKeys = ['original_black', 'original_white', 'bw_black', 'bw_white']
        const versions = versionKeys.map(key => ({
            key: key,
            label: VERSION_LABELS[key] || key,
            background: VERSION_BACKGROUNDS[key] || '#1a1a2e',
            url: data[key] ? addCacheBuster(data[key]) : null
        })).filter(v => v.url)

        return {
            success: true,
            versions: versions
        }
    } catch (error) {
        console.error('Error generating logo versions:', error)
        return {
            success: false,
            error: error.message
        }
    }
}

export async function generateAllLogoVersions(imageUrls, onResult) {
    // Process requests sequentially (one by one) to avoid "too many FTP requests" error
    const results = []

    for (const item of imageUrls) {
        try {
            const result = await generateLogoVersions(item.url)

            const itemResult = {
                filename: item.filename,
                ...result
            }

            // Call the callback with each result as it completes
            if (onResult) {
                onResult(itemResult)
            }

            results.push(itemResult)
        } catch (error) {
            const errorResult = {
                filename: item.filename,
                success: false,
                error: error.message
            }

            if (onResult) {
                onResult(errorResult)
            }

            results.push(errorResult)
        }
    }

    return results
}

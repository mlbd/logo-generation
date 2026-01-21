const API_BASE_URL = 'http://localhost:3001'

export async function uploadToFTP(files) {
    const formData = new FormData()

    // Append all files to FormData
    for (const file of files) {
        formData.append('images', file)
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/upload`, {
            method: 'POST',
            body: formData
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Upload failed')
        }

        const data = await response.json()

        if (!data.success) {
            throw new Error(data.error || 'Upload failed')
        }

        return data.files.map(file => ({
            success: true,
            url: file.url,
            filename: file.originalName
        }))

    } catch (error) {
        console.error('Upload error:', error)
        throw error
    }
}

export async function uploadMultipleToFTP(files, onProgress) {
    // Upload all files at once to the backend
    // The backend will clear the folder and upload all files
    if (onProgress) onProgress(10)

    try {
        const results = await uploadToFTP(files)
        if (onProgress) onProgress(100)
        return results
    } catch (error) {
        throw error
    }
}

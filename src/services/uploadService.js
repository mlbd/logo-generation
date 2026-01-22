const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:3001'

export async function uploadToFTP(files, onProgress) {
    const formData = new FormData()

    // Append all files to FormData
    for (const file of files) {
        formData.append('images', file)
    }

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `${API_BASE_URL}/api/upload`)

        // Track upload progress
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && onProgress) {
                const percentComplete = Math.round((event.loaded / event.total) * 100)
                // Normalize slightly to usually max out at 95% until response comes back
                const displayPercent = Math.min(95, percentComplete)
                onProgress(displayPercent)
            }
        }

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const data = JSON.parse(xhr.responseText)
                    if (data.success) {
                        const results = data.files.map(file => ({
                            success: true,
                            url: file.url,
                            filename: file.originalName
                        }))
                        if (onProgress) onProgress(100)
                        resolve(results)
                    } else {
                        reject(new Error(data.error || 'Upload failed'))
                    }
                } catch (e) {
                    reject(new Error('Invalid response from server'))
                }
            } else {
                reject(new Error(xhr.statusText || 'Upload failed'))
            }
        }

        xhr.onerror = () => reject(new Error('Network error during upload'))

        xhr.send(formData)
    })
}

export async function uploadMultipleToFTP(files, onProgress) {
    // Upload all files at once to the backend
    // The backend will clear the folder and upload all files
    // Initial obscure progress
    if (onProgress) onProgress(1)

    try {
        // Pass onProgress to track real XHR progress
        const results = await uploadToFTP(files, onProgress)
        return results
    } catch (error) {
        throw error
    }
}

// Clear uploads folder on FTP server
export async function clearUploadsFolder() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/clear`, {
            method: 'DELETE'
        })

        if (!response.ok) {
            console.error('Failed to clear uploads folder')
            return false
        }

        const data = await response.json()
        console.log('Uploads folder cleared:', data.message)
        return data.success
    } catch (error) {
        console.error('Error clearing uploads folder:', error)
        return false
    }
}

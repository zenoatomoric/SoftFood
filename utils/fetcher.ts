export const fetcher = async (url: string) => {
    const res = await fetch(url)
    if (!res.ok) {
        console.error(`❌ Fetch failed for: ${url}`, { status: res.status })
        const error = new Error('An error occurred while fetching the data.')
        // Attach extra info to the error object.
        try {
            const info = await res.json()
                ; (error as any).info = info
        } catch (e) {
            ; (error as any).info = 'Could not parse error response JSON'
        }
        ; (error as any).status = res.status
        throw error
    }
    return res.json()
}

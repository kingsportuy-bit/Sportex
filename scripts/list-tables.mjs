async function listTables() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/'
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('📡 Listing tables via OpenAPI:', url)

    try {
        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`
            }
        })

        console.log('📊 Status:', res.status)
        const data = await res.json()
        console.log('📄 Tables found:', Object.keys(data.paths).filter(p => !p.includes('/rpc/')))
    } catch (e) {
        console.error('💥 Error:', e)
    }
}

listTables()

async function testFetch() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/sportex_usuarios'
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('📡 Fetching:', url)

    try {
        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`,
                'Range': '0-0'
            }
        })

        console.log('📊 Status:', res.status, res.statusText)
        const text = await res.text()
        console.log('📄 Body:', text)
    } catch (e) {
        console.error('💥 Fetch Error:', e)
    }
}

testFetch()

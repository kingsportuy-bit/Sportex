async function testInsertFetch() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/sportex_usuarios'
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('📡 Inserting via fetch:', url)

    const body = {
        email: `test_${Date.now()}@example.com`,
        password: 'password123',
        nombre_empresa: 'Empresa Test'
    }

    try {
        const res = await fetch(url + '?select=*', {
            method: 'POST',
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(body)
        })

        console.log('📊 Status:', res.status, res.statusText)
        const text = await res.text()
        console.log('📄 Body:', text)
    } catch (e) {
        console.error('💥 Fetch Error:', e)
    }
}

testInsertFetch()

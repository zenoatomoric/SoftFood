const fs = require('fs')
const env = fs.readFileSync('.env.local', 'utf8')
const getVal = (key) => env.split('\n').find(l => l.startsWith(key)).split('=')[1].trim().replace(/['"]/g, '')

const url = getVal('NEXT_PUBLIC_SUPABASE_URL')
const key = getVal('NEXT_PUBLIC_SUPABASE_ANON_KEY')

async function check() {
    const res = await fetch(`${url}/rest/v1/users?select=sv_code,role`, {
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`
        }
    })
    const data = await res.json()
    console.log(JSON.stringify(data, null, 2))
}

check()

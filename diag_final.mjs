
const URL = 'https://ptxsvtzhxbpzsyiilzgc.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0eHN2dHpoeGJwenN5aWlsemdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTAxMjYsImV4cCI6MjA4NzI2NjEyNn0.rq8gizWtU1Kk739uOlXipq8R9HLPPkr4NwPoy-G79CI';

async function check() {
    try {
        console.log('--- Checking menu_photos table ---');
        const response = await fetch(`${URL}/rest/v1/menu_photos?select=*&limit=5`, {
            headers: {
                'apikey': KEY,
                'Authorization': `Bearer ${KEY}`
            }
        });
        const data = await response.json();
        console.log('Data:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}

check();

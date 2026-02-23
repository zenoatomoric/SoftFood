
const URL = 'https://ptxsvtzhxbpzsyiilzgc.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0eHN2dHpoeGJwenN5aWlsemdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTAxMjYsImV4cCI6MjA4NzI2NjEyNn0.rq8gizWtU1Kk739uOlXipq8R9HLPPkr4NwPoy-G79CI';

async function check() {
    console.log('Checking menu_photos table...');
    const res = await fetch(`${URL}/rest/v1/menu_photos?select=*&limit=3`, {
        headers: {
            'apikey': KEY,
            'Authorization': `Bearer ${KEY}`
        }
    });
    const data = await res.json();
    console.log('Menu Photos Sample:', JSON.stringify(data, null, 2));

    console.log('\nChecking menus with photos...');
    const res2 = await fetch(`${URL}/rest/v1/menus?select=menu_id,menu_name,menu_photos(*)&limit=3`, {
        headers: {
            'apikey': KEY,
            'Authorization': `Bearer ${KEY}`
        }
    });
    const data2 = await res2.json();
    console.log('Menus with Photos Sample:', JSON.stringify(data2, null, 2));
}

check();


const URL = 'https://ptxsvtzhxbpzsyiilzgc.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0eHN2dHpoeGJwenN5aWlsemdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTAxMjYsImV4cCI6MjA4NzI2NjEyNn0.rq8gizWtU1Kk739uOlXipq8R9HLPPkr4NwPoy-G79CI';

async function check() {
    try {
        console.log('--- Checking menu_photos table ---');
        const res = await fetch(`${URL}/rest/v1/menu_photos?select=*&limit=5`, {
            headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
        });
        const photos = await res.json();
        console.log('Photos count:', photos.length);
        if (photos.length > 0) {
            console.log('Sample Photo URL:', photos[0].photo_url);
            console.log('Sample Photo ref_menu_id:', photos[0].ref_menu_id);
        }

        console.log('\n--- Checking menus with photos join ---');
        // Using query parameters for join
        const res2 = await fetch(`${URL}/rest/v1/menus?select=menu_id,menu_name,menu_photos(photo_url)&limit=3`, {
            headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
        });
        const menus = await res2.json();
        console.log('Menus found:', menus.length);
        menus.forEach(m => {
            console.log(`Menu: ${m.menu_name} (ID: ${m.menu_id})`);
            console.log(`- Photos count: ${m.menu_photos?.length || 0}`);
            if (m.menu_photos?.length > 0) {
                console.log(`- First Photo URL: ${m.menu_photos[0].photo_url}`);
            }
        });

    } catch (e) {
        console.error('Error during check:', e);
    }
}

check();

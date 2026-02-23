
const URL = 'https://ptxsvtzhxbpzsyiilzgc.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0eHN2dHpoeGJwenN5aWlsemdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTAxMjYsImV4cCI6MjA4NzI2NjEyNn0.rq8gizWtU1Kk739uOlXipq8R9HLPPkr4NwPoy-G79CI';

async function check() {
    try {
        console.log('--- Checking menu_photos RAW content ---');
        const res = await fetch(`${URL}/rest/v1/menu_photos?select=photo_url,ref_menu_id&limit=10`, {
            headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
        });
        const photos = await res.json();

        if (photos.error) {
            console.error('Error fetching photos:', photos.error);
            return;
        }

        photos.forEach((p, i) => {
            console.log(`[${i}] Menu ID: ${p.ref_menu_id}`);
            console.log(`    Stored URL: "${p.photo_url}"`);

            const resolved = p.photo_url?.startsWith('http')
                ? p.photo_url
                : `${URL}/storage/v1/object/public/images/${p.photo_url}`;

            console.log(`    Resolved URL: "${resolved}"`);
        });

    } catch (e) {
        console.error('Error:', e);
    }
}

check();

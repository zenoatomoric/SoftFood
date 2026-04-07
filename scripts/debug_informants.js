
const fetch = require('node-fetch');

async function debugInformants() {
    const res = await fetch('http://localhost:3000/api/survey/informant?limit=10');
    const json = await res.json();
    console.log('Total:', json.total);
    console.log('Sample Informants:');
    json.data.slice(0, 3).forEach((item, i) => {
        console.log(`Informant ${i}: ${item.full_name}`);
        console.log(`Canal Zone: "${item.canal_zone}"`);
    });
}

debugInformants();


const fetch = require('node-fetch');

async function debug() {
    const res = await fetch('http://localhost:3000/api/food?limit=10');
    const json = await res.json();
    console.log('Sample Data (First 2):');
    json.data.slice(0, 2).forEach((item, i) => {
        console.log(`Item ${i}: ${item.menu_name}`);
        console.log(`Informant Data:`, item.informants);
        console.log(`Canal Zone: ${item.canal_zone}`);
    });
}

debug();

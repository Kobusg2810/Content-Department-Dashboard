
const url = 'https://docs.google.com/spreadsheets/d/1pPLg73v48miIY48XEbP8NdWp1fUB9zBJBlDy3F8X4Ys/export?format=csv&gid=0';

async function testFetch() {
    console.log('Testing Fetch...');
    try {
        const res = await fetch(url);
        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Length:', text.length);
        console.log('Preview:', text.substring(0, 500));

        if (text.trim().startsWith('<')) {
            console.error('❌ ERROR: Received HTML. Sheet is NOT published to web.');
        } else {
            console.log('✅ SUCCESS: Received CSV data.');
        }
    } catch (e) {
        console.error('Fetch Failed:', e);
    }
}

testFetch();

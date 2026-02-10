import fs from 'fs';

async function testApi() {
    try {
        const response = await fetch('http://localhost:5000/api/news/public');
        const data = await response.json();
        fs.writeFileSync('api-news-output.json', JSON.stringify(data, null, 2));
        console.log("Output written to api-news-output.json");
    } catch (error) {
        fs.writeFileSync('api-news-error.txt', error.message);
    }
}

testApi();

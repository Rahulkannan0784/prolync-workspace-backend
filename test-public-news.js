async function testApi() {
    try {
        const response = await fetch('http://localhost:5000/api/news/public');
        const data = await response.json();
        console.log("Public News API Response:");
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Fetch failed:", error.message);
    }
}

testApi();

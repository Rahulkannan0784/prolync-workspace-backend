
// Native fetch is available in Node 22
async function testApi() {
    try {
        console.log("Fetching https://workspace.prolync.in/api/jobs ...");
        const response = await fetch('https://workspace.prolync.in/api/jobs');
        console.log("Status:", response.status);
        console.log("StatusText:", response.statusText);

        if (response.ok) {
            const data = await response.json();
            console.log("Data length:", data.length);
            //console.log("First item:", data[0]);
        } else {
            const text = await response.text();
            console.log("Error Body:", text);
        }
    } catch (error) {
        console.error("Fetch failed:", error.message);
        if (error.cause) console.error("Cause:", error.cause);
    }
}

testApi();

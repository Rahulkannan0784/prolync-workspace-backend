
const testProjectsApi = async () => {
    try {
        console.log("Sending GET request to https://workspace.prolync.in/api/projects/all ...");
        const response = await fetch('https://workspace.prolync.in/api/projects/all');

        if (response.ok) {
            const data = await response.json();
            console.log("Projects Fetched Successfully:", JSON.stringify(data, null, 2));
        } else {
            console.error("Failed:", response.status, response.statusText);
            const text = await response.text();
            console.error("Response:", text);
        }
    } catch (error) {
        console.error("Error:", error);
    }
};

testProjectsApi();

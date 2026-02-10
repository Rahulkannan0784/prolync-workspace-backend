
import { getStudentPerformance } from './controllers/hodController.js';
import db from './config/db.js';

async function test() {
    try {
        console.log("--- STARTING TEST ---");

        // 1. Get a valid HOD to mock the request
        const [hods] = await db.query('SELECT * FROM hod LIMIT 1');
        if (hods.length === 0) {
            console.error("No HOD found in DB!");
            process.exit(1);
        }
        const hod = hods[0];
        console.log("Using HOD:", hod.college, hod.department);

        // 2. Mock Request and Response
        const req = {
            hod: hod
        };
        const res = {
            json: (data) => {
                console.log("SUCCESS! Data received:");
                console.log("Count:", data.length);
                if (data.length > 0) console.log("First Item:", data[0]);
                else console.log("DATA IS EMPTY array []");
            },
            status: (code) => {
                console.log("SET STATUS:", code);
                return res; // chainable
            }
        };

        // 3. Run the function
        await getStudentPerformance(req, res);
        console.log("--- TEST COMPLETE ---");
        process.exit(0);

    } catch (e) {
        console.error("CRITICAL TEST FAILURE:", e);
        process.exit(1);
    }
}
test();

import db from './config/db.js';

const fetchKits = async () => {
    try {
        const [kits] = await db.query('SELECT * FROM coding_kits');
        console.log("Total Kits Found:", kits.length);
        console.log(JSON.stringify(kits, null, 2));
    } catch (error) {
        console.error("Error fetching kits:", error);
    }
};

fetchKits();

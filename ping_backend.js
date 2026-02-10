


async function ping() {
    try {
        const res = await fetch('http://localhost:5000/api/test');
        if (res.ok) {
            console.log('Backend is UP:', await res.json());
        } else {
            console.log('Backend returned error:', res.status);
        }
    } catch (e) {
        console.log('Backend is DOWN/UNREACHABLE:', e.message);
    }
}
ping();

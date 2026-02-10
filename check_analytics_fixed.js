
(async () => {
    try {
        // 1. Login (Correct Path)
        const loginRes = await fetch('https://workspace.prolync.in/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@example.com', password: 'adminpassword' })
        });

        if (!loginRes.ok) {
            console.error('Login Failed:', loginRes.status, loginRes.statusText);
            const txt = await loginRes.text();
            console.error('Response:', txt);
            return;
        }

        const loginData = await loginRes.json();
        const token = loginData.token;

        // 2. Get Questions to find an ID
        const qRes = await fetch('https://workspace.prolync.in/api/coding', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const questions = await qRes.json();
        if (questions.length === 0) { console.log('No questions found'); return; }

        const qId = questions[0].id;
        console.log('Testing Analytics for Question ID:', qId);

        // 3. Get Analytics
        const analyticsRes = await fetch(`https://workspace.prolync.in/api/coding/admin/${qId}/analytics`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!analyticsRes.ok) {
            console.error('Analytics Failed:', analyticsRes.status);
            return;
        }

        const analytics = await analyticsRes.json();

        console.log('Analytics Response Status:', analyticsRes.status);
        if (analytics.stats) console.log('Stats:', analytics.stats);
        if (analytics.submissions) console.log('Submissions Count:', analytics.submissions.length);

    } catch (e) { console.error(e); }
})();

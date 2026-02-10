
(async () => {
    try {
        // 1. Login
        const loginRes = await fetch('https://workspace.prolync.in/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@example.com', password: 'adminpassword' })
        });
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
        const analytics = await analyticsRes.json();

        console.log('Analytics Response Status:', analyticsRes.status);
        if (analytics.stats) console.log('Stats:', analytics.stats);
        if (analytics.submissions) console.log('Submissions Count:', analytics.submissions.length);

    } catch (e) { console.error(e); }
})();

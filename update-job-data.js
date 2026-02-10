import db from './config/db.js';

const updateJobData = async () => {
    try {
        const [jobs] = await db.query('SELECT job_id, job_title FROM jobs');

        for (const job of jobs) {
            let description = '';
            let skills = '';
            let responsibilities = '';
            let eligibility = '';

            const title = job.job_title.toLowerCase();

            if (title.includes('software') || title.includes('developer') || title.includes('sde') || title.includes('engineering')) {
                description = 'We are looking for a passionate Software Engineer to join our dynamic team. You will be responsible for building scalable web applications and collaborating with cross-functional teams to deliver high-quality software solutions.';
                skills = 'React, Node.js, JavaScript, TypeScript, SQL, Git, AWS';
                responsibilities = 'Develop and maintain web applications\nWrite clean, maintainable, and efficient code\nCollaborate with designers and product managers\nTroubleshoot and debug issues\nParticipate in code reviews';
                eligibility = 'B.Tech/B.E. in Computer Science or related field\nGood understanding of data structures and algorithms\nStrong problem-solving skills\nBasic knowledge of web technologies';
            } else if (title.includes('analyst') || title.includes('data')) {
                description = 'Join our data team as a Data Analyst. You will be responsible for interpreting data, analyzing results using statistical techniques, and providing ongoing reports to help drive business decisions.';
                skills = 'Python, SQL, Power BI, Excel, Statistics, Data Visualization';
                responsibilities = 'Collect and interpret data\nIdentify patterns and trends in data sets\nCreate visualizations and reports\nCollaborate with stakeholders to understand data needs\nClean and maintain database systems';
                eligibility = 'Degree in Mathematics, Statistics, Computer Science or Economics\nAnalytical mind with a penchant for statistics\nProficiency in SQL and Python\nAttention to detail';
            } else if (title.includes('designer') || title.includes('ui') || title.includes('ux')) {
                description = 'We are seeking a creative UI/UX Designer to design functional and aesthetically pleasing interfaces for our users. You will work closely with developers to ensure seamless integration of design and functionality.';
                skills = 'Figma, Adobe XD, CSS, Responsive Design, User Research, Prototyping';
                responsibilities = 'Create wireframes, prototypes, and high-fidelity designs\nConduct user research and usability testing\nDevelop and maintain design systems\nCollaborate with developers on front-end implementation\nAdvocate for user-centric design principles';
                eligibility = 'Bachelor degree in Design or related field\nStrong portfolio of design projects\nProficiency in design tools like Figma\nUnderstanding of HTML/CSS is a plus';
            } else {
                // Generic default
                description = 'Exciting opportunity for a ' + job.job_title + ' to join our growing organization. We offer a collaborative work environment and opportunities for career growth.';
                skills = 'Communication, Problem Solving, Teamwork, Adaptability';
                responsibilities = 'Assist in daily operations and tasks\nSupport department goals and initiatives\nCollaborate with team members on various projects\nMaintain documentation and reports';
                eligibility = 'Any graduate degree\nExcellent communication and interpersonal skills\nStrong willingness to learn\nAbility to work in a fast-paced environment';
            }

            await db.query(`UPDATE jobs SET job_description = ?, required_skills = ?, responsibilities = ?, eligibility = ? WHERE job_id = ?`,
                [description, skills, responsibilities, eligibility, job.job_id]);
        }

        console.log('Successfully updated job descriptions and skills for all ' + jobs.length + ' jobs.');
        process.exit();
    } catch (err) {
        console.error('Error updating job data:', err);
        process.exit(1);
    }
};

updateJobData();

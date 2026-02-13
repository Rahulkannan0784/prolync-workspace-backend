import db from '../config/db.js';

const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-');
};


// Get all jobs (with optional filters)
export const getAllJobs = async (req, res) => {
    try {
        const { type, status } = req.query;
        let query = 'SELECT * FROM jobs';
        const params = [];

        if (type || status) {
            query += ' WHERE';
            if (type) {
                query += ' job_type = ?';
                params.push(type);
            }
            if (status) {
                if (type) query += ' AND';
                query += ' status = ?';
                params.push(status);
            }
        }

        query += ' ORDER BY created_at DESC';

        const [jobs] = await db.query(query, params);
        res.json(jobs);
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ message: 'Server error fetching jobs' });
    }
};

// Get Single Job by ID
export const getJobById = async (req, res) => {
    try {
        const { id } = req.params;
        const [jobs] = await db.query('SELECT * FROM jobs WHERE job_id = ?', [id]);

        if (jobs.length === 0) {
            return res.status(404).json({ message: 'Job not found' });
        }

        res.json(jobs[0]);
    } catch (error) {
        console.error('Error fetching job:', error);
        res.status(500).json({ message: 'Server error fetching job' });
    }
};

// Get Single Job by Slug
export const getJobBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const [jobs] = await db.query('SELECT * FROM jobs WHERE slug = ?', [slug]);

        if (jobs.length === 0) {
            return res.status(404).json({ message: 'Job not found' });
        }

        res.json(jobs[0]);
    } catch (error) {
        console.error('Error fetching job by slug:', error);
        res.status(500).json({ message: 'Server error fetching job' });
    }
};


// Create a new job
export const createJob = async (req, res) => {
    try {
        const {
            job_title, company_name, job_type, work_mode, location,
            salary_package, required_skills, job_description,
            responsibilities, eligibility,
            application_deadline, application_link, status
        } = req.body;

        const [result] = await db.query(
            `INSERT INTO jobs (
                job_title, slug, company_name, job_type, work_mode, location,
                salary_package, required_skills, job_description,
                responsibilities, eligibility,
                application_deadline, application_link, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                job_title, slugify(job_title), company_name, job_type, work_mode, location,
                salary_package, required_skills, job_description,
                responsibilities, eligibility,
                application_deadline, application_link, status || 'Active'
            ]
        );

        // After insert, we can refine the slug with the ID to ensure absolute uniqueness
        const jobId = result.insertId;
        const finalSlug = `${jobId}-${slugify(job_title + ' ' + company_name)}`;
        await db.query('UPDATE jobs SET slug = ? WHERE job_id = ?', [finalSlug, jobId]);


        const [newJob] = await db.query('SELECT * FROM jobs WHERE job_id = ?', [result.insertId]);
        res.status(201).json(newJob[0]);
    } catch (error) {
        console.error('Error creating job:', error);
        res.status(500).json({
            message: 'Server error creating job',
            error: error.message,
            sqlMessage: error.sqlMessage
        });
    }
};

// Update a job
export const updateJob = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            job_title, company_name, job_type, work_mode, location,
            salary_package, required_skills, job_description,
            responsibilities, eligibility,
            application_deadline, application_link, status
        } = req.body;

        const newSlug = `${id}-${slugify(job_title + ' ' + company_name)}`;

        await db.query(
            `UPDATE jobs SET
                job_title = ?, slug = ?, company_name = ?, job_type = ?, work_mode = ?,
                location = ?, salary_package = ?, required_skills = ?,
                job_description = ?, responsibilities = ?, eligibility = ?,
                application_deadline = ?, application_link = ?, status = ?
            WHERE job_id = ?`,
            [
                job_title, newSlug, company_name, job_type, work_mode,
                location, salary_package, required_skills, job_description,
                responsibilities, eligibility,
                application_deadline, application_link, status,
                id
            ]
        );


        const [updatedJob] = await db.query('SELECT * FROM jobs WHERE job_id = ?', [id]);
        res.json(updatedJob[0]);
    } catch (error) {
        console.error('Error updating job:', error);
        res.status(500).json({ message: 'Server error updating job' });
    }
};

// Delete a job
export const deleteJob = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM jobs WHERE job_id = ?', [id]);
        res.json({ message: 'Job deleted successfully' });
    } catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).json({ message: 'Server error deleting job' });
    }
};

// Track Job Application (Student)
export const trackJobApplication = async (req, res) => {
    try {
        const { job_id } = req.body;
        const user_id = req.user.id;

        // Check if already applied
        const [existing] = await db.query('SELECT * FROM job_applications WHERE user_id = ? AND job_id = ?', [user_id, job_id]);
        if (existing.length > 0) {
            return res.status(200).json({ message: 'Already tracked' });
        }

        // Insert into job_applications table (Try/Catch to be safe)
        try {
            await db.query('INSERT INTO job_applications (user_id, job_id, applied_at) VALUES (?, ?, NOW())', [user_id, job_id]);
        } catch (appErr) {
            console.warn("Job application table insert failed (might not exist):", appErr.message);
        }

        // Log to Activity Logs (Independent Try/Catch)
        try {
            await db.query(
                'INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
                [user_id, 'APPLIED_JOB', `Applied to job ID: ${job_id}`, req.ip || '0.0.0.0']
            );
        } catch (logErr) { console.error("Activity logging failed", logErr); }

        res.status(200).json({ message: 'Application tracked' });
    } catch (error) {
        console.error('Error tracking application:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get My Job Applications
export const getMyApplications = async (req, res) => {
    try {
        const user_id = req.user.id;
        const [rows] = await db.query(`
            SELECT j.*, ja.applied_at, ja.status as application_status
            FROM jobs j
            JOIN job_applications ja ON j.job_id = ja.job_id
            WHERE ja.user_id = ?
            ORDER BY ja.applied_at DESC
        `, [user_id]);

        res.json(rows);
    } catch (error) {
        console.error('Error fetching my applications:', error);
        res.status(500).json({ message: 'Server error fetching applications' });
    }
};

// Increment Job View
export const incrementJobView = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE jobs SET views = views + 1 WHERE job_id = ?', [id]);
        res.status(200).json({ message: 'View incremented' });
    } catch (error) {
        console.error('Error incrementing view:', error);
        res.status(500).json({ message: 'Server error incrementing view' });
    }
};

// Toggle Save Job
export const toggleSaveJob = async (req, res) => {
    try {
        const { job_id } = req.body;
        const user_id = req.user.id;

        // Check if already saved
        const [existing] = await db.query('SELECT * FROM saved_jobs WHERE user_id = ? AND job_id = ?', [user_id, job_id]);

        if (existing.length > 0) {
            // Unsave
            await db.query('DELETE FROM saved_jobs WHERE user_id = ? AND job_id = ?', [user_id, job_id]);
            return res.json({ message: 'Job removed from saved list', saved: false });
        } else {
            // Save
            await db.query('INSERT INTO saved_jobs (user_id, job_id) VALUES (?, ?)', [user_id, job_id]);
            return res.json({ message: 'Job saved successfully', saved: true });
        }
    } catch (error) {
        console.error('Error toggling save job:', error);
        res.status(500).json({ message: 'Server error toggling save job' });
    }
};

// Get Saved Jobs
export const getSavedJobs = async (req, res) => {
    try {
        const user_id = req.user.id;
        const [rows] = await db.query(`
            SELECT j.*, s.created_at as saved_at
            FROM jobs j
            JOIN saved_jobs s ON j.job_id = s.job_id
            WHERE s.user_id = ?
            ORDER BY s.created_at DESC
        `, [user_id]);

        res.json(rows);
    } catch (error) {
        console.error('Error fetching saved jobs:', error);
        res.status(500).json({ message: 'Server error fetching saved jobs' });
    }
};

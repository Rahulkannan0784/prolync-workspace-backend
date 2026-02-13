import db from './config/db.js';

const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w-]+/g, '')   // Remove all non-word chars
        .replace(/--+/g, '-');      // Replace multiple - with single -
};

const migrateJobSlugs = async () => {
    try {
        console.log('--- Job Slug Migration Started ---');

        // 1. Add slug column if it doesn't exist
        console.log('Adding slug column...');
        try {
            await db.query('ALTER TABLE jobs ADD COLUMN slug VARCHAR(255) UNIQUE AFTER job_title');
            console.log('Slug column added.');
        } catch (err) {
            if (err.code === 'ER_DUP_COLUMN_NAME' || err.errno === 1060) {
                console.log('Slug column already exists.');
            } else {
                throw err;
            }
        }

        // 2. Fetch all jobs to backfill slugs
        console.log('Fetching existing jobs...');
        const [jobs] = await db.query('SELECT job_id, job_title, company_name FROM jobs');

        console.log(`Processing ${jobs.length} jobs...`);
        for (const job of jobs) {
            let baseSlug = slugify(`${job.job_title}-${job.company_name}`);
            let uniqueSlug = baseSlug;

            // Just update with job_id appended to ensure uniqueness if we don't want to check every time
            // Or we can just use ID-title-company
            uniqueSlug = `${job.job_id}-${baseSlug}`;

            console.log(`Updating Job ID ${job.job_id} with slug: ${uniqueSlug}`);
            await db.query('UPDATE jobs SET slug = ? WHERE job_id = ?', [uniqueSlug, job.job_id]);
        }

        console.log('--- Migration Completed Successfully ---');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrateJobSlugs();

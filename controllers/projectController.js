
import db from '../config/db.js';

// Add a new project
export const addProject = async (req, res) => {
    try {
        const {
            title, description, detailed_overview, status, is_internship,
            duration, difficulty, max_participants, submission_deadline,
            technology_stack, learning_objectives, key_requirements
        } = req.body;

        const stackStr = JSON.stringify(technology_stack || []);
        const objectivesStr = JSON.stringify(learning_objectives || []);
        const requirementsStr = JSON.stringify(key_requirements || []);

        const query = `
            INSERT INTO projects (
                title, description, detailed_overview, status, is_internship,
                duration, difficulty, max_participants, submission_deadline,
                technology_stack, learning_objectives, key_requirements
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await db.query(query, [
            title, description, detailed_overview, status || 'Active', is_internship || false,
            duration, difficulty || 'Beginner', max_participants || 1, submission_deadline,
            stackStr, objectivesStr, requirementsStr
        ]);

        res.status(201).json({ message: "Project created successfully" });
    } catch (error) {
        console.error("Error adding project:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get all projects
export const getAllProjects = async (req, res) => {
    try {
        const query = `
            SELECT p.*, 
                   COUNT(DISTINCT pa.student_id) as interested_count,
                   COUNT(DISTINCT CASE WHEN pa.status IN ('Submitted', 'Completed', 'Changes Required', 'Rejected') THEN pa.student_id END) as submission_count
            FROM projects p
            LEFT JOIN project_applications pa ON p.id = pa.project_id
            GROUP BY p.id
            ORDER BY p.created_at DESC
        `;
        const [rows] = await db.query(query);

        const projects = rows.map(project => ({
            ...project,
            technology_stack: typeof project.technology_stack === 'string' ? JSON.parse(project.technology_stack || '[]') : (project.technology_stack || []),
            learning_objectives: typeof project.learning_objectives === 'string' ? JSON.parse(project.learning_objectives || '[]') : (project.learning_objectives || []),
            key_requirements: typeof project.key_requirements === 'string' ? JSON.parse(project.key_requirements || '[]') : (project.key_requirements || []),
            is_internship: Boolean(project.is_internship)
        }));

        res.status(200).json(projects);
    } catch (error) {
        console.error("Error fetching projects:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get single project
export const getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `SELECT * FROM projects WHERE id = ?`;
        const [rows] = await db.query(query, [id]);

        if (rows.length === 0) return res.status(404).json({ message: "Project not found" });

        const project = {
            ...rows[0],
            technology_stack: typeof rows[0].technology_stack === 'string' ? JSON.parse(rows[0].technology_stack || '[]') : (rows[0].technology_stack || []),
            learning_objectives: typeof rows[0].learning_objectives === 'string' ? JSON.parse(rows[0].learning_objectives || '[]') : (rows[0].learning_objectives || []),
            key_requirements: typeof rows[0].key_requirements === 'string' ? JSON.parse(rows[0].key_requirements || '[]') : (rows[0].key_requirements || []),
            is_internship: Boolean(rows[0].is_internship)
        };

        res.status(200).json(project);
    } catch (error) {
        console.error("Error fetching project:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Update project
export const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title, description, detailed_overview, status, is_internship,
            duration, difficulty, max_participants, submission_deadline,
            technology_stack, learning_objectives, key_requirements
        } = req.body;

        const stackStr = JSON.stringify(technology_stack || []);
        const objectivesStr = JSON.stringify(learning_objectives || []);
        const requirementsStr = JSON.stringify(key_requirements || []);

        const query = `
            UPDATE projects SET
                title = ?, description = ?, detailed_overview = ?, status = ?, is_internship = ?,
                duration = ?, difficulty = ?, max_participants = ?, submission_deadline = ?,
                technology_stack = ?, learning_objectives = ?, key_requirements = ?
            WHERE id = ?
        `;

        await db.query(query, [
            title, description, detailed_overview, status, is_internship,
            duration, difficulty, max_participants, submission_deadline,
            stackStr, objectivesStr, requirementsStr, id
        ]);

        res.status(200).json({ message: "Project updated successfully" });
    } catch (error) {
        console.error("Error updating project:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Delete project
export const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM projects WHERE id = ?', [id]);
        res.status(200).json({ message: "Project deleted successfully" });
    } catch (error) {
        console.error("Error deleting project:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Apply to project (or send interest)
// --- Student Project Workflow ---

export const showInterest = async (req, res) => {
    try {
        const { project_id, email } = req.body;

        const [users] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(404).json({ message: "User not found" });
        const student_id = users[0].id;

        const [existing] = await db.query('SELECT * FROM project_applications WHERE project_id = ? AND student_id = ?', [project_id, student_id]);

        if (existing.length > 0) {
            // If already interested or submitted, just return success or existing status
            return res.status(200).json({ message: "Interest already shown", status: existing[0].status });
        }

        await db.query('INSERT INTO project_applications (project_id, student_id, status) VALUES (?, ?, ?)', [project_id, student_id, 'Interested']);
        res.status(200).json({ message: "Interest registered successfully" });
    } catch (error) {
        console.error("Error showing interest:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const submitProject = async (req, res) => {
    try {
        const { project_id, email, github_url, live_url, tech_stack_used, submission_notes, screenshots } = req.body;

        const [users] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(404).json({ message: "User not found" });
        const student_id = users[0].id;

        // Verify interest exists
        const [existing] = await db.query('SELECT * FROM project_applications WHERE project_id = ? AND student_id = ?', [project_id, student_id]);
        if (existing.length === 0) return res.status(400).json({ message: "Must show interest first" });

        const screenshotsStr = JSON.stringify(screenshots || []);

        const query = `
            UPDATE project_applications 
            SET github_url = ?, live_url = ?, tech_stack_used = ?, submission_notes = ?, screenshots = ?, status = 'Submitted', applied_at = CURRENT_TIMESTAMP, admin_feedback = NULL
            WHERE project_id = ? AND student_id = ?
        `;

        await db.query(query, [github_url, live_url, tech_stack_used, submission_notes, screenshotsStr, project_id, student_id]);

        // Log Activity
        try {
            await db.query(
                'INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
                [student_id, 'SUBMITTED_PROJECT', `Submitted project ID: ${project_id}`, req.ip || '0.0.0.0']
            );
        } catch (logErr) { console.error("Activity logging failed", logErr); }

        res.status(200).json({ message: "Project submitted successfully" });
    } catch (error) {
        console.error("Error submitting project:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getMyProjects = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ message: "Email required" });

        const [users] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(404).json({ message: "User not found" });
        const student_id = users[0].id;

        const query = `
            SELECT pa.*, p.title, p.status as project_status, p.description, p.difficulty, p.is_internship, p.technology_stack 
            FROM project_applications pa
            JOIN projects p ON pa.project_id = p.id
            WHERE pa.student_id = ?
            ORDER BY pa.applied_at DESC
        `;
        const [rows] = await db.query(query, [student_id]);

        // Parse JSON fields
        const applications = rows.map(app => ({
            ...app,
            technology_stack: typeof app.technology_stack === 'string' ? JSON.parse(app.technology_stack || '[]') : (app.technology_stack || []),
            screenshots: typeof app.screenshots === 'string' ? JSON.parse(app.screenshots || '[]') : (app.screenshots || []),
            is_internship: Boolean(app.is_internship)
        }));

        res.status(200).json(applications);
    } catch (error) {
        console.error("Error fetching my projects:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// --- Admin Review ---

export const getPendingSubmissions = async (req, res) => {
    try {
        const query = `
            SELECT pa.*, p.title as project_title, u.name as student_name, u.email as student_email
            FROM project_applications pa
            JOIN projects p ON pa.project_id = p.id
            JOIN users u ON pa.student_id = u.id
            WHERE pa.status IN ('Submitted', 'Interested')
            ORDER BY pa.applied_at ASC
        `;
        const [rows] = await db.query(query);
        const submissions = rows.map(sub => ({
            ...sub,
            screenshots: typeof sub.screenshots === 'string' ? JSON.parse(sub.screenshots || '[]') : sub.screenshots
        }));
        res.status(200).json(submissions);
    } catch (error) {
        console.error("Error fetching submissions:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const reviewProject = async (req, res) => {
    try {
        const { application_id, status, feedback } = req.body; // status: 'Completed' | 'Changes Required' | 'Rejected'

        // Save feedback if provided
        await db.query('UPDATE project_applications SET status = ?, admin_feedback = ? WHERE id = ?', [status, feedback || null, application_id]);
        res.status(200).json({ message: "Project status updated" });
    } catch (error) {
        console.error("Error reviewing project:", error);
        res.status(500).json({ message: "Server error" });
    }
};

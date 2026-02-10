import db from './config/db.js';

const mentors = [
    {
        name: "Priya Sharma",
        email: "priya.sharma@example.com",
        role: "Senior UX Designer",
        company: "Google",
        bio: "Experienced UX designer with a passion for user-centric design.",
        image_url: "",
        skills: JSON.stringify(["UX Design", "Figma", "User Research"]),
        focus: JSON.stringify(["Design Systems", "Prototyping"]),
        is_certified: true,
        is_verified: true,
        is_top_rated: true,
        session_type: "1:1 Mentorship",
        availability: JSON.stringify(["Mon 10am-12pm", "Wed 2pm-4pm"]),
        max_participants: 1,
        is_active: true
    },
    {
        name: "David Lee",
        email: "david.lee@example.com",
        role: "Full Stack Engineer",
        company: "Netflix",
        bio: "Full stack developer specializing in React and Node.js.",
        image_url: "",
        skills: JSON.stringify(["React", "Node.js", "GraphQL"]),
        focus: JSON.stringify(["System Design", "Scalability"]),
        is_certified: true,
        is_verified: true,
        is_top_rated: false,
        session_type: "Code Review",
        availability: JSON.stringify(["Tue 6pm-8pm", "Thu 6pm-8pm"]),
        max_participants: 1,
        is_active: true
    },
    {
        name: "Sarah Chen",
        email: "sarah.chen@example.com",
        role: "Data Scientist",
        company: "Amazon",
        bio: "Data scientist with expertise in machine learning and AI.",
        image_url: "",
        skills: JSON.stringify(["Python", "Machine Learning", "TensorFlow"]),
        focus: JSON.stringify(["AI Models", "Data Visualization"]),
        is_certified: true,
        is_verified: true,
        is_top_rated: true,
        session_type: "Career Guidance",
        availability: JSON.stringify(["Sat 10am-1pm"]),
        max_participants: 1,
        is_active: true
    },
    {
        name: "Alex Johnson",
        email: "alex.j@example.com",
        role: "Product Manager",
        company: "Microsoft",
        bio: "Product leader with 10+ years of experience launching SaaS products.",
        image_url: "",
        skills: JSON.stringify(["Product Management", "Strategy", "Agile"]),
        focus: JSON.stringify(["Product Roadmap", "User Stories"]),
        is_certified: true,
        is_verified: true,
        is_top_rated: false,
        session_type: "Mock Interview",
        availability: JSON.stringify(["Fri 4pm-6pm"]),
        max_participants: 1,
        is_active: true
    },
    {
        name: "Emily Davis",
        email: "emily.d@example.com",
        role: "Frontend Architect",
        company: "Airbnb",
        bio: "Frontend specialist focused on performance and accessibility.",
        image_url: "",
        skills: JSON.stringify(["JavaScript", "CSS", "Performance"]),
        focus: JSON.stringify(["Web Vitals", "Accessibility"]),
        is_certified: true,
        is_verified: true,
        is_top_rated: true,
        session_type: "1:1 Mentorship",
        availability: JSON.stringify(["Mon 9am-11am", "Wed 9am-11am"]),
        max_participants: 1,
        is_active: true
    },
    {
        name: "Michael Brown",
        email: "michael.b@example.com",
        role: "DevOps Engineer",
        company: "Spotify",
        bio: "DevOps pro with expertise in CI/CD and cloud infrastructure.",
        image_url: "",
        skills: JSON.stringify(["AWS", "Docker", "Kubernetes"]),
        focus: JSON.stringify(["Cloud Architecture", "Automation"]),
        is_certified: true,
        is_verified: true,
        is_top_rated: false,
        session_type: "Technical Deep Dive",
        availability: JSON.stringify(["Tue 8pm-10pm"]),
        max_participants: 1,
        is_active: true
    },
    {
        name: "Jessica Wilson",
        email: "jessica.w@example.com",
        role: "Mobile Developer",
        company: "Apple",
        bio: "iOS developer passionate about building smooth mobile experiences.",
        image_url: "",
        skills: JSON.stringify(["Swift", "iOS", "SwiftUI"]),
        focus: JSON.stringify(["App Architecture", "Animation"]),
        is_certified: true,
        is_verified: true,
        is_top_rated: true,
        session_type: "Code Review",
        availability: JSON.stringify(["Thu 7pm-9pm"]),
        max_participants: 1,
        is_active: true
    },
    {
        name: "Daniel Martinez",
        email: "daniel.m@example.com",
        role: "Security Engineer",
        company: "Tesla",
        bio: "Cybersecurity expert focusing on application security.",
        image_url: "",
        skills: JSON.stringify(["Cybersecurity", "Pen Testing", "Python"]),
        focus: JSON.stringify(["Security Audits", "Ethical Hacking"]),
        is_certified: true,
        is_verified: true,
        is_top_rated: false,
        session_type: "Career Guidance",
        availability: JSON.stringify(["Sat 2pm-5pm"]),
        max_participants: 1,
        is_active: true
    },
    {
        name: "Laura Taylor",
        email: "laura.t@example.com",
        role: "Backend Developer",
        company: "Uber",
        bio: "Scalable backend systems engineer.",
        image_url: "",
        skills: JSON.stringify(["Go", "Microservices", "SQL"]),
        focus: JSON.stringify(["Database Design", "High Availability"]),
        is_certified: true,
        is_verified: true,
        is_top_rated: true,
        session_type: "1:1 Mentorship",
        availability: JSON.stringify(["Mon 6pm-8pm"]),
        max_participants: 1,
        is_active: true
    },
    {
        name: "Kevin Anderson",
        email: "kevin.a@example.com",
        role: "AI Researcher",
        company: "OpenAI",
        bio: "Researching the future of generative models.",
        image_url: "",
        skills: JSON.stringify(["Deep Learning", "PyTorch", "NLP"]),
        focus: JSON.stringify(["LLMs", "Research Papers"]),
        is_certified: true,
        is_verified: true,
        is_top_rated: true,
        session_type: "Technical Deep Dive",
        availability: JSON.stringify(["Sun 11am-2pm"]),
        max_participants: 1,
        is_active: true
    }
];

async function seedMentors() {
    try {
        const query = `
            INSERT INTO mentors (
                name, email, role, company, bio, image_url, 
                skills, focus, is_certified, is_verified, is_top_rated, 
                session_type, availability, max_participants, is_active
            ) VALUES ?
        `;

        const values = mentors.map(m => [
            m.name, m.email, m.role, m.company, m.bio, m.image_url,
            m.skills, m.focus, m.is_certified, m.is_verified, m.is_top_rated,
            m.session_type, m.availability, m.max_participants, m.is_active
        ]);

        await db.query(query, [values]);
        console.log("Mock mentors seeded successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding mentors:", error);
        process.exit(1);
    }
}

seedMentors();

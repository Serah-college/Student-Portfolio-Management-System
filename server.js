// Student Portfolio Management System
// This server uses the basic Node.js and MongoDB methods from the class notes.

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { MongoClient, ObjectId } = require("mongodb");

const client = new MongoClient("mongodb://127.0.0.1:27017");

let users;
let projects;

// A simple list of logged-in users. It is cleared when the server restarts.
const sessions = new Map();

// Convert special characters before displaying database text in HTML.
function safeText(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// Read the form values sent by the browser.
function readFormData(req) {
    return new Promise((resolve) => {
        let body = "";

        req.on("data", function (chunk) {
            body = body + chunk.toString();
        });

        req.on("end", function () {
            resolve(new URLSearchParams(body));
        });
    });
}

// Send an HTML, CSS or JavaScript file to the browser.
function sendFile(res, fileName, contentType) {
    const filePath = path.join(__dirname, "public", fileName);

    fs.readFile(filePath, function (error, data) {
        if (error) {
            res.writeHead(404, { "Content-Type": "text/plain" });
            return res.end("File not found");
        }

        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
    });
}

// Show a message page.
function showMessage(res, message, link, linkText) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Student Portfolio</title>
            <link rel="stylesheet" href="/style.css">
        </head>
        <body>
            <div class="form-box">
                <h2>${safeText(message)}</h2>
                <p><a href="${link}">${linkText}</a></p>
            </div>
        </body>
        </html>
    `);
}

// Find the logged-in user using the session cookie.
function getLoggedInUser(req) {
    const cookie = req.headers.cookie || "";
    const parts = cookie.split(";");

    for (let i = 0; i < parts.length; i++) {
        const item = parts[i].trim();

        if (item.startsWith("studentSession=")) {
            const sessionId = item.substring("studentSession=".length);
            return sessions.get(sessionId);
        }
    }

    return null;
}

// Create a simple password hash using Node.js built-in crypto.
function makePasswordHash(password, salt) {
    return crypto.scryptSync(password, salt, 64).toString("hex");
}

// Create the dashboard HTML using the student's saved details.
async function showDashboard(res, user) {
    const student = await users.findOne({ email: user.email });
    const studentProjects = await projects.find({ email: user.email }).toArray();

    let projectRows = "";

    for (let i = 0; i < studentProjects.length; i++) {
        const project = studentProjects[i];

        projectRows += `
            <tr>
                <td>${safeText(project.title)}</td>
                <td>${safeText(project.description)}</td>
                <td>${safeText(project.technologies)}</td>
                <td>${safeText(project.link)}</td>
                <td>
                    <form action="/project/delete" method="POST">
                        <input type="hidden" name="id" value="${project._id}">
                        <button type="submit">Delete</button>
                    </form>
                    <form action="/project/update" method="POST" class="project-form">
                        <input type="hidden" name="id" value="${project._id}">
                        <label>Change title</label>
                        <input name="title" value="${safeText(project.title)}" required>
                        <label>Change description</label>
                        <textarea name="description">${safeText(project.description)}</textarea>
                        <label>Technologies</label>
                        <input name="technologies" value="${safeText(project.technologies)}">
                        <label>Project link</label>
                        <input name="link" value="${safeText(project.link)}">
                        <button type="submit">Update Project</button>
                    </form>
                </td>
            </tr>
        `;
    }

    if (projectRows === "") {
        projectRows = "<tr><td colspan='5'>No projects added yet.</td></tr>";
    }

    let photo = "";
    if (student.photoUrl) {
        photo = `<p><img src="${safeText(student.photoUrl)}" alt="Student photo" width="120"></p>`;
    }

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Student Dashboard</title>
            <link rel="stylesheet" href="/style.css">
            <script src="/script.js" defer></script>
        </head>
        <body>
            <header>
                <h1>Student Portfolio</h1>
                <p>Welcome, ${safeText(student.name)}</p>
                <p class="no-print"><a href="/logout" style="color:white;">Logout</a></p>
            </header>

            <div class="section-box">
                <div class="button-row no-print">
                    <button onclick="printPortfolio()">Print Portfolio / Save as PDF</button>
                </div>
                <h2>My Profile</h2>
                ${photo}
                <p><b>Name:</b> ${safeText(student.name)}</p>
                <p><b>Email:</b> ${safeText(student.email)}</p>
                <p><b>Course:</b> ${safeText(student.course)}</p>
                <p><b>College:</b> ${safeText(student.college)}</p>
                <p><b>About Me:</b> ${safeText(student.bio)}</p>
                <p><b>Skills:</b> ${safeText(student.skills)}</p>
                <p><b>Achievements:</b> ${safeText(student.achievements)}</p>

                <h3>Update My Profile</h3>
                <form action="/profile/update" method="POST">
                    <label>Name</label>
                    <input name="name" value="${safeText(student.name)}" required>
                    <label>Course</label>
                    <input name="course" value="${safeText(student.course)}">
                    <label>College</label>
                    <input name="college" value="${safeText(student.college)}">
                    <label>About Me</label>
                    <textarea name="bio">${safeText(student.bio)}</textarea>
                    <label>Skills</label>
                    <input name="skills" value="${safeText(student.skills)}">
                    <label>Achievements</label>
                    <textarea name="achievements">${safeText(student.achievements)}</textarea>
                    <label>Profile photo URL (optional)</label>
                    <input name="photoUrl" value="${safeText(student.photoUrl)}">
                    <button type="submit">Save Profile</button>
                </form>
            </div>

            <div class="section-box">
                <h2>Add a Project</h2>
                <form action="/project/add" method="POST">
                    <label>Project Title</label>
                    <input name="title" required>
                    <label>Description</label>
                    <textarea name="description"></textarea>
                    <label>Technologies Used</label>
                    <input name="technologies">
                    <label>Project Link</label>
                    <input name="link">
                    <button type="submit">Add Project</button>
                </form>
            </div>

            <div class="section-box">
                <h2>My Projects</h2>
                <table>
                    <tr>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Technologies</th>
                        <th>Link</th>
                        <th>Actions</th>
                    </tr>
                    ${projectRows}
                </table>
            </div>

            <footer class="no-print">
                <p>Student Portfolio Management System</p>
            </footer>
        </body>
        </html>
    `);
}

// Main Node.js server.
const server = http.createServer(async function (req, res) {
    try {
        const pageUrl = new URL(req.url, "http://localhost:3000");
        const user = getLoggedInUser(req);

        // Open the home, registration and login pages.
        if (req.method === "GET" && pageUrl.pathname === "/") {
            return sendFile(res, "index.html", "text/html");
        }

        if (req.method === "GET" && pageUrl.pathname === "/register.html") {
            return sendFile(res, "register.html", "text/html");
        }

        if (req.method === "GET" && pageUrl.pathname === "/login.html") {
            return sendFile(res, "login.html", "text/html");
        }

        if (req.method === "GET" && pageUrl.pathname === "/style.css") {
            return sendFile(res, "style.css", "text/css");
        }

        if (req.method === "GET" && pageUrl.pathname === "/script.js") {
            return sendFile(res, "script.js", "text/javascript");
        }

        // Register a new student.
        if (req.method === "POST" && pageUrl.pathname === "/register") {
            const form = await readFormData(req);

            const name = (form.get("name") || "").trim();
            const email = (form.get("email") || "").trim().toLowerCase();
            const password = form.get("password") || "";

            if (name === "" || email === "" || password.length < 4) {
                return showMessage(res, "Please enter valid details. Password must have at least 4 characters.", "/register.html", "Go back");
            }

            const oldUser = await users.findOne({ email: email });

            if (oldUser) {
                return showMessage(res, "This email is already registered.", "/login.html", "Go to Login");
            }

            const salt = crypto.randomBytes(16).toString("hex");
            const passwordHash = makePasswordHash(password, salt);

            await users.insertOne({
                name: name,
                email: email,
                passwordHash: passwordHash,
                salt: salt,
                course: "",
                college: "",
                bio: "",
                skills: "",
                achievements: "",
                photoUrl: ""
            });

            return showMessage(res, "Registration successful.", "/login.html", "Login now");
        }

        // Login an existing student.
        if (req.method === "POST" && pageUrl.pathname === "/login") {
            const form = await readFormData(req);

            const email = (form.get("email") || "").trim().toLowerCase();
            const password = form.get("password") || "";

            const student = await users.findOne({ email: email });

            if (!student) {
                return showMessage(res, "Invalid email or password.", "/login.html", "Try again");
            }

            const enteredHash = makePasswordHash(password, student.salt);

            if (enteredHash !== student.passwordHash) {
                return showMessage(res, "Invalid email or password.", "/login.html", "Try again");
            }

            const sessionId = crypto.randomBytes(16).toString("hex");
            sessions.set(sessionId, { email: student.email });

            res.writeHead(302, {
                "Set-Cookie": "studentSession=" + sessionId + "; HttpOnly; SameSite=Lax; Path=/",
                "Location": "/dashboard"
            });
            return res.end();
        }

        // Show the dashboard only after login.
        if (req.method === "GET" && pageUrl.pathname === "/dashboard") {
            if (!user) {
                res.writeHead(302, { Location: "/login.html" });
                return res.end();
            }

            return showDashboard(res, user);
        }

        // Update profile details.
        if (req.method === "POST" && pageUrl.pathname === "/profile/update") {
            if (!user) {
                res.writeHead(302, { Location: "/login.html" });
                return res.end();
            }

            const form = await readFormData(req);

            await users.updateOne(
                { email: user.email },
                {
                    $set: {
                        name: (form.get("name") || "").trim(),
                        course: (form.get("course") || "").trim(),
                        college: (form.get("college") || "").trim(),
                        bio: (form.get("bio") || "").trim(),
                        skills: (form.get("skills") || "").trim(),
                        achievements: (form.get("achievements") || "").trim(),
                        photoUrl: (form.get("photoUrl") || "").trim()
                    }
                }
            );

            res.writeHead(302, { Location: "/dashboard" });
            return res.end();
        }

        // Add a project.
        if (req.method === "POST" && pageUrl.pathname === "/project/add") {
            if (!user) {
                res.writeHead(302, { Location: "/login.html" });
                return res.end();
            }

            const form = await readFormData(req);
            const title = (form.get("title") || "").trim();

            if (title === "") {
                return showMessage(res, "Project title is required.", "/dashboard", "Back to Dashboard");
            }

            await projects.insertOne({
                email: user.email,
                title: title,
                description: (form.get("description") || "").trim(),
                technologies: (form.get("technologies") || "").trim(),
                link: (form.get("link") || "").trim()
            });

            res.writeHead(302, { Location: "/dashboard" });
            return res.end();
        }

        // Update a project.
        if (req.method === "POST" && pageUrl.pathname === "/project/update") {
            if (!user) {
                res.writeHead(302, { Location: "/login.html" });
                return res.end();
            }

            const form = await readFormData(req);
            const id = form.get("id");

            if (!ObjectId.isValid(id)) {
                return showMessage(res, "Invalid project.", "/dashboard", "Back to Dashboard");
            }

            await projects.updateOne(
                { _id: new ObjectId(id), email: user.email },
                {
                    $set: {
                        title: (form.get("title") || "").trim(),
                        description: (form.get("description") || "").trim(),
                        technologies: (form.get("technologies") || "").trim(),
                        link: (form.get("link") || "").trim()
                    }
                }
            );

            res.writeHead(302, { Location: "/dashboard" });
            return res.end();
        }

        // Delete a project.
        if (req.method === "POST" && pageUrl.pathname === "/project/delete") {
            if (!user) {
                res.writeHead(302, { Location: "/login.html" });
                return res.end();
            }

            const form = await readFormData(req);
            const id = form.get("id");

            if (ObjectId.isValid(id)) {
                await projects.deleteOne({
                    _id: new ObjectId(id),
                    email: user.email
                });
            }

            res.writeHead(302, { Location: "/dashboard" });
            return res.end();
        }

        // Logout.
        if (req.method === "GET" && pageUrl.pathname === "/logout") {
            const cookie = req.headers.cookie || "";
            const parts = cookie.split(";");

            for (let i = 0; i < parts.length; i++) {
                const item = parts[i].trim();

                if (item.startsWith("studentSession=")) {
                    const sessionId = item.substring("studentSession=".length);
                    sessions.delete(sessionId);
                }
            }

            res.writeHead(302, {
                "Set-Cookie": "studentSession=; Max-Age=0; Path=/",
                "Location": "/login.html"
            });
            return res.end();
        }

        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Page not found");

    } catch (error) {
        console.log(error);
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Something went wrong. Check the terminal.");
    }
});

// Connect to MongoDB first, then start the server.
async function startServer() {
    await client.connect();

    const db = client.db("studentPortfolioDB");
    users = db.collection("users");
    projects = db.collection("projects");

    server.listen(3000, function () {
        console.log("MongoDB connected successfully");
        console.log("Website running at http://localhost:3000");
    });
}

startServer().catch(function (error) {
    console.log("Could not connect to MongoDB");
    console.log(error);
});

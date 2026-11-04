# Student Portfolio Management System — Beginner Version

This version follows the topics in the HTML, CSS, JavaScript and Node.js lecture notes.

## Main features
- Student registration and login
- Student profile details
- Add, view, update and delete projects
- Logout
- Data stored in MongoDB
- Print the portfolio and choose **Save as PDF** in the browser

## Technologies used
- HTML: forms, headings, labels, inputs, buttons and tables
- CSS: external stylesheet, selectors, colours, spacing, borders, Flexbox and media query
- JavaScript: functions, conditions, events and DOM methods
- Node.js: `http`, `fs`, `path`, `require()` and GET/POST requests
- MongoDB: `MongoClient`, collections and CRUD methods

## Setup

1. Install Node.js and MongoDB Community Server.
2. Open this folder in VS Code.
3. Open Terminal in this folder.
4. Install the MongoDB package:

   `npm.cmd install`

5. Make sure MongoDB is running.
6. Start the website:

   `node server.js`

   If PowerShell blocks `npm`, use `npm.cmd start`.

7. Open `http://localhost:3000`.

## MongoDB
The app creates/uses:
- Database: `studentPortfolioDB`
- Collection: `users`
- Collection: `projects`

Open MongoDB Compass and connect to:

`mongodb://127.0.0.1:27017`

## Important notes about this beginner version
- Login sessions are kept in server memory. Restarting the server logs users out.
- The profile photo field accepts an image URL; it does not upload a file.
- The Print Portfolio button uses the browser's Print option. Choose **Save as PDF**.
- Passwords are hashed before being stored.
- This is a classroom learning project, not a production-ready public service.

## Folder structure

```
StudentPortfolio_Beginner
│   server.js
│   package.json
│   README.md
└── public
    │   index.html
    │   register.html
    │   login.html
    │   style.css
    └── script.js
```

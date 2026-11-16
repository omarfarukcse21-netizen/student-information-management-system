# Student Information Management System

A desktop application for managing student records, built with **Electron.js, HTML, CSS and JavaScript**.
An admin can log in, add students (with photos), search them by ID or name, and edit or delete their information.
All data is stored locally in JSON files, so no database or server is needed.

> Course: CSE 2100, Software Development Project I (Summer 2026), Section A

## Why this project?

Many departments still keep student information in paper registers or Excel sheets, which makes it slow to find a student and easy to make mistakes.
This application keeps all student records in one place, so any record can be found by typing an ID or a name.

## Features

- **Admin login** with a hashed password (the password is never stored as plain text)
- **Add students:** ID, name, department, semester, phone, email and photo
- **Search** by student ID or name (results update while typing)
- **Filter** by department
- **View** full details of a student in a pop-up
- **Edit** and **Delete** records (with a confirmation before deleting)
- **Validation:** required fields, duplicate IDs, phone number and email format
- **Dashboard cards:** total students, number of departments, last added student
- **Dark mode / Light mode** (your choice is remembered)
- **Persistent storage:** data is saved in a JSON file and is still there after closing the app

## Built With

| Technology | Purpose |
|------------|---------|
| Electron.js | Turns the web page into a desktop application |
| HTML | Structure of the application |
| CSS | Design, layout and dark mode |
| JavaScript | Application logic (add, search, edit, delete, login) |
| Node.js (`fs`, `crypto`) | Reading and writing files, password hashing |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) (LTS version) installed on your computer
- [Git](https://git-scm.com) (only needed to clone the repository)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/omarfarukcse21-netizen/student-information-management-system.git

# 2. Go into the project folder
cd student-information-management-system

# 3. Install the dependencies
npm install

# 4. Run the application
npm start
```

### First run

The first time you start the application there is no admin account yet,
so a **"Create Account"** screen appears. Create the admin account there and you will be logged in.
From the next run, the normal **Login** screen appears.

## Project Structure

```
student-information-management-system/
├── main.js          # Creates the application window (Electron main process)
├── index.html       # Login screen, form, table and pop-up layout
├── style.css        # Styling and dark mode colours
├── renderer.js      # Application logic (CRUD, search, validation, login, theme)
├── package.json     # Project information and the "npm start" command
├── students.json    # Student data (created automatically)
└── admin.json       # Admin account with hashed password (created automatically, not uploaded to GitHub)
```

## How It Works

- **Data storage:** student records are kept in `students.json`. Every add, edit or delete writes the updated list back to this file using Node.js `fs`.
- **Passwords:** the password is combined with a random *salt* and hashed using PBKDF2 (`crypto` module). Only the salt and the hash are saved in `admin.json`.
- **Search and filter:** the list is filtered with JavaScript `filter()` every time the text in the search box or the department selection changes.
- **Photos:** a selected photo is resized to a small size and saved as text (base64) together with the student's other information.
- **Dark mode:** colours are defined as CSS variables, and a `dark` class on the page switches them. The selected theme is saved in `localStorage`.

## Build a Windows `.exe` (optional)

```bash
npx @electron/packager . StudentApp --platform=win32 --arch=x64 --overwrite
```

This creates a `StudentApp-win32-x64` folder. Open `StudentApp.exe` inside it to run the application without `npm start`.
Keep the whole folder together, and do not place it inside `Program Files` (the app needs permission to write its data files).

## Limitations and Future Work

- Data is stored only on one computer; there is no multi-user or online access.
- The data file is not encrypted, so the login protects the application screen only.
- Possible improvements: results and CGPA calculation, attendance, CSV/PDF export, SQLite database, multiple admin roles.

## Author

- **Name:** YOUR NAME
- **Roll:** YOUR ROLL NUMBER
- **GitHub:** [omarfarukcse21-netizen](https://github.com/omarfarukcse21-netizen)

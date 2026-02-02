# CodeSnap – An AI-based Learning Platform for Code Debugging

## 🛠️ Technologies Used (Learning Level)
- React (basic usage)
- Node.js & Express (API integration)
- MongoDB (data storage)
- AI API integration (learning phase)

## 📌 Overview

CodeSnap is an AI-powered learning platform designed to help programming beginners and students understand **compiler and runtime errors** more effectively. Instead of only fixing errors, CodeSnap focuses on **learning-by-explanation**, enabling users to grasp *why* an error occurs and *how* to resolve it correctly.

The platform leverages modern **Large Language Models (LLMs)** to convert complex, technical error messages into **simple, human-readable explanations**, making debugging a learning experience rather than a frustrating task.

---

## 🎯 Problem Statement

Programming learners often struggle with:

* Cryptic compiler and runtime error messages
* Lack of beginner-friendly explanations
* Fixing errors without understanding their root cause

Existing tools emphasize quick fixes but fail to promote conceptual clarity. CodeSnap addresses this gap by prioritizing **conceptual understanding** along with error resolution.

---

## 🚀 Key Features

* 🔍 **AI-based Error Explanation** – Converts technical errors into easy-to-understand explanations
* 🧠 **Concept-Oriented Learning** – Focuses on teaching the cause of errors
* 📝 **Code Input & Analysis** – Users can submit code snippets for analysis
* 🌐 **Modern Web Interface** – Clean and responsive UI
* 🔐 **Secure Configuration** – Environment variables handled using `.env.local`

---

## 🛠️ Tech Stack

### Frontend

* React.js
* Tailwind CSS
* TypeScript
* JavaScript (via React & TypeScript)
* HTML (JSX-based UI structure)


### Backend

* Node.js
* Express.js
* REST APIs

### AI / APIs

* Large Language Model (LLM) APIs (e.g., Groq / OpenAI-compatible APIs)

### Tools & Platforms

* Git & GitHub
* Cursor IDE
* VS Code

---

## 📂 Project Structure

```
CodeSnap-MajorProject/
│
├── frontend/        # React frontend
├── backend/         # Node.js backend
├── README.md        # Project documentation
└── .gitignore       # Ignored files (env, node_modules, etc.)
```

---

## ⚙️ Installation & Setup

### Prerequisites

* Node.js (v18 or above)
* Git

### Steps

1. Clone the repository

```bash
git clone https://github.com/Afroz-08/CodeSnap--An-AI-based-Learning-Platform-for-Code-Debugging.git
```

2. Navigate to the project directory

```bash
cd CodeSnap-MajorProject
```

3. Install dependencies

```bash
cd backend
npm install
cd ../frontend
npm install
```

4. Configure environment variables
   Create a `.env.local` file inside the `backend` folder:

```
API_KEY=your_api_key_here
```

5. Run the application

```bash
# Backend
cd backend
npm start

# Frontend
cd frontend
npm start
```

---

## 🔐 Security Note

* `.env.local` is intentionally **excluded from GitHub**
* No API keys or secrets are exposed in the repository

---

## 🎓 Learning Outcomes

* Improved understanding of compiler and runtime errors
* Hands-on experience with AI-powered applications
* Practical exposure to full-stack development
* GitHub project management and secure practices

---

## 📈 Future Enhancements

* Multi-language programming support
* Error history & progress tracking
* Voice-based explanations
* IDE plugin integration

---

## 👤 Author

**Afroj Mahammad**
B.Tech – Computer Science & Business System
VBIT (Autonomous), Hyderabad

🔗 GitHub: [https://github.com/Afroz-08](https://github.com/Afroz-08)
🔗 LinkedIn: (To be updated)

---

## 📄 License

This project is developed for **academic and learning purposes**.
## 🔒 Note

This is an academic project. API keys and database credentials are intentionally excluded from the repository for security reasons.


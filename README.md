# 🎓 BUE Student Feedback Portal

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

A full-stack, responsive web application designed for **The British University in Egypt (BUE)**. This platform modernizes the way the university collects, manages, and analyzes student feedback regarding academic courses and campus services.

## 📋 Table of Contents
- [Project Overview](#-project-overview)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Core Features](#-core-features)
- [Database Schema](#-database-schema)
- [Local Setup & Installation](#-local-setup--installation)
- [How to Use & Test Credentials](#-how-to-use--test-credentials)

## 🔍 Project Overview
Traditional feedback collection via paper forms or disjointed surveys leads to data silos and low student engagement. This portal solves that by providing a centralized, secure, and user-friendly interface where students can submit structured feedback, and administrators can track real-time analytics.

## 🏗️ Architecture & Tech Stack

### Frontend Client
- **Framework:** React.js (Component-driven UI)
- **Styling:** Tailwind CSS (Utility-first responsive design)
- **State Management:** React Hooks
- **Routing:** React Router DOM

### Backend / Backend-as-a-Service (BaaS)
- **Infrastructure:** Supabase
- **Database:** PostgreSQL (Relational schema mapping)
- **Authentication:** Supabase Auth (Secure JWT sessions)

## 🚀 Core Features
- **Admin Dashboard:** A dedicated interface for university administrators to view, filter, and analyze feedback submissions in real-time.
- **Secure Authentication:** Role-based access control (RBAC) ensuring students and admins have different permissions.
- **Dynamic Forms:** Custom-built React components for submitting structured evaluations for specific courses and professors.
- **Real-Time Data Sync:** Instant database updates using Supabase's real-time subscriptions.
- **Fully Responsive UI:** Mobile-first design approach using Tailwind CSS.

## 🗄️ Database Schema
The PostgreSQL database is structured to maintain referential integrity between:
- `users` (Managed by Supabase Auth)
- `courses` (Course IDs, Names, Instructors)
- `feedback_submissions` (Linked to user ID and course ID via foreign keys)

## ⚙️ Local Setup & Installation
**1. Clone the repository**
```bash
git clone https://github.com/omarr112434/bue-feedback-portal.git
cd bue-feedback-portal
```
**2. Install dependencies**
```bash
npm install
```
**3. Configure Environment Variables**
Create a `.env` file in the root directory and add your Supabase credentials:
```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```
**4. Start the development server**
```bash
npm start
```

## 🔐 How to Use & Test Credentials
If you are running this project locally, you can use the following test accounts to explore the different role-based views.

**Student Account (To submit feedback):**
- **Email:** student@bue.edu.eg
- **Password:** password123

**Admin Account (To view the dashboard):**
- **Email:** admin@bue.edu
- **Password:** admin@bue.edu
```

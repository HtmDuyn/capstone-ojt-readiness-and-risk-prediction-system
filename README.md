#  OJT Readiness & Risk Prediction System

> **Graduation Capstone Project**  
> **FPT University – Information Systems**  
> **Academic Year: 2025 – 2026**

An AI-powered **On-the-Job Training (OJT) Management System** that centralizes internship management while integrating Machine Learning to predict students who are at risk of delaying their internship (OJT). The system supports students, Academic Office, Enterprise Relations Office, and companies through an integrated web platform.

---

# Project Overview

The **OJT Readiness & Risk Prediction System** is a web-based Information System developed as a Graduation Capstone Project at FPT University.

Traditional internship management is often fragmented across Excel files, Google Forms, and emails, making it difficult for universities to monitor students' academic progress and detect those who may fail to meet internship requirements on time.

This project addresses these challenges by combining:

- Internship Management System
- Artificial Intelligence Risk Prediction
-  Decision Support Dashboard
- Early Warning Notification System

Unlike existing Internship Management Systems that mainly focus on administrative workflows, this project predicts students' OJT readiness before the internship semester begins, enabling universities to take proactive actions.

---

# Stakeholders

The system supports five main user groups:

- 👨‍🎓 Students
- 🏫 Academic Office
- 🤝 Enterprise Relations Office
- 🏢 Companies
- ⚙️ Administrator / IT

---

# Core Features

## Student

### Academic Management

- Login & Authentication
- Manage personal profile
- View current GPA
- View completed credits
- View remaining credits
- Track curriculum progress
- Check OJT eligibility

### AI Support

- View AI Risk Score
- Receive early warning notifications
- View AI warning history
- View missing OJT requirements
- AI-powered learning roadmap recommendation *(using an external recommendation model)*

### Internship

- Browse partner companies
- Browse internship positions
- Register internship preferences
- Track application status

### During Internship

- View assigned tasks
- Update internship progress
- View company evaluations

### Support

- Submit requests
- Receive announcements from university and companies

---

## Academic Office

### Academic Management

- Create academic years
- Create OJT semesters
- Import student academic records
- Manage curriculum
- Configure OJT requirements
- Manage students
- Approve internship registration
- Verify internship eligibility

### AI Dashboard

- Student Risk Dashboard
- High-risk student monitoring
- OJT eligibility statistics
- Risk analytics

### Supporting Classes

- Receive AI recommendations
- Create supporting classes
- Notify students
- Manage registrations

---

## Enterprise Relations Office

### Enterprise Management

- Manage partner companies
- Manage internship positions
- Manage available internship slots

### Internship Coordination

- Receive eligible students
- Assign students to companies
- Monitor acceptance status
- Reassign rejected students

### Dashboard

- Enterprise feedback
- Acceptance rate
- Internship statistics

---

## Enterprise

### Recruitment

- Manage internship positions
- Review student profiles
- Accept / Reject applicants

### Internship Monitoring

- Assign internship tasks
- Monitor student progress
- Report incidents

### Evaluation

- Evaluate internship performance
- Submit final evaluation

---

## Administrator / IT

### System Administration

- User Management
- Role & Permission Management
- System Configuration

### AI Administration

- AI Model Management
- AI Version Control
- Risk Threshold Configuration
- AI Monitoring

### Notification

- Email Configuration
- Notification Templates
- System Notifications

---

# rtificial Intelligence Module

## AI Objective

The core AI module predicts:

> **Risk of Delayed OJT**

The learning roadmap recommendation is **NOT trained within this project** and will use an existing recommendation model.

---

## Machine Learning Workflow

```text
Student Academic Data
          │
          ▼
 Data Cleaning
          │
          ▼
 Feature Engineering
          │
          ▼
Random Forest Classifier
          │
          ▼
Risk Prediction
          │
          ▼
Risk Score
          │
          ▼
Early Warning
          │
          ▼
Dashboard & Notification
```

---

## Dataset Features

| Feature | Description |
|----------|-------------|
| Student ID | Display only (excluded from training) |
| Current GPA | Current cumulative GPA |
| Total Program Credits | Total curriculum credits |
| Completed Credits | Credits completed |
| Remaining Credits | Credits remaining |
| Failed Subjects | Current failed courses |
| Retake Count | Number of retakes |
| Missing Prerequisites | Remaining prerequisite courses |
| Current Semester | Current academic semester |
| Leave of Absence | Number of leave semesters |
| Continuous Semesters | Continuous study duration |
| Academic Warnings | Academic warning count |
| Planned OJT Semester | Target internship semester |
| Label | 0 = On Time, 1 = Delayed OJT |

---

## Machine Learning Models

### Primary Model

- Random Forest Classifier

### Baseline Model

- Logistic Regression

### Problem Type

Binary Classification

---

# System Architecture

```text
                React Frontend
                      │
          RESTful API (Node.js)
                      │
        ┌─────────────┴─────────────┐
        │                           │
  SQL Server               Python AI Service
                                      │
                           Machine Learning Model
```

---

# Technology Stack

## Frontend

- React.js
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Axios

---

## Backend

- Node.js
- Express.js
- RESTful API
- JWT Authentication

---

## Artificial Intelligence

- Python
- Scikit-learn
- Pandas
- NumPy
- Joblib
- Matplotlib

---

## Database

- SQL Server

---

## DevOps & Tools

- Git
- GitHub
- Docker
- Postman
- Figma
- Visual Studio Code

---

# 🚀 Getting Started

## Clone Repository

```bash
git clone https://github.com/HtmDuyn/capstone-ojt-readiness-and-risk-prediction-system.git
```

---

## Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Backend

```bash
cd backend
npm install
npm run dev
```

---

## AI Module

```bash
cd ai
pip install -r requirements.txt
python train.py
```

---

# Project Modules

- Authentication & Authorization
- Student Management
- Academic Management
- Internship Management
- Enterprise Management
- AI Risk Prediction
- Early Warning System
- Decision Support Dashboard
- Notification System
- Reports & Analytics

---

# 📚 Documentation

Project documentation is available in the **docs/** directory.

Including:

- Proposal
- Literature Review
- Business Requirements
- BPMN
- ERD
- Database Design
- API Documentation
- AI Documentation
- Capstone Reports
- User Manual

---

---


# Research Contribution

Compared with existing Internship Management Systems, this project introduces:

- AI-powered OJT Risk Prediction
- Early Warning System
- Decision Support Dashboard
- Supporting Class Recommendation
- Centralized OJT Management
- University–Student–Enterprise Integration
- AI-assisted Academic Decision Making

---

# Team

**Graduation Capstone Project**

**FPT University**

**Major:** Information Systems

**Academic Year:** 2026

| Name | Role |
|------|------|
| Hoang Tran My Duyen | Team Leader |
| Pham Minh Tuan | Member |
| Le Minh Nhat | Member |
| Tran Thi Thu Ha | Member |
| Nguyen Minh Hai | Member |

**Supervisor**

Mr. Tran Thanh Nguyen

---

# License

This project is developed exclusively for academic and research purposes as part of the Graduation Capstone Project at FPT University.

© 2025–2026 OJT Readiness & Risk Prediction System Team. All Rights Reserved.
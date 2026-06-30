# AI Traffic Cop Pro: AI-Powered Traffic Violation Detection
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![PostgreSQL](https://img.shields.io/badge/postgresql-4169e1?style=for-the-badge&logo=postgresql&logoColor=white)
## Overview
AI Traffic Cop Pro is an intelligent, web-based platform designed to monitor live traffic camera feeds. It leverages computer vision to automatically detect traffic violations—such as missing helmets, absent seatbelts, and overspeeding—and streamlines the e-challan generation process for traffic authorities.

## Problem Statement
Traditional traffic monitoring relies heavily on manual surveillance, leading to delayed enforcement, human error, and inefficiencies in high-traffic zones. This project aims to provide an automated, highly accurate monitoring dashboard that generates real-time alerts and digital evidence to improve road safety.

## Features
* Secure Role-Based Authentication (Admin & Traffic Officer)
* Live Multi-Camera Monitoring Interface
* Automated Helmet & Seatbelt Violation Detection
* OCR-Based Number Plate Recognition
* Real-Time Violation Alerts
* Searchable Offense History & Evidence Logs
* One-Click E-Challan PDF Generation

## System Workflow

```mermaid
flowchart TD
    A[Traffic Camera] -->|Live Video Feed| B(AI Detection Engine)
    B -->|YOLOv8 + OpenCV| C{Violation Detected?}
    C -- Yes --> D[Extract Number Plate via OCR]
    C -- No --> B
    D --> E[(Database Storage)]
    E --> F[Officer Dashboard UI]
    F --> G[Verify Evidence]
    G --> H[Generate E-Challan PDF]

```

## Basic Modules

The application is structured into the following core modules:

1. **User Authentication Module:**
* Handles secure login and role-based access for traffic officers and system administrators.


2. **Video Capture & AI Processing Module:**
* Interfaces with live traffic feeds, processing frames using YOLOv8 for object detection and EasyOCR for number plate extraction.


3. **Violation Management Module:**
* Logs detected offenses, captures cropped evidence images, and calculates confidence scores.


4. **Real-Time Dashboard Module:**
* An interactive frontend that displays live metrics, recent violations, and high-risk traffic zones.


5. **E-Challan Generation Module:**
* Compiles the captured evidence, vehicle details, location, and timestamp into an official PDF report.



## Database Design

### Table List

The database consists of the following key tables:

| Table Name | Description | Key Fields |
| --- | --- | --- |
| **`users`** | Stores credentials and roles for traffic authorities. | `id` (PK), `username`, `password_hash`, `role` |
| **`cameras`** | Tracks the active traffic cameras across the city. | `id` (PK), `location`, `status` |
| **`violations`** | Logs all detected traffic offenses and evidence. | `id` (PK), `camera_id` (FK), `vehicle_number`, `violation_type` |

### ER Diagram

```mermaid
erDiagram
    cameras ||--o{ violations : "captures"
    
    users {
        int id PK
        string username
        string password_hash
        string role
        timestamp created_at
    }
    cameras {
        int id PK
        string location
        string status
    }
    violations {
        int id PK
        int camera_id FK
        string vehicle_number
        string violation_type
        decimal confidence_score
        timestamp timestamp
        string status
    }

```

## Technologies Used

* **Frontend:** React.js, TypeScript, Tailwind CSS
* **Backend & AI Service:** Python, FastAPI, YOLOv8, OpenCV, EasyOCR
* **Database:** PostgreSQL
* **Other Tools:** GitHub, Render (for deployment)

## 🚀 How to Run Locally

### 1. Clone the Repository
\`\`\`bash
git clone https://github.com/DeepakDoss/AI-Traffic-Cop-Pro-AI-Powered-Traffic-Violation-Detection.git
\`\`\`

### 2. Start the FastAPI Backend (AI Processing)
Navigate to your backend directory, install the Python dependencies, and start the server:
\`\`\`bash
cd cop
pip install -r requirements.txt
uvicorn main:app --reload
\`\`\`

### 3. Start the React Frontend (Dashboard)
Open a new terminal, navigate to your frontend directory, and start the UI:
\`\`\`bash
cd Traffic
npm install
npm run dev
\`\`\`
*The dashboard will now be live on `localhost:5173` (or 3000).*

## Future Enhancements

* Integration with the Regional Transport Office (RTO) database.
* Automated SMS and Email penalty alerts to vehicle owners.
* Advanced heatmap analytics for city planning.

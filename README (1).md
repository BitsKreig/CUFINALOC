# 📘 OptiClass – Smart & Adaptive Timetable Scheduler  

OptiClass is a **smart and responsive timetable scheduling tool** tailored for institutions of higher learning. It addresses the limitations of traditional timetable management systems by solving key challenges such as:  

- Conflicting classes  
- Imbalanced faculty workload allocation  
- Underused classrooms/labs  
- Complexity arising from NEP-2020’s multidisciplinary curricula  

OptiClass ensures **adaptive, conflict-free, and stress-sensitive** timetables for students, faculty, and institutions.  
![GitHub repo size](https://img.shields.io/github/repo-size/BitsKreig/SIH1.0?color=blue)  
![GitHub contributors](https://img.shields.io/github/contributors/BitsKreig/SIH1.0?color=green)  
![GitHub forks](https://img.shields.io/github/forks/BitsKreig/SIH1.0?style=social)  
![GitHub stars](https://img.shields.io/github/stars/BitsKreig/SIH1.0?style=social)  
![License](https://img.shields.io/github/license/BitsKreig/SIH1.0)  
## 📝 Problem Statement  
The current scheduling mechanism in most higher education institutes/colleges relies on manual input via spreadsheets or basic tools. These fail to account for:  

- Real-time availability of faculty  
- Room capacity  
- Teaching load norms  
- Subject combinations  
- Student preferences  

A solution is required that generates optimized timetables for **UG and PG students** while ensuring flexibility, fairness, and adaptability to dynamic academic needs.  

## 🎯Three-Phase Triage Model
OptiClass introduces a **Three-Phase Triage-Based Timetable Generation** methodology. Unlike static timetables, it dynamically aligns with the **natural rhythm of an academic term**.  

### 🔹 Phase I – Semester Start (Course Foundations & Early Completion)  
- **Mode:** Syllabus-mandatory only, 6–8 classes per day.  
- **Why:** Early semester is less disturbed; ideal for covering heavy credit courses.  
- **Effectiveness:** Front-loads the syllabus, ensuring progress before disruptions arise.  

### 🔹 Phase II – Mid Semester (Balanced with Co-Curriculars)  
- **Mode:** 4–5 classes per day, moderately paced.  
- **Why:** Academic calendars are busiest with fests, visits, hackathons, and assessments.  
- **Effectiveness:** Balances academics with co-curriculars, enabling holistic NEP-2020 alignment.  

### 🔹 Phase III – End Semester (Light & Exam-Focused)  
- **Mode:** 2–3 classes per day, lighter schedule.  
- **Why:** Students need revision time, practice, and doubt-clearing before exams.  
- **Effectiveness:** Reduces stress, enhances mastery, and improves exam performance.  

**Flexibility:** The triage system can be customized by administrators for institutional needs.
## 💡Why This Triage Model Works
- Reflects **natural learning flow** of a semester  
- Secures **early syllabus completion**  
- Creates **mid-term flexibility** for co-curriculars  
- Provides **stress-free exam preparation**  
- Ensures optimized outcomes for both students and faculty  

---
## 🚀Features
- **Faculty Workload Balancing** – Accounts for availability, leaves, and fair distribution *(in development)*  
- **Room/Lab Management** – Tracks availability and resolves conflicts automatically *(in development)*  
- **Multiple Optimized Options** – Generates several timetable variations per phase; admins/faculty select the best fit *(working)*  
- **Role-Based Access**  
  - Admin → global settings, conflict resolution, approvals  
  - Faculty → view schedules, request changes  
- **Machine-Readable Output** – Timetables exportable in formats compatible with ERP systems and college websites  

---
## 🔮Novelty & Future Scope
OptiClass stands apart from existing timetable tools through:  

- **Three-Phase Triage Model** – Adaptive scheduling aligned with academic cycles  
- **Dynamic Adaptability** – Adjusts to events, absences, and interruptions  
- **Faculty-Centric Design** – Ensures equity in workload distribution and request flexibility  
- **Machine Learning Upgrade Path** *(under development)* – Leverages historical data and feedback for predictive, personalized scheduling  
- **Holistic NEP-2020 Support** – Integrates multidisciplinary and experiential learning  

---
## 🏗️ System Architecture
- **Frontend:** React + Tailwind CSS  
- **Backend:** Flask (Python) + C++ (core logic)  
- **APIs:** JSON-based for low latency & easy integration  
- **Database:** In-memory database (scalable to persistent DBs for large institutions)  

This architecture allows deployment in universities with **thousands of students and hundreds of faculty**.  

---
## ⚙️ Installation & Setup 
### Prerequisites  
- Node.js (>=16)  
- Python (>=3.8)  
- g++ compiler  
- Git  

### Steps  

1. **Clone the Repository**  
   ```bash
   git clone https://github.com/BitsKreig/SIH1.0.git
   cd SIH1.0
   ```

2. **Backend Setup**  
   ```bash
   cd backend
   pip install -r requirements.txt
   python app.py
   ```

3. **Compile Core C++ Logic**  
   ```bash
   g++ scheduler.cpp -o scheduler
   ```

4. **Frontend Setup**  
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

App runs at: **http://localhost:5173/**  

---
## ▶️Usage Guide
1. Admin logs in and sets institutional parameters  
2. Faculty can view or request modifications to phase-wise timetables  
3. System generates **multiple optimized timetables**  
4. Admin reviews and publishes the final timetable  

---
## 📈 Impact & Benefits  
- **Students:** Reduced stress, balanced schedules, exam readiness  
- **Faculty:** Fair workload, fewer clashes, flexibility for requests  
- **Institutions:** Efficient resource utilization, ERP integration, adaptive scheduling  

---
## 📚 References
Supporting resources and documents:  
🔗 [Google Drive Reference Folder](https://drive.google.com/drive/folders/19Kj1GVRx8mHI7H1zs2O6ePp1Sjxzpd6f?usp=drive_link)  

---
## 👥 Team – *BitsKreig*  
- Soumesh Nanda  
- Anurag Yadav  
- Nisha Kumari Singh  
- Animesh Kumar Pandey  
- Ayushmaan Singh  
- Aaramabh Vaish  

---
## 📜 License
This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.  

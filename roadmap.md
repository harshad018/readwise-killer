# Project Roadmap: Readwise Killer

**Deadline:** 1 Month
**Goal:** Build a fully functional, deployable (Firebase free tier) Readwise alternative without using LLMs.

## Week 1: Foundation & Infrastructure
- [x] Initialize React application.
- [x] Set up Firebase project (Auth, Firestore).
- [x] Design database schema for Users, Articles, and Highlights.
- [x] Implement basic User Authentication UI (Login/Signup).

## Week 2: Ingestion & Parsing
- [ ] Implement manual highlight entry UI.
- [ ] Integrate Readability.js (or similar) for parsing article content from URLs.
- [ ] Build basic "Read-it-later" list view.

## Week 3: The Brain (Spaced Repetition)
- [ ] Implement SuperMemo-2 (SM-2) algorithm in code for spaced repetition.
- [ ] Create the "Daily Review" generation logic (fetching due highlights).
- [ ] Build the Daily Review UI (Flashcard style).

## Week 4: Polish & Deployment
- [ ] Refine UI/UX (make it look better than Readwise).
- [ ] Comprehensive testing of the spaced repetition logic.
- [ ] Write deployment documentation.
- [ ] Deploy to Firebase Hosting.

---

## Daily Log

### Day 1 (August 03, 2026)
- **Completed:** 
  - Created GitHub repository (`readwise-killer`).
  - Conducted web research on Readwise core features and open-source alternatives.
  - Drafted initial `README.md` and `roadmap.md`.
- **Target for Day 2:** 
  - Initialize the React application locally.
  - Set up the Firebase project structure and add configuration files.

### Day 2 (August 04, 2026)
- **Completed:** 
  - Initialized React application structure using CDN approach for simpler Firebase deployment without build steps.
  - Created `index.html`, `app.js`, and `style.css`.
  - Set up Firebase project structure (`firebase.json`, `.firebaserc`) and added `firebase-config.js` with placeholders for credentials.
- **Target for Day 3:** 
  - Design database schema for Users, Articles, and Highlights.
  - Implement basic User Authentication UI (Login/Signup) and connect to Firebase Auth.

### Day 3 (August 07, 2026)
- **Completed:**
  - Designed Firestore database schema and documented it in `database-schema.md`.
  - Implemented basic User Authentication UI (Login/Signup) in `app.js`.
  - Connected UI to Firebase Auth by exposing methods globally in `firebase-config.js`.
- **Target for Day 4:**
  - Implement manual highlight entry UI.
  - Set up Firestore write operations to save new highlights to the database.
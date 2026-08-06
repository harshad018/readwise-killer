# Project Roadmap: Readwise Killer

**Deadline:** 1 Month
**Goal:** Build a fully functional, deployable (Firebase free tier) Readwise alternative without using LLMs.

## Week 1: Foundation & Infrastructure
- [x] Initialize React application.
- [x] Set up Firebase project (Auth, Firestore).
- [x] Design database schema for Users, Articles, and Highlights.
- [x] Implement basic User Authentication UI (Login/Signup).

## Week 2: Ingestion & Parsing
- [x] Implement manual highlight entry UI.
- [x] Integrate Readability.js (or similar) for parsing article content from URLs.
- [x] Build basic "Read-it-later" list view.

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

### Day 1 Part 2 (August 03, 2026)
- **Completed:** 
  - Initialized React application structure using CDN approach for simpler Firebase deployment without build steps.
  - Created `index.html`, `app.js`, and `style.css`.
  - Set up Firebase project structure (`firebase.json`, `.firebaserc`) and added `firebase-config.js` with placeholders for credentials.
- **Target for Day 2:** 
  - Design database schema for Users, Articles, and Highlights.
  - Implement basic User Authentication UI (Login/Signup) and connect to Firebase Auth.

### Day 2 (August 04, 2026)
- **Completed:** 
  - Designed database schema for Users, Articles, and Highlights (documented in `schema.md`).
  - Implemented basic User Authentication UI (Login/Signup) in React (`public/app.js`).
  - Connected UI to Firebase Auth by exposing Firebase methods globally (`public/firebase-config.js`).
- **Target for Day 3:** 
  - Implement manual highlight entry UI.
  - Set up Firestore integration to save and retrieve manual highlights for the logged-in user.

### Day 3 (August 05, 2026)
- **Completed:**
  - Implemented manual highlight entry UI in React (`public/app.js`).
  - Set up Firestore integration to save and retrieve manual highlights for the logged-in user.
  - Updated `firebase-config.js` to expose necessary Firestore methods.
  - Added styling for the new UI elements in `public/style.css`.
- **Target for Day 4:**
  - Integrate Readability.js (or similar) for parsing article content from URLs.
  - Build basic "Read-it-later" list view.

### Day 4 (August 06, 2026)
- **Completed:**
  - Integrated a lightweight DOMParser approach with a CORS proxy (`allorigins.win`) to fetch and parse article content from URLs without needing a backend.
  - Built the "Read-it-later" list view in React (`public/app.js`) to display saved articles.
  - Updated `public/style.css` to implement a responsive two-column dashboard grid for highlights and articles.
- **Target for Day 5:**
  - Implement SuperMemo-2 (SM-2) algorithm in code for spaced repetition.
  - Create the "Daily Review" generation logic (fetching due highlights).

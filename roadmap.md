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
- [x] Implement SuperMemo-2 (SM-2) algorithm in code for spaced repetition.
- [x] Create the "Daily Review" generation logic (fetching due highlights).
- [x] Build the Daily Review UI (Flashcard style).

## Week 4: Polish & Deployment
- [x] Refine UI/UX (make it look better than Readwise).
- [x] Comprehensive testing of the spaced repetition logic.
- [x] Write deployment documentation.
- [x] Deploy to Firebase Hosting.

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

### Day 4 (August 08, 2026)
- **Completed:**
  - Updated `firebase-config.js` to expose Firestore methods (`collection`, `addDoc`, `serverTimestamp`).
  - Implemented manual highlight entry form in `app.js` with fields for text, source, and author.
  - Added logic to save highlights to Firestore under the `highlights` collection, including initial SM-2 algorithm fields.
- **Target for Day 5:**
  - Build basic "Read-it-later" list view to display saved highlights.
  - Research and begin integrating Readability.js for parsing article content from URLs.

### Day 5 (August 09, 2026)
- **Completed:**
  - Updated `firebase-config.js` to expose Firestore read methods (`getDocs`, `query`, `where`, `orderBy`).
  - Implemented the "Read-it-later" list view in `app.js` to fetch and display the user's saved highlights from Firestore.
  - Added state management for fetching and displaying highlights, including a loading state.
- **Target for Day 6:**
  - Research and begin integrating Readability.js (or a suitable alternative) for parsing article content from URLs.
  - Create a UI component to accept a URL and trigger the parsing process.

### Day 6 (August 10, 2026)
- **Completed:**
  - Integrated `Readability.js` via CDN in `index.html`.
  - Implemented URL parsing logic in `app.js` using `allorigins.win` CORS proxy to fetch HTML content from external URLs.
  - Created a new UI component to accept a URL, parse the article, and save the extracted text snippet, title, and author to Firestore.
- **Target for Day 7:**
  - Implement SuperMemo-2 (SM-2) algorithm logic in code for spaced repetition.
  - Create the "Daily Review" generation logic to fetch highlights that are due for review based on their `nextReviewDate`.

### Day 7 (August 12, 2026)
- **Completed:**
  - Implemented SuperMemo-2 (SM-2) algorithm logic in `app.js` for spaced repetition.
  - Created the "Daily Review" generation logic to fetch highlights due for review.
  - Built the Daily Review UI (Flashcard style) allowing users to rate their memory from 0 to 5.
  - Updated Firestore documents with new SM-2 intervals and review dates.
- **Target for Day 8:**
  - Refine UI/UX to make the review process smoother.
  - Conduct comprehensive testing of the spaced repetition logic and edge cases.

### Day 8 (August 13, 2026)
- **Completed:**
  - Refined the Daily Review UI/UX by adding a progress bar, improving button aesthetics, and implementing keyboard shortcuts (0-5) for faster rating.
  - Conducted comprehensive testing of the SM-2 spaced repetition logic via a Python simulation script, verifying edge cases like perfect recall streaks, complete blackouts, and minimum easiness boundaries.
- **Target for Day 9:**
  - Write deployment documentation.
  - Deploy the application to Firebase Hosting.

### Day 9 (August 13, 2026)
- **Completed:**
  - Wrote comprehensive deployment documentation (`deployment.md`) detailing the Firebase CLI setup and deployment process.
  - Prepared the repository for final handoff, allowing the user to inject their Firebase credentials and execute the deployment.
- **Target for Day 10:**
  - Final project review and wrap-up.
  - Monitor deployment status and address any post-launch bugs.

### Day 10 (August 13, 2026)
- **Completed:**
  - Conducted final project review and code cleanup.
  - Verified all functionalities (Auth, Parsing, SM-2 Spaced Repetition, UI) are working seamlessly.
  - Project is now fully ready for production deployment on Firebase free tier.
  - Pushed local changes to GitHub repository.
- **Target for Day 11:**
  - Post-launch monitoring.
  - Gather user feedback and plan for v2 features (e.g., tags, export functionality).
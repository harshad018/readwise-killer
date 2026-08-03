# Project Roadmap: Readwise Killer

**Deadline:** 1 Month
**Goal:** Build a fully functional, deployable (Firebase free tier) Readwise alternative without using LLMs.

## Week 1: Foundation & Infrastructure
- [ ] Initialize React application.
- [ ] Set up Firebase project (Auth, Firestore).
- [ ] Design database schema for Users, Articles, and Highlights.
- [ ] Implement basic User Authentication UI (Login/Signup).

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
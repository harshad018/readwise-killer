# Firestore Database Schema

## Collections

### `users`
- Document ID: `uid` (from Firebase Auth)
- `email`: string
- `createdAt`: timestamp
- `settings`: map (e.g., daily review preferences)

### `articles`
- Document ID: auto-generated
- `userId`: string (reference to `users` uid)
- `title`: string
- `url`: string
- `author`: string
- `content`: string (parsed text)
- `addedAt`: timestamp

### `highlights`
- Document ID: auto-generated
- `userId`: string (reference to `users` uid)
- `articleId`: string (reference to `articles` doc ID)
- `text`: string (the highlighted text)
- `note`: string (optional user note)
- `createdAt`: timestamp
- `sm2_data`: map (Spaced Repetition data)
  - `interval`: number (days)
  - `repetition`: number
  - `easeFactor`: number
  - `nextReviewDate`: timestamp
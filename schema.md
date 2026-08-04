# Database Schema (Firestore)

## Users Collection (`users`)
- `uid` (Document ID): String (Firebase Auth UID)
- `email`: String
- `createdAt`: Timestamp
- `lastLogin`: Timestamp
- `settings`: Object (e.g., daily review preferences)

## Articles Collection (`articles`)
- `id` (Document ID): String (Auto-generated)
- `userId`: String (Reference to `users.uid`)
- `url`: String
- `title`: String
- `author`: String
- `content`: String (Parsed text content)
- `addedAt`: Timestamp
- `tags`: Array of Strings

## Highlights Collection (`highlights`)
- `id` (Document ID): String (Auto-generated)
- `userId`: String (Reference to `users.uid`)
- `articleId`: String (Reference to `articles.id`)
- `text`: String (The highlighted text)
- `note`: String (Optional user note)
- `createdAt`: Timestamp
- `tags`: Array of Strings
- `sm2Data`: Object (Spaced Repetition Data)
  - `interval`: Number (Days)
  - `repetition`: Number
  - `efactor`: Number (Easiness factor)
  - `nextReviewDate`: Timestamp

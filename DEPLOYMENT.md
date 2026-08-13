# Deployment Guide: Readwise Killer

This guide will walk you through deploying the Readwise Killer application to Firebase Hosting on the free tier (Spark plan).

## Prerequisites

1. **Node.js and npm**: Ensure you have Node.js installed on your machine.
2. **Firebase CLI**: Install the Firebase Command Line Interface globally by running:
   ```bash
   npm install -g firebase-tools
   ```

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click on **Add project** and follow the prompts to create a new project.
3. Once created, navigate to **Build > Authentication** and enable **Email/Password** sign-in.
4. Navigate to **Build > Firestore Database** and create a database. Start in **Test Mode** for development, or set up proper security rules for production.

## Step 2: Add Firebase Credentials

1. In the Firebase Console, go to **Project Overview** and click the **Web** icon (`</>`) to add a web app to your project.
2. Register the app (you can name it "Readwise Killer").
3. Firebase will provide you with a `firebaseConfig` object. It looks like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```
4. Open the `public/firebase-config.js` file in this repository.
5. Replace the placeholder `firebaseConfig` object with the one you just copied from the Firebase Console.

## Step 3: Initialize Firebase Locally

1. Open your terminal and navigate to the root directory of this repository (`readwise-killer`).
2. Log in to Firebase:
   ```bash
   firebase login
   ```
3. Initialize your project:
   ```bash
   firebase init
   ```
4. Select **Hosting: Configure files for Firebase Hosting and (optionally) set up GitHub Action deploys**.
5. Select **Use an existing project** and choose the project you created in Step 1.
6. When asked "What do you want to use as your public directory?", type `public` and press Enter.
7. When asked "Configure as a single-page app (rewrite all urls to /index.html)?", type `y` (Yes).
8. When asked "Set up automatic builds and deploys with GitHub?", type `N` (No) for now.
9. If asked to overwrite `public/index.html`, type `N` (No).

## Step 4: Deploy to Firebase Hosting

1. Once initialization is complete, you can deploy your app by running:
   ```bash
   firebase deploy --only hosting
   ```
2. Firebase will upload your files and provide you with a **Hosting URL** (e.g., `https://your-project-id.web.app`).
3. Open that URL in your browser to see your live Readwise Killer app!

## Step 5: Firestore Security Rules (Important for Production)

Before sharing your app, ensure your Firestore database is secure. Go to **Firestore Database > Rules** in the Firebase Console and update them to ensure users can only read and write their own data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /highlights/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

Congratulations! You have successfully deployed the Readwise Killer.
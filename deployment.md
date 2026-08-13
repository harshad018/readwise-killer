# Deployment Guide: Readwise Killer

This document outlines the steps to deploy the Readwise Killer application to Firebase Hosting. Since the application is built using React via CDN and standard HTML/JS/CSS, there is no build step required.

## Prerequisites
1. **Node.js & npm:** Ensure you have Node.js installed on your machine.
2. **Firebase CLI:** Install the Firebase Command Line Interface globally:
   ```bash
   npm install -g firebase-tools
   ```
3. **Firebase Account:** You must have a Google account and a Firebase project created in the [Firebase Console](https://console.firebase.google.com/).

## Step 1: Authenticate with Firebase
Open your terminal and log in to your Firebase account:
```bash
firebase login
```
Follow the prompts in your browser to authenticate.

## Step 2: Initialize Firebase Project
Navigate to the root directory of the `readwise-killer` repository in your terminal and run:
```bash
firebase init hosting
```

During initialization, answer the prompts as follows:
- **Project Setup:** Select `Use an existing project` and choose your Readwise Killer Firebase project.
- **Public Directory:** Type `public` (this is where our `index.html`, `app.js`, and `style.css` reside).
- **Single Page App:** Type `y` (Yes) to configure as a single-page app (rewrites all URLs to `/index.html`).
- **Automatic Builds/Deploys with GitHub:** Type `N` (No) for now, as we are doing a manual deployment.
- **Overwrite index.html:** Type `N` (No) to keep our existing `index.html`.

## Step 3: Add Firebase Credentials
Before deploying, you must add your specific Firebase project credentials to the application.
1. Open `public/firebase-config.js`.
2. Replace the placeholder values in the `firebaseConfig` object with your actual project settings from the Firebase Console (Project Settings > General > Your apps > Firebase SDK snippet).

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

## Step 4: Deploy to Firebase Hosting
Once the configuration is set, deploy the application by running:
```bash
firebase deploy --only hosting
```

## Step 5: Verify Deployment
After a successful deployment, the CLI will output a **Hosting URL** (e.g., `https://your-project-id.web.app`). Open this URL in your browser to verify the Readwise Killer is live.
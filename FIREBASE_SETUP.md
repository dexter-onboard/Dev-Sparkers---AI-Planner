# Firebase Setup Instructions

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard
4. Enable Google Analytics (optional)

## Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Email/Password** authentication
3. Click "Save"

## Step 3: Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Start in **test mode** (for development) or **production mode** (for production)
4. Select a location for your database
5. Click "Enable"

## Step 4: Set Up Security Rules (Important!)

Go to **Firestore Database** > **Rules** and update with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Click "Publish" to save the rules.

## Step 5: Get Your Firebase Config

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click the web icon (`</>`) to add a web app
4. Register your app with a nickname
5. Copy the Firebase configuration object

## Step 6: Update index.html

Open `index.html` and find the `firebaseConfig` object (around line 347). Replace the placeholder values with your actual Firebase config:

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

## Data Structure

The app stores user data in Firestore under the `users` collection with the following structure:

```javascript
{
  email: string,
  displayName: string,
  coins: number,
  studyMinutes: number,
  treeLevel: number,
  tasks: Array<{id: number, text: string, done: boolean}>,
  gamesUnlocked: boolean,
  streak: number,
  lastStudyDate: Timestamp,
  profilePic: string,
  createdAt: Timestamp,
  lastUpdated: Timestamp
}
```

## Features Enabled

✅ Email/Password Authentication
✅ User data persistence in Firestore
✅ Real-time data sync
✅ Streak tracking
✅ Task management
✅ Study time tracking
✅ Tree growth visualization
✅ Coins and rewards system

## Testing

1. Open `index.html` in a web browser
2. Click "New here? Create account"
3. Enter an email and password
4. Your account will be created and data will be saved to Firestore
5. Sign out and sign back in to verify persistence

## Troubleshooting

- **Authentication errors**: Make sure Email/Password is enabled in Firebase Console
- **Permission denied**: Check your Firestore security rules
- **Data not saving**: Check browser console for errors and verify Firebase config is correct


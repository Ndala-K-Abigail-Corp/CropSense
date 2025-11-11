# 🔥 Firebase Setup Guide for CropSense

This guide will walk you through setting up Firebase for the CropSense application.

## 📋 Prerequisites

- A Google account
- Access to [Firebase Console](https://console.firebase.google.com/)

---

## 🚀 Step-by-Step Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `cropsense-dev` (or your preferred name)
4. (Optional) Enable Google Analytics
5. Click **"Create project"**

### 2. Register Your Web App

1. In your Firebase project, click the **Web icon** (`</>`) to add a web app
2. Register app with nickname: `CropSense Web App`
3. Check **"Also set up Firebase Hosting"** (optional)
4. Click **"Register app"**
5. Copy the Firebase configuration object - you'll need these values!

### 3. Enable Authentication

1. In the Firebase Console sidebar, go to **Build > Authentication**
2. Click **"Get started"**
3. Enable **Email/Password** sign-in:
   - Click on "Email/Password" provider
   - Toggle **Enable**
   - Click **"Save"**

4. Enable **Google** sign-in:
   - Click on "Google" provider
   - Toggle **Enable**
   - Enter project support email
   - Click **"Save"**

### 4. Set Up Firestore Database

1. In the Firebase Console sidebar, go to **Build > Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (for development)
   - Location: Choose closest to your region
   - Click **"Enable"**

**Important:** For production, you'll need to update the security rules!

### 5. Configure Firebase Storage

1. In the Firebase Console sidebar, go to **Build > Storage**
2. Click **"Get started"**
3. Choose **"Start in test mode"** (for development)
4. Click **"Next"** and then **"Done"**

### 6. Get Your Firebase Configuration

1. Go to **Project settings** (gear icon in sidebar)
2. Scroll down to **"Your apps"** section
3. You'll see your web app with a config object like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

### 7. Add Configuration to Your App

1. Open `apps/web/.env` file
2. Replace the placeholder values with your Firebase config:

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
VITE_API_URL=http://localhost:8000
```

3. **Important:** Never commit `.env` files with real credentials!

---

## 🔒 Security Rules (Production)

### Firestore Rules

Replace the test mode rules with these production rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow create: if isOwner(userId);
      allow update: if isOwner(userId);
    }
    
    match /conversations/{conversationId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isOwner(resource.data.userId);
      
      match /messages/{messageId} {
        allow read: if isOwner(get(/databases/$(database)/documents/conversations/$(conversationId)).data.userId);
        allow create: if isAuthenticated();
      }
    }
    
    match /vectorChunks/{chunkId} {
      allow read, write: if false; // Server-only
    }
  }
}
```

### Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /avatars/{userId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /documents/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if false; // Admin only
    }
  }
}
```

---

## ✅ Verify Setup

1. Start the development server:
   ```bash
   pnpm dev:web
   ```

2. Open http://localhost:3000

3. Try signing up with email/password

4. Try signing in with Google

5. Send a test message in the chat

6. Check Firebase Console:
   - **Authentication**: You should see your test user
   - **Firestore**: You should see `users`, `conversations`, and `messages` collections

---

## 🐛 Troubleshooting

### "Auth Domain is not configured"
- Make sure you've added `localhost` to authorized domains
- Go to: Authentication > Settings > Authorized domains

### "Missing or insufficient permissions"
- Check your Firestore security rules
- Make sure you're in test mode for development

### "Invalid API key"
- Double-check your `.env` file values
- Make sure there are no extra spaces or quotes
- Restart the dev server after changing `.env`

### Google Sign-In not working
- Verify Google provider is enabled in Firebase Console
- Check that you've set a support email
- Make sure `authDomain` is correct in your `.env`

---

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)

---

## 🎉 Next Steps

Once Firebase is configured:

1. ✅ Test user registration and login
2. ✅ Test chat message persistence
3. ✅ Test conversation history
4. 🔄 Connect to Python RAG backend
5. 🔄 Deploy Firestore security rules
6. 🔄 Set up Firebase Hosting for deployment

---

**Need Help?** Check the [Technical Design Document](./docs/Technical%20Design%20Doc.md) for more details about the architecture.


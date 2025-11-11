/**
 * Cloud Functions for CropSense
 * 
 * This is a starter template for Firebase Cloud Functions.
 * Implement tRPC handlers and other serverless functions here.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

/**
 * Health check endpoint
 */
export const health = functions.https.onRequest((request, response) => {
  response.json({
    status: 'healthy',
    service: 'cropsense-functions',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Example: User creation trigger
 * Creates a user profile document when a new user signs up
 */
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName, photoURL } = user;
  
  try {
    await admin.firestore().collection('users').doc(uid).set({
      uid,
      email,
      displayName: displayName || null,
      photoURL: photoURL || null,
      role: 'user',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log(`User profile created for ${uid}`);
  } catch (error) {
    console.error('Error creating user profile:', error);
  }
});

/**
 * Example: Conversation cleanup
 * Delete old conversations (could be scheduled)
 */
export const cleanupOldConversations = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async () => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90); // 90 days old
    
    const conversationsRef = admin.firestore().collection('conversations');
    const oldConversations = await conversationsRef
      .where('updatedAt', '<', cutoffDate)
      .get();
    
    const batch = admin.firestore().batch();
    oldConversations.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`Deleted ${oldConversations.size} old conversations`);
  });

/**
 * TODO: Implement tRPC handlers
 * - chat.sendMessage
 * - chat.getHistory
 * - conversation.list
 * - conversation.create
 * - admin.triggerIngest
 */


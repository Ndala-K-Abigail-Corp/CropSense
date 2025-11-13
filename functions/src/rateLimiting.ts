/**
 * Rate Limiting Management
 * 
 * Tracks and updates user rate limits for conversations and messages
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Update rate limiting counters when a conversation is created
 */
export const onConversationCreate = functions.firestore
  .document('conversations/{conversationId}')
  .onCreate(async (snap, context) => {
    const conversation = snap.data();
    const userId = conversation.userId;
    
    if (!userId) {
      console.error('Conversation created without userId');
      return;
    }
    
    const userLimitRef = admin.firestore().collection('userLimits').doc(userId);
    const today = Math.floor(Date.now() / 86400000); // Days since epoch
    
    try {
      await admin.firestore().runTransaction(async (transaction) => {
        const limitDoc = await transaction.get(userLimitRef);
        
        if (!limitDoc.exists) {
          // Create new limit document
          transaction.set(userLimitRef, {
            userId,
            conversationsToday: 1,
            lastResetDate: today,
            messagesThisHour: 0,
            lastMessageHour: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } else {
          const data = limitDoc.data()!;
          const lastResetDate = data.lastResetDate || 0;
          
          if (today !== lastResetDate) {
            // New day, reset counter
            transaction.update(userLimitRef, {
              conversationsToday: 1,
              lastResetDate: today,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          } else {
            // Same day, increment counter
            transaction.update(userLimitRef, {
              conversationsToday: admin.firestore.FieldValue.increment(1),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        }
      });
      
      console.log(`Rate limit updated for user ${userId}`);
    } catch (error) {
      console.error('Error updating rate limit:', error);
    }
  });

/**
 * Update rate limiting counters when a message is created
 */
export const onMessageCreate = functions.firestore
  .document('conversations/{conversationId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    const conversationId = context.params.conversationId;
    
    try {
      // Get the conversation to find the userId
      const conversationDoc = await admin
        .firestore()
        .collection('conversations')
        .doc(conversationId)
        .get();
      
      if (!conversationDoc.exists) {
        console.error('Conversation not found');
        return;
      }
      
      const userId = conversationDoc.data()!.userId;
      const userLimitRef = admin.firestore().collection('userLimits').doc(userId);
      const currentHour = Math.floor(Date.now() / 3600000); // Hours since epoch
      
      await admin.firestore().runTransaction(async (transaction) => {
        const limitDoc = await transaction.get(userLimitRef);
        
        if (!limitDoc.exists) {
          // Create new limit document
          transaction.set(userLimitRef, {
            userId,
            conversationsToday: 0,
            lastResetDate: Math.floor(Date.now() / 86400000),
            messagesThisHour: 1,
            lastMessageHour: currentHour,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } else {
          const data = limitDoc.data()!;
          const lastMessageHour = data.lastMessageHour || 0;
          
          if (currentHour !== lastMessageHour) {
            // New hour, reset counter
            transaction.update(userLimitRef, {
              messagesThisHour: 1,
              lastMessageHour: currentHour,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          } else {
            // Same hour, increment counter
            transaction.update(userLimitRef, {
              messagesThisHour: admin.firestore.FieldValue.increment(1),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        }
      });
      
      // Also update conversation message count and updatedAt
      await admin
        .firestore()
        .collection('conversations')
        .doc(conversationId)
        .update({
          messageCount: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      
      console.log(`Message rate limit updated for user ${userId}`);
    } catch (error) {
      console.error('Error updating message rate limit:', error);
    }
  });

/**
 * Scheduled function to clean up old rate limit documents (runs daily)
 */
export const cleanupOldRateLimits = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async () => {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    try {
      const oldLimits = await admin
        .firestore()
        .collection('userLimits')
        .where('updatedAt', '<', new Date(sevenDaysAgo))
        .get();
      
      const batch = admin.firestore().batch();
      let count = 0;
      
      oldLimits.forEach((doc) => {
        batch.delete(doc.ref);
        count++;
      });
      
      if (count > 0) {
        await batch.commit();
        console.log(`Deleted ${count} old rate limit documents`);
      } else {
        console.log('No old rate limit documents to delete');
      }
    } catch (error) {
      console.error('Error cleaning up old rate limits:', error);
    }
  });



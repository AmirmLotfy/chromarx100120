import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const handleSubscription = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    // Verify Firebase Auth token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Get subscription details from request
    const { orderId, planId, paymentDetails } = req.body;

    // Store subscription in Firestore
    await admin.firestore().collection('subscriptions').doc(orderId).set({
      userId,
      planId,
      orderId,
      paymentDetails,
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update user's subscription status
    await admin.firestore().collection('users').doc(userId).set({
      subscriptionStatus: 'active',
      currentPlan: planId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    res.status(200).json({ message: 'Subscription processed successfully' });
  } catch (error) {
    console.error('Subscription processing error:', error);
    res.status(500).json({ error: 'Failed to process subscription' });
  }
});
import { db } from '../services/firebaseService';
import { env } from '../utils/env';

const APP_ID = env.APP_ID;
const COLLECTION_PATH = `artifacts/${APP_ID}/public/data/users`;

async function normalizeUsers() {
  console.log('Normalizing collection:', COLLECTION_PATH);
  const snapshot = await db.collection(COLLECTION_PATH).get();
  
  if (snapshot.empty) {
    console.log('No users found.');
    return;
  }

  const batch = db.batch();
  let count = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    const updates: any = {};
    
    // Normalize Role
    if (data.role && typeof data.role === 'string') {
      const lowerRole = data.role.toLowerCase();
      if (['Admin', 'Manager', 'Dispatcher', 'Auditor', 'Viewer'].includes(data.role)) {
        if (data.role !== lowerRole) {
          updates.role = lowerRole;
        }
      }
    }

    // Ensure isActive
    if (data.isActive === undefined) {
      updates.isActive = true;
    }

    if (Object.keys(updates).length > 0) {
      console.log(`Updating user ${doc.id}:`, updates);
      batch.update(doc.ref, updates);
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`Successfully normalized ${count} users.`);
  } else {
    console.log('No users needed normalization.');
  }
}

normalizeUsers().catch(console.error);

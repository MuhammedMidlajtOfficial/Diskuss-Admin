const admin = require("../firebaseConfig");

async function subscribeToTopic(fcmId, topic) {
  try {
    await admin.messaging().subscribeToTopic(users.map((user) => user.fcmId), `/topics/${topic}`);
    console.log(`Subscribed ${fcmId} to topic: ${topic}`);
  } catch (error) {
    console.error(`Failed to subscribe ${fcmId} to topic ${topic}:`, error.message);
  }
}

async function unsubscribeFromTopic(fcmId, topic) {
  try {
    await admin.messaging().subscribeToTopic(users.map((user) => user.fcmId), `/topics/${topic}`);
    console.log(`Unsubscribed ${fcmId} from topic: ${topic}`);
  } catch (error) {
    console.error(`Failed to unsubscribe ${fcmId} from topic ${topic}:`, error.message);
  }
}

module.exports = { subscribeToTopic, unsubscribeFromTopic };

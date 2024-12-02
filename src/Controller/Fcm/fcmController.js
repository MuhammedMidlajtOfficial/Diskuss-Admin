const fcmCollection = require("../../models/fcm.model");
const { subscribeToTopic, unsubscribeFromTopic } = require("../../Utils/topicUtils");
const User = require ("../../models/individualUser")
const enterpriseUser = require ("../../models/enterpriseUser")
const enterpriseEmploye = require ("../../models/enterpriseEmploye.model")
const admin = require ("../../firebaseConfig")


//Handle Login
exports.handleLogin = async (req, res) => {
  const { fcmId, userId, userType } = req.body;

  const generalTopic = "general";
  let topic = "unregistered";

  try {
    // Subscribe to the general topic
    await subscribeToTopic(fcmId, generalTopic);

    if (!userId || !userType) {
      await fcmCollection.updateOne(
        { fcmId },
        { $set: { topic } },
        { upsert: true }
      );
      await subscribeToTopic(fcmId, topic);
      return res.status(200).send("User added to 'unregistered' and 'general' topics.");
    }

    // Determine specific topics based on userType and isSubscribed
    let user;
    switch (userType) {
      case "individual":
        user = await User.findById(userId);
        topic = user?.isSubscribed ? "individual_subscribed" : "individual_trial";
        break;
      case "enterprise":
        user = await enterpriseUser.findById(userId);
        topic = user?.isSubscribed ? "enterprise_subscribed" : "enterprise_trial";
        break;
      case "employee":
        user = await enterpriseEmploye.findById(userId);
        topic = "enterprise_employee";
        break;
      default:
        throw new Error("Invalid userType");
    }

    if (!user) throw new Error("User not found");

    // Update FCM token with new topic
    await fcmCollection.updateOne(
      { fcmId },
      { $set: { userId, userType, topic } },
      { upsert: true }
    );
    await subscribeToTopic(fcmId, topic);

    res.status(200).send(`User added to '${topic}' and 'general' topics.`);
  } catch (error) {
    console.error("Error handling FCM login:", error.message);
    res.status(500).send("Failed to process FCM login.");
  }
};

//Handle Logout
exports.handleLogout = async (req, res) => {
  const { fcmId } = req.body;

  try {
    const topics = [
      "individual_subscribed",
      "individual_trial",
      "enterprise_subscribed",
      "enterprise_trial",
      "enterprise_employee",
    ];

    for (const topic of topics) {
      await unsubscribeFromTopic(fcmId, topic);
    }

    await fcmCollection.updateOne(
      { fcmId },
      { $set: { userId: null, userType: null, topic: "unregistered" } }
    );
    await subscribeToTopic(fcmId, "unregistered");

    res.status(200).send("User logged out and updated successfully.");
  } catch (error) {
    console.error("Error handling logout:", error.message);
    res.status(500).send("Failed to process logout.");
  }
};

// Send Notification
exports.sendNotification = async (req, res) => {
  const { title, body, imageUrl, topic } = req.body;

  if (!title || !body || !topic) {
    return res.status(400).send("Title, body, and topic are required.");
  }

  try {
    // Fetch users from the FCM collection based on topic
    const users = await fcmCollection.find({ topic });

    console.log("Users fetched from database:", users);

    if (!users || users.length === 0) {
      return res.status(404).send("No users found for the selected topic.");
    }

    // Subscribe users to the topic
    const fcmTokens = users.map((user) => user.fcmId);
    await admin.messaging().subscribeToTopic(fcmTokens, `/topics/${topic}`);

    console.log("Subscribed users to topic:", `/topics/${topic}`);

    // Prepare the message for FCM
    const message = {
      notification: {
        title: title,
        body: body,
      },
      data: {
        imageUrl: imageUrl || "",
      },
      topic: `/topics/${topic}`,
    };

    console.log("Message payload:", message);

    // Send the notification
    const response = await admin.messaging().send(message);
    console.log("Notification response:", response);

    res.status(200).send(`Notification sent to topic: ${topic}`);
  } catch (error) {
    console.error("Error sending notification:", error.message);
    res.status(500).send("Failed to send notification.");
  }
};



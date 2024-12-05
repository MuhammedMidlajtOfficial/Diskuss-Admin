const fcmCollection = require("../../models/fcm.model");
const { subscribeToTopic, unsubscribeFromTopic } = require("../../Utils/topicUtils");
const User = require ("../../models/individualUser")
const enterpriseUser = require ("../../models/enterpriseUser")
const enterpriseEmploye = require ("../../models/enterpriseEmploye.model")
const admin = require ("../../firebaseConfig")


// Handle Subscription Notification
exports.handleSubscription = async (req, res) => {
  const { fcmId, subscription } = req.body;

  if (!fcmId) {
    return res.status(400).send("FCM ID is required.");
  }

  try {
    // Check if subscription is active
    if (subscription) {
      const message = {
        notification: {
          title: "Plan Activated",
          body: "Your plan has been successfully activated! Enjoy the premium features.",
        },
        token: fcmId, // Send to specific FCM ID
      };

      // Send the notification
      const response = await admin.messaging().send(message);
      console.log("Subscription notification sent:", response);

      res.status(200).send("Subscription notification sent successfully.");
    } else {
      res.status(400).send("Subscription is not active.");
    }
  } catch (error) {
    console.error("Error sending subscription notification:", error.message);
    res.status(500).send("Failed to send subscription notification.");
  }
};


exports.sendMessageNotification = async (req, res) => {
  const { receiverId, senderName, content, chatId } = req.body;

  try {
    const fcmData = await fcmCollection.findOne({ userId: receiverId });

    if (!fcmData || !fcmData.fcmId) {
      return res.status(404).json({ error: "FCM ID not found for receiver." });
    }
    console.log("fcm Data",fcmData);

    const message = {
      notification: {
        title: `New message from ${senderName}`,
        body: content,
      },
      data: {
        chatId,
      },
      token: fcmData.fcmId,
    };

    const response = await admin.messaging().send(message);
    console.log("Message notification sent:", response);

    res.status(200).json({ message: "Notification sent successfully." });
  } catch (error) {
    console.error("Error sending notification:", error.message);
    res.status(500).json({ error: "Failed to send notification." });
  }
};


//Handle Login
exports.handleLogin = async (req, res) => {
  const { fcmId, userId, userType } = req.body;

  let topic = "unregistered";

  try {
    if (!userId || !userType) {
      await fcmCollection.updateOne(
        { fcmId },
        { $set: { topic } },
        { upsert: true }
      );
      await subscribeToTopic(fcmId, topic);
      return res.status(200).send("User added to 'unregistered' topic.");
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

    res.status(200).send(`User added to '${topic}' topic.`);
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



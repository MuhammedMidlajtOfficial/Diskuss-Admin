const fcmCollection = require("../../models/fcm.model");
const {
  subscribeToTopic,
  unsubscribeFromTopic,
} = require("../../Utils/topicUtils");
const User = require("../../models/individualUser");
const enterpriseUser = require("../../models/enterpriseUser");
const enterpriseEmploye = require("../../models/enterpriseEmploye.model");
const admin = require("../../firebaseConfig");

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
        data: {
          notificationType: "subscription",
        },
        token: fcmId, // Send to specific FCM ID
      };

      // Send the notification
      const response = await admin.messaging().send(message);
      console.log("Subscription notification sent:", response);
      console.log("message:", message);

      res.status(200).send("Subscription notification sent successfully.");
    } else {
      res.status(400).send("Subscription is not active.");
    }
  } catch (error) {
    console.error("Error sending subscription notification:", error.message);
    res.status(500).send("Failed to send subscription notification.");
  }
};

exports.handleSubscriptionExpiry = async (req, res) => {
  const { fcmId, daysRemaining } = req.body;

  if (!fcmId) {
    return res.status(400).send("FCM ID is required.");
  }

  if (daysRemaining === undefined || daysRemaining < 0) {
    return res
      .status(400)
      .send("Days remaining must be specified and non-negative.");
  }

  try {
    // Customize notification message based on remaining days
    let notificationBody = "";
    if (daysRemaining === 0) {
      notificationBody =
        "Your subscription ends today. Renew now to continue enjoying premium features.";
    } else if (daysRemaining <= 7) {
      notificationBody = `Your subscription will expire in ${daysRemaining} day(s). Renew now to avoid interruption.`;
    } else {
      notificationBody = `Your subscription will expire soon. Renew now to continue enjoying premium features.`;
    }

    const message = {
      notification: {
        title: "Subscription Expiry Alert",
        body: notificationBody,
      },
      data: {
        notificationType: "subscription",
        daysRemaining: daysRemaining.toString(),
      },
      token: fcmId, // Send to specific FCM ID
    };

    // Send the notification
    const response = await admin.messaging().send(message);
    console.log("Expiry notification sent:", response);
    console.log("Message:", message);

    res.status(200).send("Subscription expiry notification sent successfully.");
  } catch (error) {
    console.error("Error sending expiry notification:", error.message);
    res.status(500).send("Failed to send subscription expiry notification.");
  }
};

exports.sendMeetingAcceptanceNotification = async (req, res) => {
  const { userId, notification } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId is required." });
  }

  if (!notification || !notification.title || !notification.body) {
    return res
      .status(400)
      .json({ error: "Notification with title and body is required." });
  }

  try {
    const fcmDataList = await fcmCollection.find({ userId });
console.log(fcmDataList);

    if (!fcmDataList || fcmDataList.length === 0) {
      return res.status(404).json({ error: "FCM ID not found for the user." });
    }

    const message = fcmDataList.map((fcmData) => ({
      notification,
      token: fcmData.fcmId,
    }));

    const sendPromises = message.map((message) =>
      admin.messaging().send(message)
    );
    const response = await Promise.all(sendPromises);
    console.log(
      `Meeting acceptance notification sent to userId: ${userId}`,
      response
    );
    res
      .status(200)
      .json({
        message: "Meeting acceptance notification sent successfully.",
        response,
      });
  } catch (error) {
    console.error(
      "Error sending meeting acceptance notification:",
      error.message
    );
    res
      .status(500)
      .json({ error: "Failed to send meeting acceptance notification." });
  }
};

exports.sendMessageNotification = async (req, res) => {
  const { receiverId, senderName, content, chatId } = req.body;

  try {
    const fcmDataList = await fcmCollection.find({ userId: receiverId });
    console.log("fcm:", fcmDataList);

    if (!fcmDataList || fcmDataList.length === 0) {
      return res
        .status(404)
        .json({ error: "No FCM tokens found for the receiver." });
    }
    console.log("fcm Data", fcmDataList);

    const message = fcmDataList.map((fcmData) => ({
      notification: {
        title: `New message from ${senderName}`,
        body: content,
      },
      data: {
        chatId,
        notificationType: "message",
      },
      token: fcmData.fcmId,
    }));

    const sendPromises = message.map((message) =>
      admin.messaging().send(message)
    );
    const response = await Promise.all(sendPromises);
    console.log("Message notification sent:", response);

    res.status(200).json({ message: "Notification sent successfully." });
  } catch (error) {
    console.error("Error sending notification:", error.message);
    res.status(500).json({ error: "Failed to send notification." });
  }
};

exports.sendMeetingNotification = async (req, res) => {
  const { userIds, notification } = req.body;

  try {
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "No userIds provided." });
    }

    const uniqueUserIds = [...new Set(userIds)]; // Deduplicate userIds
    const processingSet = new Set(); // Declare the processing set here

    const notifications = await Promise.all(
      uniqueUserIds.map(async (userId) => {
        if (processingSet.has(userId)) {
          return null; // Skip if already processing this userId
        }
        processingSet.add(userId); // Mark userId as being processed

        const fcmData = await fcmCollection.findOne({ userId });

        if (!fcmData || !fcmData.fcmId) {
          console.error(`FCM ID not found for userId: ${userId}`);
          processingSet.delete(userId); // Cleanup processing set
          return null;
        }

        console.log(`FCM Data for userId ${userId}:`, fcmData);
        const message = {
          notification: {
            title: notification.title,
            body: notification.body,
          },
          data: {
            notificationType: "meeting",
          },
          token: fcmData.fcmId,
        };

        try {
          const response = await admin.messaging().send(message);
          console.log(`Notification sent to userId: ${userId}`, response);
          processingSet.delete(userId);
          return response;
        } catch (sendError) {
          console.error(
            `Error sending notification to userId: ${userId}`,
            sendError.message
          );
          processingSet.delete(userId);
          return null;
        }
      })
    );

    res
      .status(200)
      .json({ message: "Notifications sent.", details: notifications });
  } catch (error) {
    console.error("Error sending notifications:", error.message);
    res.status(500).json({ error: "Failed to send notifications." });
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
        topic = user?.isSubscribed
          ? "individual_subscribed"
          : "individual_trial";
        break;
      case "enterprise":
        user = await enterpriseUser.findById(userId);
        topic = user?.isSubscribed
          ? "enterprise_subscribed"
          : "enterprise_trial";
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
        notificationType: "home",
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

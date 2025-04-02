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
  const { fcmId, subscription ,userType } = req.body;

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
          notificationType: `${userType}-subscription`,
        },
        token: fcmId, // Send to specific FCM ID
      };
      console.log("mes:",message);

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
      data: {
        notificationType: `${fcmData.userType}-meeting`,
      }
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
        notificationType: `${fcmData.userType}-message`,
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

exports.sendAdminNotification = async (req, res) => {
  const { content, userType, image, video } = req.body;

  if (!["individual", "enterprise", "employee"].includes(userType)) {
    return res.status(400).json({ error: "Invalid user type" });
  }

  try {
    const fcmDataList = await fcmCollection.find({ userType });

    if (!fcmDataList || fcmDataList.length === 0) {
      return res.status(404).json({ error: "No users found for this user type." });
    }

    const messages = fcmDataList
      .map((fcmData) => {
        if (!fcmData.fcmId) return null;

        let notificationPayload = {
          title: "Know Connection - New Announcement",
          body: content,
        };

        if (image) {
          notificationPayload.imageUrl = image;
        }

        return {
          token: fcmData.fcmId,
          notification: notificationPayload,
          data: {
            videoUrl: video || "",
            notificationType: `${userType}-message`,
          },
        };
      })
      .filter((msg) => msg !== null && msg.token);

    if (messages.length === 0) {
      return res.status(404).json({ error: "No valid FCM tokens found." });
    }

    const sendPromises = messages.map((msg) => admin.messaging().send(msg));
    const response = await Promise.all(sendPromises);

    console.log("Admin notification sent:", response);

    return res.status(200).json({
      message: "Admin notification sent successfully.",
      notificationResponse: response,
    });

  } catch (error) {
    console.error("Error sending admin notification:", error.message || error);
    res.status(500).json({ error: "Failed to send admin notification.", details: error.message });
  }
};

exports.sendMeetingNotification = async (req, res) => {
  const { userIds, notification } = req.body;

  try {
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "No userIds provided." });
    }

    const uniqueUserIds = [...new Set(userIds)]; // Deduplicate userIds

    const notifications = await Promise.all(
      uniqueUserIds.map(async (userId) => {
        try {
          // Fetch all FCM IDs for the user
          const fcmDataList = await fcmCollection.find({ userId });

          if (!fcmDataList || fcmDataList.length === 0) {
            console.error(`No FCM tokens found for userId: ${userId}`);
            return null;
          }

          console.log(`FCM Data for userId ${userId}:`, fcmDataList);

          // Prepare and send notifications to all tokens
          const sendPromises = fcmDataList.map(async (fcmData) => {
            const message = {
              notification: {
                title: notification.title,
                body: notification.body,
              },
              data: {
              notificationType: `${fcmData.userType}-meeting`
              },
              token: fcmData.fcmId,
            };
            try {
              const response = await admin.messaging().send(message);
              console.log(`Notification sent to token: ${fcmData.fcmId}`, response);
              return response;
            } catch (sendError) {
              console.error(
                `Error sending notification to token: ${fcmData.fcmId}`,
                sendError.message
              );
              return null;
            }
          });

          // Await all send operations for the current userId
          return await Promise.all(sendPromises);
        } catch (error) {
          console.error(`Error processing userId: ${userId}`, error.message);
          return null;
        }
      })
    );

    res.status(200).json({ message: "Notifications sent.", details: notifications });
  } catch (error) {
    console.error("Error sending notifications:", error.message);
    res.status(500).json({ error: "Failed to send notifications." });
  }
};

exports.sendContactNotification = async (req, res) => {
  const { userIds, notification } = req.body;

  try {
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "No userIds provided." });
    }

    const uniqueUserIds = [...new Set(userIds)]; // Remove duplicate user IDs

    const notifications = await Promise.all(
      uniqueUserIds.map(async (userId) => {
        try {
          // Fetch all FCM tokens for the user
          const fcmDataList = await fcmCollection.find({ userId });

          if (!fcmDataList || fcmDataList.length === 0) {
            console.error(`No FCM tokens found for userId: ${userId}`);
            return null;
          }

          console.log(`FCM Data for userId ${userId}:`, fcmDataList);

          // Prepare and send notifications to all tokens
          const sendPromises = fcmDataList.map(async (fcmData) => {
            const message = {
              notification: {
                title: notification.title,
                body: notification.body,
              },
              data: {
                notificationType: `${fcmData.userType}-contact`,
              },
              token: fcmData.fcmId,
            };
            try {
              const response = await admin.messaging().send(message);
              console.log(`Notification sent to token: ${fcmData.fcmId}`, response);
              return response;
            } catch (sendError) {
              console.error(
                `Error sending notification to token: ${fcmData.fcmId}`,
                sendError.message
              );
              return null;
            }
          });

          // Await all send operations for the current userId
          return await Promise.all(sendPromises);
        } catch (error) {
          console.error(`Error processing userId: ${userId}`, error.message);
          return null;
        }
      })
    );

    res.status(200).json({ message: "Contact notifications sent.", details: notifications });
  } catch (error) {
    console.error("Error sending contact notifications:", error.message);
    res.status(500).json({ error: "Failed to send contact notifications." });
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
    return res.status(400).json({ error: "Title, body, and topic are required." });
  }

  try {
    // Fetch users with the given topic
    const users = await fcmCollection.find({ topic });

    console.log(`Users fetched for topic "${topic}":`, users);

    if (!users || users.length === 0) {
      console.warn(`No users found for the topic: ${topic}`);
      return res.status(404).json({ noUser:true, error: `No users found for topic: ${topic}` });
    }
    // Prepare the notification payload
    const payload = {
      notification: {
        title: title,
        body: body,
        imageUrl: imageUrl,
      },
      data: {
        notificationType: "home",
      },
    };

    const fcmIds = users.map(user => user.fcmId);

    // Send notification to each FCM ID
    const sendNotifications = fcmIds.map(async fcmId => {
      try {
        const response = await admin.messaging().send({
          ...payload,
          token: fcmId, // Send to a specific FCM token
        });
        console.log(`Notification successfully sent to FCM ID ${fcmId}:`, response);
        return { fcmId, status: "success", response };
      } catch (error) {
        console.error(`Failed to send notification to FCM ID ${fcmId}:`, error.message);
        return { fcmId, status: "failure", error: error.message };
      }
    });

    // Wait for all notifications to be sent
    const results = await Promise.all(sendNotifications);

    console.log("Notification sending results:", results);

    res.status(200).json({
      message: `Notifications sent to users subscribed to topic: ${topic}`,
      results,
    });
  } catch (error) {
    console.error("Error sending notifications:", error.message);
    res.status(500).json({ error: "Failed to send notifications." });
  }
};

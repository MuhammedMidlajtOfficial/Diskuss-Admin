const fcmCollection = require("../../models/fcm.model");
const admin = require("../../firebaseConfig");
const Contact = require("../../models/contact.individul.model");
const configModel = require("../../models/config/config.model");
const meetingCollection = require("../../models/EnterpriseMeetingModel");

async function sendNotificationsForOldRecords() {
  try {
    const config = await configModel.findById("678213c2026c07f016428945");
    if (!config) {
      console.error("Config document not found.");
      return;
    }

    // const sevenDaysAgo = new Date();
    // sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // const sevenDaysAgo = Date.now();

    const seventyTwoHoursAgo = new Date();
    seventyTwoHoursAgo.setHours(seventyTwoHoursAgo.getHours() - 72);

    console.log(seventyTwoHoursAgo);

    const oldRecords = await fcmCollection.find({
      updatedAt: { $lt: seventyTwoHoursAgo },
    });

    if (oldRecords.length === 0) {
      console.log("No old records found.");
      return;
    }

    console.log(`Found ${oldRecords.length} old records.`);

    console.log("message:", config.config["App Inactivity Remainder"]);

    for (const record of oldRecords) {
      const message = {
        notification: {
          title: "Reminder Notification",
          body: config.config["App Inactivity Remainder"],
        },
        token: record.fcmId,
        data: {
          notificationType: "home",
        },
      };

      try {
        const response = await admin.messaging().send(message);
        console.log(`Notification sent to ${record.fcmId}:`, response);

        record.updatedAt = new Date();
        await record.save();
      } catch (error) {
        console.error(`Error sending notification to ${record.fcmId}:`, error);
      }
    }
  } catch (error) {
    console.error("Error fetching old records:", error);
  }
}

async function notifyIncompleteContacts() {
  try {
    const config = await configModel.findById("678213c2026c07f016428945");
    if (!config) {
      console.error("Config document not found.");
      return;
    }

    const incompleteContacts = await Contact.find({
      "contacts.email": { $eq: "" },
    });

    if (incompleteContacts.length === 0) {
      console.log("No incomplete contacts found.");
      return;
    }

    console.log(`Found ${incompleteContacts.length} incomplete contacts.`);

    for (const record of incompleteContacts) {
      const contactNames = record.contacts
        .filter((contact) => contact.email === "")
        .map((contact) => contact.name)
        .join(", ");

      const fcmRecord = await fcmCollection.findOne({ userId: record.userId });
      console.log("fcm:", fcmRecord);

      if (!fcmRecord || !fcmRecord.fcmId) {
        console.error(`FCM ID not found for user ${record.userId}.`);
        continue;
      }

      const messageBody = config.config["Incomplete Contact Reminder"].replace(
        "${contactNames}",
        contactNames
      );
      console.log("message:", messageBody);
      console.log("FCM ID:", fcmRecord.fcmId);

      const message = {
        notification: {
          title: "Incomplete Contact Information",
          body: messageBody,
        },
        token: fcmRecord.fcmId,
        data: {
          notificationType: `${fcmRecord.userType}-contact`,
        },
      };

      try {
        const response = await admin.messaging().send(message);
        console.log(`Notification sent to ${record.fcmId}:`, response);
      } catch (error) {
        console.error(`Error sending notification to ${record.fcmId}:`, error);
      }
    }
  } catch (error) {
    console.error("Error fetching incomplete contacts:", error);
  }
}

async function sendMeetingNotifications() {
  try {
    const currentTime = new Date();

    // Get current date and time for comparison
    const currentDateString = currentTime.toISOString().split("T")[0]; // YYYY-MM-DD
    const now = new Date();

    // Fetch meetings scheduled for today
    const meetings = await meetingCollection.find({
      selectedDate: new Date(currentDateString), // Ensure selectedDate is a Date object
    });
    console.log("Meetings for today:", meetings);

    if (meetings.length === 0) {
      console.log("No meetings scheduled for today.");
      return;
    }

    for (const meeting of meetings) {
      // Validate time format
      if (
        !meeting.startTime.includes("AM") &&
        !meeting.startTime.includes("PM")
      ) {
        console.error(
          `Invalid time format for meeting "${meeting.meetingTitle}": ${meeting.startTime}`
        );
        continue; // Skip invalid meetings
      }

      // Parse meeting start time
      const [hours, minutes] = meeting.startTime
        .replace("AM", "")
        .replace("PM", "")
        .split(":")
        .map((str) => parseInt(str.trim(), 10));
      const isPM = meeting.startTime.includes("PM");
      const meetingHours = isPM && hours !== 12 ? hours + 12 : hours;
      const meetingMinutes = minutes;
      console.log("hours:", hours);
      console.log("min:", minutes);

      // Calculate notification time (30 minutes before)
      const notificationTime = new Date();
      notificationTime.setHours(meetingHours);
      notificationTime.setMinutes(meetingMinutes - 30);

      // Handle negative minutes
      if (notificationTime.getMinutes() < 0) {
        notificationTime.setHours(meetingHours - 1);
        notificationTime.setMinutes(60 + (meetingMinutes - 30));
      }

      // Compare current time with notification time (within ±1 minute)
      const diffInMinutes = Math.abs(
        Math.floor((notificationTime - now) / (1000 * 60))
      );
      if (diffInMinutes <= 1) {
        console.log(
          `Sending notifications for meeting "${meeting.meetingTitle}" starting in 30 minutes.`
        );

        // Notify meeting owner
        const ownerFcm = await fcmCollection.findOne({
          userId: meeting.meetingOwner,
        });
        console.log("Owner:", ownerFcm);

        if (ownerFcm && ownerFcm.fcmId) {
          await sendNotification(
            ownerFcm.fcmId,
            `Your meeting "${meeting.meetingTitle}" is starting in 30 minutes.`,
            ownerFcm.userType // Include the user type
          );
        }

        // Notify all invited people
        for (const invitee of meeting.invitedPeople) {
          const inviteeFcm = await fcmCollection.findOne({
            userId: invitee.user,
          });
          console.log("invited peopele:", inviteeFcm);

          if (inviteeFcm && inviteeFcm.fcmId) {
            await sendNotification(
              inviteeFcm.fcmId,
              `You are invited to the meeting "${meeting.meetingTitle}", which is starting in 30 minutes.`,
              inviteeFcm.userType // Include the user type
            );
          }
        }
      }
    }
  } catch (error) {
    console.error("Error fetching meetings or sending notifications:", error);
  }
}

// Helper function to send FCM notifications
async function sendNotification(fcmId, messageBody, userType) {
  const message = {
    notification: {
      title: "Meeting Reminder",
      body: messageBody,
    },
    token: fcmId,
    data: {
      notificationType: `${userType}-meeting`, // Include user type in the notification type
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log(`Notification sent to FCM ID ${fcmId}:`, response);
  } catch (error) {
    console.error(`Error sending notification to FCM ID ${fcmId}:`, error);
  }
}

module.exports = {
  sendNotificationsForOldRecords,
  notifyIncompleteContacts,
  sendMeetingNotifications,
};

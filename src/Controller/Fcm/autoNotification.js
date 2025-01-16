const fcmCollection = require("../../models/fcm.model");
const admin = require("../../firebaseConfig");
const Contact = require("../../models/contact.individul.model");
const configModel = require("../../models/config/config.model");

async function sendNotificationsForOldRecords() {
  try {
    const config = await configModel.findById("678213c2026c07f016428945");
    if (!config) {
      console.error("Config document not found.");
      return;
    }

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // const sevenDaysAgo = Date.now();

    const oldRecords = await fcmCollection.find({
      updatedAt: { $lt: sevenDaysAgo },
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
          notificationType:"home",
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
          notificationType: "contact",
        },
      };

      try {
        const response = await admin.messaging().send(message);
        console.log(`Notification sent to ${record.fcmId}:`, response);
      } catch (error) {
        console.error(
          `Error sending notification to ${record.fcmId}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error("Error fetching incomplete contacts:", error);
  }
}

module.exports = {
  sendNotificationsForOldRecords,
  notifyIncompleteContacts,
};

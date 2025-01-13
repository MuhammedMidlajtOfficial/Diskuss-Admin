const express = require("express");
const cors = require("cors");
const router = require("./Routes/index");
const connectDB = require("./DBConfig");
const cron = require("node-cron");
const { sendNotificationsForOldRecords, notifyIncompleteContacts } = require("./Controller/Fcm/autoNotification");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use("/api/v1", router)

app.use((err, req, res, next) => {
  res.locals.error = err;
  console.log(err);
  const statusCode = err.status || 500; // Default to 500 if no status is set
  res.status(statusCode).send({
      message: err.message || 'Internal Server Error',
  });
});

cron.schedule("*/1 * * * *", () => {
  console.log("Running cron job every minute...");
  sendNotificationsForOldRecords();
  notifyIncompleteContacts();
});

const PORT = process.env.PORT || 3000
connectDB.then(() => {
  app.listen(PORT, () => {
    console.log(`Server started running on port: ${PORT}`);
  });
});

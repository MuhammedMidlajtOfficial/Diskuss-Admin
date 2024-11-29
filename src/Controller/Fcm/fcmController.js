const fcmModel = require("../../models/fcm.model");

module.exports.postFcmId = async (req, res) => {
  try {
    const { fcmId, userId, userType } = req.body

    if ( !fcmId ) {
      return res.status(400).json({ message :"fcmId, userId and userType are required"}); // Correct response handling
    }

    const fcmTocken = fcmModel.create({
      fcmId, userId, userType
    })
    return res.status(201).json({ message:"Fcm tocken added", fcmTocken})
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports.getAllFcmId = async (req, res) => {
  try {
    const allFcmIds = await fcmModel.find(); // Await the query to resolve

    return res.status(200).json({ allFcmIds }); // Send the actual data
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

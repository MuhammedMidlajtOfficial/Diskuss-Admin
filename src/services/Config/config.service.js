const { mongoose } = require("mongoose");
const configModel = require("../../models/config/config.model");


module.exports.getAllConfig = async () => {
  try {
    // Fetch all configurations
    return await configModel.find();
  } catch (error) {
    console.error("Error fetching all configs from service:", error);
    throw error;
  }
};

module.exports.getSingleConfig = async (id) => {
  try {
    // Fetch the configuration document by ID
    return await configModel.findById(id);
  } catch (error) {
    console.error("Error fetching config from service:", error);
    throw error;
  }
};

module.exports.createConfig = async (configData) => {
  try {
    // Create and save the new configuration
    return await configModel.create({ config: configData})
  } catch (error) {
    console.error("Error creating configuration in service:", error);
    throw error; // Propagate the error to the controller
  }
};

module.exports.updateConfig = async (configId, configData) => {
  try {
    // Ensure the configId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(configId)) {
      throw new Error("Invalid ObjectId");
    }

    // Update the configuration document with the provided data
    const updatedConfig = await configModel.updateOne(
      { _id: configId }, // Query by ObjectId
      { $set: { config: configData } } // Update the 'config' field
    );

    return updatedConfig;
  } catch (error) {
    console.error("Error updating configuration in service:", error);
    throw error; // Propagate the error to the controller
  }
};

module.exports.deleteConfig = async (configId) => {
  try {
    // Delete the configuration by ID
    const result = await configModel.deleteOne({ _id: configId });
    return result;
  } catch (error) {
    console.error("Error deleting configuration in service:", error);
    throw error; // Propagate the error to the controller
  }
};
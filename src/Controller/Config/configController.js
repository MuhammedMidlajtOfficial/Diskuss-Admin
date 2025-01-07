const configService = require('../../services/Config/config.service');


module.exports.getAllConfig = async (req, res) => {
  try {
    // Fetch all configurations using the service
    const configs = await configService.getAllConfig();

    // Respond with the fetched configurations or a 404 error
    return configs && configs.length > 0
      ? res.status(200).json(configs)
      : res.status(404).json({ message: "No configurations found" });
  } catch (error) {
    console.error("Error fetching configurations:", error);
    res.status(500).json({ message: "Failed to get configurations", error });
  }
};

module.exports.getSingleConfig = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch config using service
    const config = await configService.getSingleConfig(id);

    // Return the config or a 404 error
    return config
      ? res.status(200).json(config)
      : res.status(404).json({ message: "Config not found with this ID" });
  } catch (error) {
    console.error("Error fetching config:", error);
    res.status(500).json({ message: "Failed to get config", error });
  }
};

module.exports.createConfig = async (req, res) => {
  try {
    // Call the service to create a new configuration
    const newConfig = await configService.createConfig(req.body);

    // Respond with the created configuration
    return res.status(201).json({ message :"Config created successfully", newConfig});
  } catch (error) {
    console.error("Error creating configuration in controller:", error);
    res.status(500).json({ message: "Failed to create configuration", error });
  }
};

module.exports.updateConfig = async (req, res) => {
  try {
    const { configId, ...configData } = req.body;

    // Call the service to update the configuration
    const updatedConfig = await configService.updateConfig(configId, configData);

    // Check if the update was successful
    if (updatedConfig.modifiedCount > 0) {
      return res.status(200).json({ message: "Config updated successfully" });
    } else {
      return res.status(404).json({ message: "Config not found or no changes made" });
    }
  } catch (error) {
    console.error("Error updating configuration in controller:", error);
    res.status(500).json({ message: "Failed to update configuration", error });
  }
};

module.exports.deleteConfig = async (req, res) => {
  try {
    const { configId } = req.body;

    // Call the service to delete the configuration
    const result = await configService.deleteConfig(configId);

    // Check if the deletion was successful
    if (result.deletedCount > 0) {
      return res.status(200).json({ message: "Config deleted successfully" });
    } else {
      return res.status(404).json({ message: "Config not found" });
    }
  } catch (error) {
    console.error("Error deleting configuration in controller:", error);
    res.status(500).json({ message: "Failed to delete configuration", error });
  }
};

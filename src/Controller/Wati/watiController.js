const crypto = require("crypto");
const Wati = require("../../models/wati.model");
require("dotenv").config();

// Constants
const ALGORITHM = "aes-256-cbc";
const SECRET_KEY = Buffer.from(process.env.SECRET_KEY, "hex"); // Ensure the key is parsed as a Buffer
const IV_LENGTH = 16; // IV must be 16 bytes for aes-256-cbc

// Helper Functions
/**
 * Encrypts a given text.
 * @param {string} text - The plain text to encrypt.
 * @returns {object} - An object containing the IV and encrypted data as hex strings.
 */
function encrypt(text) {
  if (!SECRET_KEY || SECRET_KEY.length !== 32) {
    throw new Error("Invalid SECRET_KEY. It must be 32 bytes long.");
  }

  const iv = crypto.randomBytes(IV_LENGTH); // Generate a random 16-byte IV
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  
  return {
    iv: iv.toString("hex"), // Return IV as hex string
    encryptedData: encrypted.toString("hex"), // Return encrypted data as hex string
  };
}

/**
 * Decrypts encrypted data.
 * @param {object} encrypted - An object containing the IV and encrypted data as hex strings.
 * @returns {string} - The decrypted plain text.
 */
function decrypt(encrypted) {
  if (!SECRET_KEY || SECRET_KEY.length !== 32) {
    throw new Error("Invalid SECRET_KEY. It must be 32 bytes long.");
  }

  const iv = Buffer.from(encrypted.iv, "hex"); // Convert IV back to Buffer
  if (iv.length !== IV_LENGTH) {
    throw new Error("Invalid IV length. IV must be 16 bytes.");
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted.encryptedData, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8"); // Return decrypted plain text
}



// CRUD Controller
const watiController = {
  // Create a new WATI record
  async create(req, res) {
    const { url, apiKey } = req.body;

    try {
      // Validate inputs
      if (!url || !apiKey) {
        return res
          .status(400)
          .json({ message: "URL and API Key are required" });
      }

      // Encrypt the API Key
      const encryptedApiKey = encrypt(apiKey);

      const wati = new Wati({
        url,
        apiKey: JSON.stringify(encryptedApiKey),
      });

      await wati.save();
      res
        .status(201)
        .json({ message: "WATI record created successfully", wati });
    } catch (error) {
      console.error("Error creating WATI record:", error);
      res.status(500).json({ message: "Failed to create WATI record", error });
    }
  },

  // Get all WATI records
  async getAll(req, res) {
    try {
      const watiRecords = await Wati.find();
      const decryptedRecords = watiRecords.map((wati) => ({
        ...wati._doc,
        apiKey: decrypt(JSON.parse(wati.apiKey)),
      }));
      res.status(200).json(decryptedRecords);
    } catch (error) {
      console.error("Error fetching WATI records:", error);
      res.status(500).json({ message: "Failed to fetch WATI records", error });
    }
  },

  // Get a single WATI record by ID
  async getById(req, res) {
    const { id } = req.params;

    try {
      const wati = await Wati.findById(id);
      if (!wati) {
        return res.status(404).json({ message: "WATI record not found" });
      }

      const decryptedApiKey = decrypt(JSON.parse(wati.apiKey));
      res.status(200).json({ ...wati._doc, apiKey: decryptedApiKey });
    } catch (error) {
      console.error("Error fetching WATI record:", error);
      res.status(500).json({ message: "Failed to fetch WATI record", error });
    }
  },

  // Update a WATI record
  async update(req, res) {
    const { id } = req.params;
    const { url, apiKey } = req.body;

    try {
      const wati = await Wati.findById(id);
      if (!wati) {
        return res.status(404).json({ message: "WATI record not found" });
      }

      if (url) wati.url = url;
      if (apiKey) {
        const encryptedApiKey = encrypt(apiKey);
        wati.apiKey = JSON.stringify(encryptedApiKey);
      }

      await wati.save();
      res
        .status(200)
        .json({ message: "WATI record updated successfully", wati });
    } catch (error) {
      console.error("Error updating WATI record:", error);
      res.status(500).json({ message: "Failed to update WATI record", error });
    }
  },

  // Delete a WATI record
  async delete(req, res) {
    const { id } = req.params;

    try {
      const wati = await Wati.findByIdAndDelete(id);
      if (!wati) {
        return res.status(404).json({ message: "WATI record not found" });
      }

      res.status(200).json({ message: "WATI record deleted successfully" });
    } catch (error) {
      console.error("Error deleting WATI record:", error);
      res.status(500).json({ message: "Failed to delete WATI record", error });
    }
  },
};

module.exports = watiController;

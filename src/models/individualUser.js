const mongoose = require("mongoose");

const individualUserSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
        isSubscribed: {
            type: Boolean,
            default: false,
        },
        cardNo: {
            type: Number,
            required: true,
            default: 0,
        },
        image: {
            type: String,
            default: "",
        },
        role: {
            type: String,
            default: "",
        },
        name: {
            type: String,
            default: "",
        },
        website: {
            type: String,
            default: "",
        },
        phnNumber: {
            type: String,
            default: "",
        },
        address: {
            type: String,
            default: "",
        },
        contacts: {
            type: Array,
            default: [],
        },
        meetings: [
            {
                type: String,
                ref: "Meeting", // Reference to Meeting model
                required: false,
            },
        ],
        socialMedia: {
            whatsappNo: {
                type: String,
                default: "",
            },
            facebookLink: {
                type: String,
                default: "",
            },
            instagramLink: {
                type: String,
                default: "",
            },
            twitterLink: {
                type: String,
                default: "",
            },
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", individualUserSchema);
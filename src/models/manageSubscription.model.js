const mongoose = require("mongoose");

const ManageSubscriptionSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    }, // Reference to User
    planId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'SubscriptionPlan', 
        required: true 
    }, // Reference to SubscriptionPlan
    subscriptionStatus: { 
        type: String, 
        enum: ['active', 'inactive'], 
        default: 'active' 
    }, // Status of the subscription
    startDate: { 
        type: Date, 
        default: Date.now 
    }, // Start date of the subscription
    endDate: { 
        type: Date 
    }, // End date of the subscription
    lastUpdated: { 
        type: Date, 
        default: Date.now 
    }, // Last updated timestamp
}, { timestamps: true }); // Automatically adds createdAt and updatedAt

// Middleware to update `lastUpdated` before saving
ManageSubscriptionSchema.pre('save', function (next) {
    this.lastUpdated = Date.now();
    next();
});

module.exports = mongoose.model("ManageSubscription", ManageSubscriptionSchema);

const mongoose = require('mongoose');

const EmployeeRoleSchema = new mongoose.Schema({
    roleName: { type: String, required: true },
    isActive: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('EmployeeRole', EmployeeRoleSchema);
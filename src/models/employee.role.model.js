const mongoose = require('mongoose');

const EmployeeRoleSchema = new mongoose.Schema({
    roleName: { type: String, required: true },
    isActive: { type: Boolean, default: false },
}, { timestamps: true,
    collection: 'admin.roles'
 });

 EmployeeRoleSchema.pre('save', function (next) {
    if (this.roleName) {
        this.roleName = this.roleName.toUpperCase();
    }
    next();
});

module.exports = mongoose.model('EmployeeRole', EmployeeRoleSchema);
const mongoose = require('mongoose');

const EmployeeCategorySchema = new mongoose.Schema({
    categoryName: { type: String, required: true },
    isActive: { type: Boolean, default: false },
    roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EmployeeRole' }]
}, { timestamps: true,
    collection: 'admin.category'
 });

module.exports = mongoose.model('EmployeeCategory', EmployeeCategorySchema);
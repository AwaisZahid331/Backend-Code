// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    address: { type: String, required: true },
    programOfStudy: { type: String, required: true },
    studentId: { type: String, required: true },
    gender: { type: String, required: true },
    resetToken: { type: String },
    expireToken: { type: Date },
});

// Hash password before saving user
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        console.log('Password hashed successfully');  // Debugging message
        next();
    } catch (err) {
        console.log('Error hashing password:', err);
        next(err);  // Pass the error to the next middleware
    }
});

module.exports = mongoose.model('User', UserSchema);

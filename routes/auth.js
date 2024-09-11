// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');  // Import the User model
const router = express.Router();
require('dotenv').config();

// Signup Route
router.post('/signup', async (req, res) => {
    console.log(req.body);  // Log the incoming request body
    const { name, email, password, address, programOfStudy, studentId, gender } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        user = new User({ name, email, password, address, programOfStudy, studentId, gender });
        await user.save();
        console.log('User saved successfully');  // Debugging message

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error('Error during signup:', err.message);  // Log the error
        res.status(500).send('Server error');
    }
});


// Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});




// Forgot Password Route
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'User does not exist' });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '20m' });
        user.resetToken = token;
        user.expireToken = Date.now() + 3600000; // 1 hour
        await user.save();

        // Send token to user's email (implementation depends on email service)
        // Example: sendEmail(user.email, token);
        res.json({ msg: 'Check your email for the reset link' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;

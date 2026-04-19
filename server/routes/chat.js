const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Room = require('../models/Room');
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');
const fs = require('fs');

// Ensure uploads directory exists safely
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up multer for local image storage
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// GET all users (except current)
router.get('/users', auth, async (req, res) => {
    try {
        const users = await User.find({ username: { $ne: req.user.username } }).select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Create 1-on-1 or locate existing room
router.post('/rooms/private', auth, async (req, res) => {
    try {
        const { targetUsername } = req.body;
        const myUsername = req.user.username;

        const myUser = await User.findOne({ username: myUsername });
        const targetUser = await User.findOne({ username: targetUsername });

        if (!targetUser) return res.status(404).json({ msg: 'User not found' });

        // Find existing 1-on-1 room between these two users
        let room = await Room.findOne({
            isGroup: false,
            participants: { $all: [myUser._id, targetUser._id], $size: 2 }
        }).populate('participants', 'username isOnline lastSeen');

        if (!room) {
            room = new Room({
                isGroup: false,
                participants: [myUser._id, targetUser._id]
            });
            await room.save();
            room = await room.populate('participants', 'username isOnline lastSeen');
        }

        res.json(room);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Create Group Room
router.post('/rooms/group', auth, async (req, res) => {
    try {
        const { name, participantUsernames } = req.body;
        const myUser = await User.findOne({ username: req.user.username });
        
        const users = await User.find({ username: { $in: participantUsernames } });
        const participantIds = users.map(u => u._id);
        participantIds.push(myUser._id);

        const room = new Room({
            name,
            isGroup: true,
            participants: participantIds
        });
        await room.save();

        res.json(room);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Clear Chat (in a specific room)
router.delete('/rooms/:roomId/clear', auth, async (req, res) => {
    try {
        await Message.deleteMany({ roomId: req.params.roomId });
        res.json({ msg: 'Chat cleared' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Upload route for images
router.post('/upload', auth, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ msg: 'No file uploaded' });
    }
    // Return relative path proxy for frontend
    res.json({ imageUrl: `/uploads/${req.file.filename}` });
});

// GET user's group rooms
router.get('/rooms/groups', auth, async (req, res) => {
    try {
        const myUser = await User.findOne({ username: req.user.username });
        const groups = await Room.find({ isGroup: true, participants: myUser._id });
        res.json(groups);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Rename Group Room
router.patch('/rooms/:roomId/rename', auth, async (req, res) => {
    try {
        const { name } = req.body;
        const myUser = await User.findOne({ username: req.user.username });
        const room = await Room.findOneAndUpdate(
            { _id: req.params.roomId, isGroup: true, participants: myUser._id },
            { name },
            { new: true }
        );
        if (!room) return res.status(404).json({ msg: 'Group not found or unauthorized' });
        res.json(room);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Upload route for Profile Picture
router.post('/upload/profile', auth, upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });
    try {
        const imageUrl = `/uploads/${req.file.filename}`;
        await User.findOneAndUpdate({ username: req.user.username }, { profilePic: imageUrl });
        res.json({ imageUrl });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;

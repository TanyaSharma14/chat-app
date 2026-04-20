// a template for every chat message ie how the chat messages will be stored in mongo db

const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({ // defining what a mesaage document will look like
    roomId: {
        type: mongoose.Schema.Types.ObjectId, // here we are defining the room id and every message will be belonging to a room
        ref: 'Room',
        required: true
    },
    sender: {
        type: String, // Storing username 
        required: true
    },
    content: {
        type: String,
        required: true
    },
    messageType: {
        type: String,
        enum: ['text', 'image'],
        default: 'text'
    },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read'],
        default: 'sent'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Message', MessageSchema);

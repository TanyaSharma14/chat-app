// a room is acting like a container where messages happen

const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({ // defining how to room document will look like
    name: {
        type: String,
        required: false // Only required for group chats
    },
    isGroup: {
        type: Boolean,
        default: false
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId, // this part stores who is a part of the room(an array of userids)
        ref: 'User'
    }],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }
});

module.exports = mongoose.model('Room', RoomSchema);

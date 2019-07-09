const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
    date: {
        type: Date,
        default: Date.now
    },
    userType: {
        type: String,
        enum: ['user', 'bot'],
        default: 'user'
    },
    message: {
      type: String
    }
});

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
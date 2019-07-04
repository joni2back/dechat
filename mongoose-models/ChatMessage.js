const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
    date: {
        type: Date,
        default: Date.now
    },
    user: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'ChatUser',
        required: true
    },
    message: {
      type: String
    }
});

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
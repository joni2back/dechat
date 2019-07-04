const mongoose = require('mongoose');

const ChatConversationSchema = new mongoose.Schema({
    date: {
        type: Date,
        default: Date.now
    },
    messages: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'ChatMessage'
    }]
});

module.exports = mongoose.model('ChatConversation', ChatConversationSchema);
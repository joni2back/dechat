const mongoose = require('mongoose');

const ChatUserSchema = new mongoose.Schema({
    userType: {
        type: String,
        enum : ['client', 'bot'],
        default: 'client',
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    phone: {
        type: String,
    },
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    }
});

module.exports = mongoose.model('ChatUser', ChatUserSchema);
const ChatConversation  = require('../mongoose-models/ChatConversation');
const ChatMessage = require('../mongoose-models/ChatMessage');

function getAnonEmail() {
    return 'anonymous@chat.com';
}

function loadOrCreateConversation(conversationId) {
    return new Promise((resolve, reject) => {
        if (conversationId) {
            return ChatConversation
                .findOne({_id: conversationId})
                .populate('messages')
                .then(conversation => {

                    resolve(conversation);
            }).catch(err => {
                reject(err);
            });
        }

        let conversation = new ChatConversation();
        conversation.save(err => {
            if (err) {
                return reject(err);
            }
            resolve(conversation);
        });
    });
}

function parseNewMessage(conversationId, data) {
    return new Promise((resolve, reject) => {

        if (! (data.message || '').trim()) {
            return reject('empty_message');
        }

        return loadOrCreateConversation(conversationId).then(conversation => {

            const chatMessage = new ChatMessage({
                message: data.message,
                userType: data.userType
            });
            chatMessage.save();

            conversation.messages.push(chatMessage)
            conversation.save();

            resolve(chatMessage);

        }).catch(err => {
            reject(err);
        });
    });
}

function createAReplyFromBot(conversationId, data) {
    data.userType = 'bot';
    return parseNewMessage(conversationId, data);
}


module.exports = {
    parseNewMessage,
    loadOrCreateConversation,
    createAReplyFromBot
};
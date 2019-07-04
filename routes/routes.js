const express = require('express');
const router = express.Router();
const ChatConversation  = require('../mongoose-models/ChatConversation');
const ChatMessage = require('../mongoose-models/ChatMessage');
const ChatUser = require('../mongoose-models/ChatUser');
const path = require('path');

function loadOrCreateConversation(conversationId) {
    return new Promise((resolve, reject) => {
        if (conversationId) {
            return ChatConversation.findOne({_id: conversationId}).then(conversation => {
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

function loadOrCreateUser(email, extraData) {
    return new Promise((resolve, reject) => {
        return ChatUser.findOne({email: email}).then(chatUser => {
            if (chatUser) {
                return resolve(chatUser);
            }

            chatUser = new ChatUser({
                email: email || 'anonymous@chat.com',
                userType: 'client'
            });
            chatUser.save(err => {
                if (err) {
                    return reject(err);
                }
                resolve(chatUser);
            });

        }).catch(err => {
            reject(err);
        });
    });
}

router.get('/', (req, res) => {
    res.sendFile(path.resolve('index.html'));
});


router.get('/reply', (req, res) => {
    const conversationId = req.body.conversationId;
    const email = req.body.email || 'anonymous@chat.com';
    const phone = req.body.phone;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;

    loadOrCreateConversation(conversationId).then(conversation => {
        conversation.messages.push()

        return loadOrCreateUser(email).then(chatUser => {

            const chatMessage = new ChatMessage({
                message: 'hola',
                user: chatUser
            })

            res.send(chatMessage);
        });

    }).catch(err => {
        res.status(500).send(err);
    });



});

router.get('/history/:conversationId', (req, res) => {
    const conversationId = req.params.conversationId;
    const limit = 100;

    ChatConversation.findOne({_id: conversationId}).then(c => {
        res.send(c);
    }).catch(err => {
        res.status(500).send(err);
    });
});

router.post('/start', (req, res) => {
    const conversationId = req.body.conversationId;

    loadOrCreateConversation(conversationId).then(conversation => {
        res.send(conversation);
    }).catch(err => {
        res.status(500).send(err);
    });

});

module.exports = router;
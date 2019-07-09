const express = require('express');
const router = express.Router();
const ChatConversation  = require('../mongoose-models/ChatConversation');
const ChatService = require('../services/ChatService');
const path = require('path');

router.get('/reply', (req, res) => {
});

router.get('/history/:conversationId', (req, res) => {
    const conversationId = req.params.conversationId;
    const limit = 100;

    ChatConversation.findOne({_id: conversationId}).populate('messages').then(c => {
        
        res.send(c);
    }).catch(err => {
        res.status(500).send(err);
    });
});

router.post('/start', (req, res) => {
    const conversationId = req.body.conversationId;

    ChatService.loadOrCreateConversation(conversationId).then(conversation => {
        res.send(conversation);
    }).catch(err => {
        res.status(500).send(err);
    });

});

module.exports = router;
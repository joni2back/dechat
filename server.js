const socket = require('socket.io');
const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
const io = socket.listen(server);

const fs = require('fs');
const cors = require('./middlewares/cors');
const mongoose = require('./middlewares/mongoose');

const routes = require('./routes/routes');
const ChatMessage = require('./mongoose-models/ChatMessage');
const ChatService = require('./services/ChatService');
const ChatAIRepliesServer = require('./services/ChatAIRepliesServer.js');

server.listen(process.env.PORT, process.env.HOSTNAME, () => {
    console.log('Express listening on: %s:%s '
        .replace('%s', process.env.HOSTNAME)
        .replace('%s', process.env.PORT)
    );
});

app.use(express.urlencoded());
app.use(mongoose);
app.use(cors);
app.use(routes);
app.use(express.static('public'));

io.sockets.on('connection', socket => {

    socket.on('set_userdata', data => {
        socket.email = data.email;
        socket.firstName = data.firstName;
        socket.lastName = data.lastName;
        socket.conversationId = data.conversationId;
    });
   
    socket.on('join_conversation', conversationId => {
        socket.join(conversationId);
        socket.broadcast.in(conversationId).emit('An user has joined');
    });

    socket.on('new_message', data => {
        const convId = data.conversationId;

        ChatService.parseNewMessage(convId, data).then(message => {
            io.sockets.in(convId).emit('new_message', message);
            setTimeout(() => {
                io.sockets.in(convId).emit('typing', message);
                ChatService.loadOrCreateConversation(convId).then(conversation => {


                    ChatAIRepliesServer.getAReplyForConversation(conversation).then(reply => {

                        ChatService.createAReplyFromBot(convId, {
                            message: reply
                        }).then(message => {
                            io.sockets.in(convId).emit('new_message', message);
                        });
                    });
                });
            }, 1000);
        });
        
    });
});
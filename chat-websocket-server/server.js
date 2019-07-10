const socket = require('socket.io');
const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
const io = socket.listen(server);
const cors = require('./middlewares/cors');
const mongoose = require('./middlewares/mongoose');
const routes = require('./routes/routes');

const ChatService = require('./services/ChatService');
const ChatAIRepliesServer = require('./services/ChatAIRepliesServer.js');

app.use(express.urlencoded())
app.use(express.static('public'));
app.use(mongoose);
app.use(cors);
app.use(routes);

server.listen(process.env.PORT, process.env.HOSTNAME, () => {
    console.log('Express listening on: %s:%s '
        .replace('%s', process.env.HOSTNAME)
        .replace('%s', process.env.PORT)
    );
});

io.sockets.on('connection', socket => {

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
                    ChatAIRepliesServer.getAReplyForConversation(conversation).then(response => {
                        (Array.isArray(response) ? response : [response]).forEach(reply => {
                            setTimeout(() => {
                                ChatService.createAReplyFromBot(convId, {
                                    message: reply
                                }).then(message => {
                                    io.sockets.in(convId).emit('new_message', message);
                                });
                            }, 2000);
                        });

                    });
                });
            }, 1000);
        });
        
    });
});
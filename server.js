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

server.listen(process.env.PORT, process.env.HOSTNAME, () => {
    console.log('Express listening on: %s:%s '
        .replace('%s', process.env.HOSTNAME)
        .replace('%s', process.env.PORT)
    );
});

app.use(express.urlencoded())
app.use(mongoose);
app.use(cors);
app.use(routes);
app.use(express.static('public'));

io.sockets.on('connection', socket => {

    socket.username = "Anonymous " + (socket.id || '').substr(0, 4);

    socket.on('set_userdata', data => {
        socket.username = data.username;
        socket.userid = data.userid;
        socket.orgname = data.orgname;
        socket.orgid = data.orgid;
        socket.valid = sessionExists(data.session);
    });
   
    socket.on("join_room", room => {
        socket.join(room);
        socket.broadcast.in(room).emit(socket.username + " has joined");
    });

    socket.on('new_message', data => {

        if (! socket.valid) {
            return console.log('Invalid user', data);
        }

        if (! (data.message || '').trim()) {
            return;
        }       

        const message = {
            message: data.message, 
            username: socket.username,
            orgname: socket.orgname,
            userid: socket.userid,
            orgid: socket.orgid,
            date: new Date(),
            room: data.room
        };

        io.sockets.in(data.room).emit('new_message', message);
        new ChatMessage(message).save();
    })

    socket.on('typing', (data) => {
        io.sockets.in(data.room).emit('typing', {
            username : socket.username,
            userid: socket.userid
        });
    })
})

var ChatConfig = {
    host: location.hostname,
    port: 6860,
};

function sanitize(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function parseLinks(str) {
    var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    var text1 = str.replace(exp, '<a class="label label-primary" href="$1">$1</a>');
    var exp2 =/(^|[^\/])(www\.[\S]+(\b|$))/gim;
    return text1.replace(exp2, '$1<a target="_blank" class="label label-primary" href="http://$2">$2</a>');
}

function handleUserInput(str) {
    return parseLinks(sanitize(str));
}

function formatDate(date) {
    date = new Date(date);

    var day = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getFullYear();

    var hour = date.getHours();
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();
    return hour + ':' + minutes + ' ' + day + '/' + monthIndex + '/' + year;
}

function getHistory(conversationId) {
    return new Promise((resolve, reject) => {
        $.ajax('/history/' + conversationId).done(response => {
            if (response.messages) {
                return resolve(response.messages);
            }
            reject(response);
        }).fail(err => {
            reject(err);
        });
    });
}

function startChat() {
    return new Promise((resolve, reject) => {
        var conversationId = sessionStorage.getItem('conversationId');
        $.ajax({
            method: 'POST',
            url: '/start',
            data: {
                conversationId: conversationId
            }
        }).then(response => {
            if (response._id) {
                sessionStorage.setItem('conversationId', response._id);
                return resolve(response._id);
            }
            reject(response) ;
        }).catch(err => {
            reject(err);
        });
    });
}

function beep() {
    return;
}


$(document).ready(function() {
    var historyLoaded = false;

    var $messageInput = $('input[name=chat-msg-input]');
    var $messageForm = $('form:first');
    var $chatRoom = $('#chat');
    var $feedback = $('#feedback');

    function goDown() {
        $chatRoom.scrollTop(999999);
    }

    function loadHistory(conversationId) {
        !historyLoaded && getHistory(conversationId).then(messages => {
            historyLoaded = true;
            messages.forEach(function(message) {
                writeMsg(message, message.user.userType === 'client');
            });
            goDown();
        });
    }

    function writeMsg(data, itsMe) {
        var html = $('#template-chat-message').html();
        html = html.replace(/%firstName%/g, handleUserInput(data.user.firstName));
        html = html.replace(/%lastName%/g, handleUserInput(data.user.lastName));
        html = html.replace(/%email%/g, handleUserInput(data.user.email));
        html = html.replace(/%date%/g, handleUserInput(formatDate(data.date)));
    
        html = itsMe ? html.replace('direct-chat-msg', 'direct-chat-msg right') : html;
        $chatRoom.append(html);
    }


    startChat().then(conversationId => {
        var socket = io.connect(ChatConfig.host + ':' + ChatConfig.port);

        socket.once('connect', function(socket) {
            $chatRoom.parents('.box').find('.overlay').addClass('hide');
            loadHistory(conversationId);
        }).once('connect_error', function() {
            $chatRoom.parents('.box').find('.overlay').removeClass('hide');
            loadHistory(conversationId);
        }).once('connect_timeout', function() {
            $chatRoom.parents('.box').find('.overlay').removeClass('hide');
            loadHistory(conversationId);
        });
    
        $messageInput.bind('input', function() {
            socket.emit('typing', {
                conversationId: conversationId
            });
        });

        function join() {
            socket.emit('join_conversation', {
                conversationId: conversationId,
            });
        }
    
        function sendMsg(event) {
            event.preventDefault();
    
            socket.emit('new_message', {
                message: $messageInput.val(),
                conversationId: conversationId
            });
    
            $messageInput.val('');
            setTimeout(function() {
                goDown();
            }, 50);
        }
    
        join();
        
        $messageForm.on('submit', sendMsg);
        $messageInput.on('keypress', function(event) {
            event.keyCode == 13 && sendMsg(event);
        });
    
        socket.on('new_message', function(data) {
            var itsMe = data.userid == config.userId;
            $feedback.html('');
            writeMsg(data, itsMe);
            !itsMe && setTimeout(function() {
                beep();
            });
            goDown();
        })
    
        var typingTimeout = null;
        socket.on('typing', function(data) {
            if (data.username == config.userName) {
                return;
            }
            clearTimeout(typingTimeout);
            $feedback.html(data.username + ' está escribiendo...');
            typingTimeout = setTimeout(function() {
                $feedback.html('');
            }, 2000)
        })

    }).catch(err => {
        console.error(err);
    });


});
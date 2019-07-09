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

function goDown($element) {
    $('.chat').scrollTop(999999);
}

$(document).ready(function() {
    var historyLoaded = false;

    var $messageInput = $('input[name=chat-msg-input]');
    var $messageForm = $('form:first');
    var $chatRoom = $('.chat-body');
    var $feedback = $('.chat-feedback');


    function loadHistory(conversationId) {
        !historyLoaded && getHistory(conversationId).then(messages => {
            historyLoaded = true;
            messages.forEach(function(message) {
                writeMsg(message, message.userType === 'user');
            });
            goDown($chatRoom);
        });
    }

    function writeMsg(data, itsMe) {
        var html = $('#template-chat-message').html();
        html = html.replace(/%username%/g, itsMe ? 'Me' : 'Support');
        html = html.replace(/%avatarurl%/g, itsMe ? 'avatar.png' : 'support.jpg');
        html = html.replace(/%message%/g, handleUserInput(data.message));
        html = html.replace(/%messagedate%/g, handleUserInput(formatDate(data.date)));
        html = html.replace(/%class%/g, itsMe ? 'right' : 'left');
        $chatRoom.append(html);
    }

    startChat().then(conversationId => {
        var socket = io.connect(ChatConfig.host + ':' + ChatConfig.port);

        socket.once('connect', function(socket) {
            join(conversationId);
            console.log('connected ')
            loadHistory(conversationId);
        }).once('connect_error', function() {
            loadHistory(conversationId);
        }).once('connect_timeout', function() {
            loadHistory(conversationId);
        });
    
        $messageInput.bind('input', function() {
            socket.emit('typing', {
                conversationId: conversationId
            });
        });

        function join(conversationId) {
            socket.emit('join_conversation', conversationId);
        }
    
        function sendMsg(event) {
            event.preventDefault();
    
            socket.emit('new_message', {
                message: $messageInput.val(),
                conversationId: conversationId
            });
    
            $messageInput.val('');
            setTimeout(function() {
                goDown($chatRoom);
            }, 50);
        }
    
        
        $messageForm.on('submit', sendMsg);
        $messageInput.on('keypress', function(event) {
            event.keyCode == 13 && sendMsg(event);
        });
    
        socket.on('new_message', function(data) {
            var itsMe = data.userType === 'user';
            $feedback.html('');
            writeMsg(data, itsMe);
            !itsMe && setTimeout(function() {
                beep();
            });
            goDown($chatRoom);
        })
    
        var typingTimeout = null;
        socket.on('typing', function(data) {
            $feedback.html('Support is typing...');
            clearTimeout(typingTimeout);
            
            typingTimeout = setTimeout(function() {
                $feedback.html('');
            }, 2000)
        })

    }).catch(err => {
        console.error(err);
    });


});
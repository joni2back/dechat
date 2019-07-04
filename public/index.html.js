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
    var conversationId = sessionStorage.getItem('conversationId');
    var url = location.href.replace('/history/') + conversationId;
    return $.ajax(url);
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
            resolve(response._id && sessionStorage.setItem('conversationId', response._id));
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

    var $messageInput = $('input[name=chat-message-input]');
    var $messageForm = $('form:first');
    var $chatRoom = $('#chat');
    var $feedback = $('#feedback');

    function goDown() {
        $chatRoom.scrollTop(999999);
    }

    function loadHistory() {
        !historyLoaded && getHistory().done(function(response) {
            historyLoaded = true;
            response.forEach(function(data) {
                writeMsg(data, data.userid == config.userId);
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
            loadHistory();
        }).once('connect_error', function() {
            $chatRoom.parents('.box').find('.overlay').removeClass('hide');
            loadHistory();
        }).once('connect_timeout', function() {
            $chatRoom.parents('.box').find('.overlay').removeClass('hide');
            loadHistory();
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
                message : $messageInput.val(),
                room: config.activeRoom
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

    });


});
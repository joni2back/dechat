;(($) => {

    const ChatConfig = {
        host: location.hostname,
        port: 80,
    };
    
    function sanitize(str) {
        const div = window.document.createElement('div');
        div.appendChild(window.document.createTextNode(str));
        return div.innerHTML;
    }
    
    function parseLinks(str) {
        const exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
        const text1 = str.replace(exp, '<a class="label label-primary" href="$1">$1</a>');
        const exp2 =/(^|[^\/])(www\.[\S]+(\b|$))/gim;
        return text1.replace(exp2, '$1<a target="_blank" class="label label-primary" href="http://$2">$2</a>');
    }
    
    function handleUserInput(str) {
        return parseLinks(sanitize(str));
    }
    
    function formatDate(date) {
        date = new Date(date);
        const day = date.getDate();
        const monthIndex = date.getMonth();
        const year = date.getFullYear();
        const hour = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();
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
    
    function startConversation() {
        return new Promise((resolve, reject) => {
            const conversationId = window.sessionStorage.getItem('conversationId');
            $.ajax({
                method: 'POST',
                url: '/start',
                data: {
                    conversationId: conversationId
                }
            }).then(response => {
                if (response._id) {
                    window.sessionStorage.setItem('conversationId', response._id);
                    return resolve(response._id);
                }
                reject(response) ;
            }).catch(err => {
                reject(err);
            });
        });
    }
    
    function beep() {
        return /* play html5 sound */;
    }
    
    function goDown($element)
    {
        $('.chat').scrollTop(999999);
    }
    
    function createMessageFromTemplate(data, itsMe)
    {
        let html = $('#template-chat-message').html();
        html = html.replace(/%username%/g, itsMe ? 'Me' : 'Support');
        html = html.replace(/%avatarurl%/g, itsMe ? 'avatar.png' : 'support.jpg');
        html = html.replace(/%message%/g, handleUserInput(data.message));
        html = html.replace(/%messagedate%/g, handleUserInput(formatDate(data.date)));
        html = html.replace(/%class%/g, itsMe ? 'right' : 'left');
        return html;
    }

    function writeMsg(data, itsMe) {
        const html = createMessageFromTemplate(data, itsMe);
        return $('.chat-body').append(html);
    }

    function initChat() {
        let historyLoaded = false;
        const $messageInput = $('input[name=chat-msg-input]');
        const $messageForm = $('form:first');
        const $chatRoom = $('.chat-body');
        const $feedback = $('.chat-feedback');
    
        const loadHistory = conversationId => {
            !historyLoaded && getHistory(conversationId).then(messages => {
                historyLoaded = true;
                messages.forEach(message => {
                    writeMsg(message, message.userType === 'user');
                });
                goDown($chatRoom);
            });
        };
    
        startConversation().then(conversationId => {
            let socket = io.connect(ChatConfig.host + ':' + ChatConfig.port);


            function sendMsg(event) {
                event.preventDefault();
        
                socket.emit('new_message', {
                    message: $messageInput.val(),
                    conversationId: conversationId
                });
        
                $messageInput.val('');
                setTimeout(() => {
                    goDown($chatRoom);
                }, 50);
            };

            socket.once('connect', () => {
                socket.emit('join_conversation', conversationId);
                loadHistory(conversationId);
                window.console.warn('__chat_connection_success');
            }).once('connect_error', () => {
                loadHistory(conversationId);
                window.console.warn('__chat_connection_error');
            }).once('connect_timeout', () => {
                loadHistory(conversationId);
                window.console.warn('__chat_connection_timeout');
            });
        
            $messageInput.on('keypress', event => {
                event.keyCode == 13 && sendMsg(event);
            });
        
            socket.on('new_message', data => {
                const itsMe = data.userType === 'user';
                $feedback.html('');
                writeMsg(data, itsMe);
                !itsMe && setTimeout(() => {
                    beep();
                });
                goDown($chatRoom);
            })
        
            let typingTimeout = null;
            socket.on('typing', data => {
                $feedback.html('Support is typing...');
                window.clearTimeout(typingTimeout);
                typingTimeout = setTimeout(() => {
                    $feedback.html('');
                }, 2200)
            })
    
        }).catch(err => {
            window.console.error(err);
        });
    
    }
    
    $(window.document).ready(initChat);

})(window.jQuery);
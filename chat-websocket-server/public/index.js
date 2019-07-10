const ChatConfig = {
    host: location.hostname,
    port: 80,
};

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
        fetch(`/history/${conversationId}`).then(response => {
            const contentType = response.headers.get('content-type');
            const isJson = /(application|text)\/json/.test(contentType);
    
            if (! response.ok) {
                throw isJson ? response.json() : Error('unknown_response');
            }

            response.json()
                .then(resolve)
                .catch(reject);

        }).catch(reject);
    });
};


function startConversation() {
    const conversationId = window.sessionStorage.getItem('conversationId');
    return new Promise((resolve, reject) => {
        fetch(`/start/${conversationId}`).then(response => {
            const contentType = response.headers.get('content-type');
            const isJson = /(application|text)\/json/.test(contentType);
    
            if (! response.ok) {
                throw isJson ? response.json() : Error('unknown_response');
            }

            response.json().then(response => {
                if (response._id) {
                    window.sessionStorage.setItem('conversationId', response._id);
                    return resolve(response._id);
                }
                reject(response) ;
            }).catch(reject);

        }).catch(reject);
    });
};


Vue.component('template-chat-message', {
	template: '#template-chat-message',
    props: {
        message: String,
        date: String,
        type: String,
	},
	computed: {
        answerclass: function() {
            return this.type === 'bot' ? 'left' : 'right';
        },
        avatarurl: function() {
            return this.type === 'bot' ? 'support.jpg' : 'avatar.png';
        },
        messagedate: function() {
            return formatDate(this.date)
        },
        username: function() {
            return this.type === 'bot' ? 'Support' : 'Me';
        }
    }
});

new Vue({
    el: '#chatapp',
    data: {
        input: '',
        chatFeedback: '',
        messages: [],
        socket: null,
        conversationId: null,
        loaded: false,
        historyLoaded: false
    },
    mounted: function() {
        startConversation().then(conversationId => {
            this.conversationId = conversationId;
            this.socket = io.connect(ChatConfig.host + ':' + ChatConfig.port);

            const loadHistory = () => {
                !this.historyLoaded && getHistory(this.conversationId).then(response => {
                    this.historyLoaded = true;
                    this.messages = response.messages;
                    this.scrollDown();
                });
            };

            this.socket.once('connect', () => {
                this.socket.emit('join_conversation', this.conversationId);
                this.loaded = true;
                loadHistory(conversationId);
                window.console.warn('__chat_connection_success');
            }).once('connect_error', () => {
                this.loaded = false;
                loadHistory(conversationId);
                window.console.warn('__chat_connection_error');
            }).once('connect_timeout', () => {
                this.loaded = false;
                loadHistory(conversationId);
                window.console.warn('__chat_connection_timeout');
            });
        
            this.socket.on('new_message', data => {
                const itsMe = data.userType === 'user';
                this.chatFeedback = '';
                this.messages.push(data);
                this.scrollDown();
            })
        
            let typingTimeout = null;
            this.socket.on('typing', data => {
                this.chatFeedback = 'Support is typing...';
                window.clearTimeout(typingTimeout);
                typingTimeout = setTimeout(() => {
                    this.chatFeedback = '';
                }, 5000);
            });
    
        }).catch(err => {
            window.console.error(err);
        });
    },
    computed: {},
    methods: {
        scrollDown: function() {
            setTimeout(() => {
                const el = window.document.querySelector('.chat');
                return el && el.scrollTo(0, 9999);
            }, 50);
        },
        sendMsg: function(event) {
            if (! this.socket) {
                return;
            }
            this.socket.emit('new_message', {
                message: this.input,
                conversationId: this.conversationId
            });

            this.input = '';
            this.scrollDown();
        },
        update: function (e) {
            this.input = e.target.value;
        }
    }
});
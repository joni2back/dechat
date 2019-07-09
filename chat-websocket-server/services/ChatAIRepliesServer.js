const urls = {
    makeAReplyFromMessages: 'https://localhost:5000/api/v1/makeAReplyFromMessages'
}

const hasForgottenPwd = /(lost|can\'?t|forg.t|missin).+(pass|password|account|credentials)/i;
const wannaBuyBike = /(wanna|want|like|can).+(buy|purchase|get).+(bike)/i;
const isConfirming = /yes|sure|yeah|that\'s? right|right/i;
const isNegating = /nop?e?|nu|nah|neh|idn/i;
const isGreeting = /^morning|(good (morning|day|night|evening))|hey|hi|hello|sup|(what?s.up)|(how are (you|u)?\?)/i;
const isClosing = /bye|good bye|bbye|chau|thank you|thanks/i;

const greetings = [
    [
        'Hey! how are you?',
        'How I can help you?'
    ], [
        'Hello there!',
        'Can I help you?'
    ], [
        'Good morning',
        'Thanks for contact support',
        'Do you have any question?'
    ],
];
const endings = [
    [
        'Bye bye!',
    ], [
        'Thank you for contacting us.',
        'Have a great week!'
    ], [
        'Bye. Thank you.',
    ], [
        'Bye. Have a good one.',
    ],
];

function guessPurpose(messages) {
    let purposes = {
        forgotPassword: 0,
        buyABike: 0,
        shippingCosts: 0,
        productSize: 0,
        productAvailability: 0,
    };

    messages.forEach(message => {
        hasForgottenPwd.test(message.message) && purposes.forgotPassword++;
        wannaBuyBike.test(message.message) && purposes.buyABike++;
    });

    return purposes;
}

function randArr(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getAReplyForConversation(conversation, expecting) {
    return new Promise((resolve, reject) => {
        const lastMessageObject = [...conversation.messages].slice(-1)[0];
        const lastMessage = lastMessageObject.message;
        const count = conversation.messages.length;

        const purposes = guessPurpose(conversation.messages);

        if (count <= 1) {
            replies = randArr(greetings);
            return resolve(replies);
        }
        
        if (isGreeting.test(lastMessage) && count < 5) {
            return resolve('Hi!');
        }
        
        if (hasForgottenPwd.test(lastMessage)) {
            return resolve('Did you forgot your password right?');
        }

        if (wannaBuyBike.test(lastMessage)) {
            return resolve('You mean that you wanna buy a bike?');
        }
        

        if (count > 2 && isConfirming.test(lastMessage)) {
            const botMessages = conversation.messages.find(message => {
                return message.userType === 'bot';
            });
            
            const question = botMessages.length ? botMessages.slice(-2)[0] : null;

            if (purposes.forgotPassword) {
                return resolve('If you forgot your password you can visit http://www.site.com/recover');
            }
            if (purposes.buyABike) {
                return resolve([
                    'That\'s a very good decision!',
                    'You can find in our store our latest and trending bikes http://www.bikes.com'
                ]);
            }
        }

        if (isClosing.test(lastMessage) && count > 5) {
            return resolve(randArr(endings));
        }

        resolve('Give me more details..');
        
    });
}

function getAReplyForConversation2(conversation) {
    return new Promise((resolve, reject) => {
        return fetch(urls.makeAReplyFromMessages, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: conversation.messages
            })
        });
    });
};

module.exports = {
    getAReplyForConversation,
};
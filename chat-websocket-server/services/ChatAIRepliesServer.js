const fetch = require('node-fetch');

const urls = {
    makeAReplyFromMessages: 'http://chat_replies_api_nginx:3333/api/v1/replies/get-reply'
}

function getAReplyForConversation(conversation) {
    return new Promise((resolve, reject) => {
        fetch(urls.makeAReplyFromMessages, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                conversation
            })
        }).then(response => {
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

module.exports = {
    getAReplyForConversation,
};
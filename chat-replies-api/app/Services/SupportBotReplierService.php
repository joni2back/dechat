<?php

namespace App\Services;

class SupportBotReplierService extends ReplierService {

    const hasForgottenPwd = "/(lost|can\'?t|forg.t|missin).+(pass|password|account|credentials)/i";
    const wannaBuyBike = "/(wanna|want|like|can).+(buy|purchase|get).+(bike)/i";

    static $purposes = [
        forgotPassword => 0,
        buyABike => 0,
        shippingCosts => 0,
        productSize => 0,
        productAvailability => 0,
    ];

    protected function guessPurpose(array $messages) 
    {
        return collect($messages).map(function($message) {
            hasForgottenPwd.test(message.message) && purposes.forgotPassword++;
            wannaBuyBike.test(message.message) && purposes.buyABike++;
        });
    }

    public function getAReplyForConversation($conversation, $expecting = null) 
    {
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

        return ('Give me more details..');
    }

}
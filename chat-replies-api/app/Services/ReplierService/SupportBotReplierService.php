<?php

namespace App\Services\ReplierService;

use App\Exceptions\InvalidConversationException;

class SupportBotReplierService extends ReplierServiceBase {

    const R_HAS_FORGOTTEN_PWD = "/(lost|can\'?t|forg.t|missin).+(pass|password|account|credentials)/i";
    const R_WANNA_BUY_BIKE = "/(would|wanna|want|like|can|should).+(buy|purchase|get|renew).+(bike)/i";

    protected $purposes = [
        'forgotPassword' => 0,
        'buyBike' => 0,
        'shippingCosts' => 0,
        'productSize' => 0,
        'productAvailability' => 0,
    ];

    /**
     * @param ConversationDTO|Array $conversation
     * @return void
     */
    public function __construct($conversation)
    {
        if (! data_get($conversation, 'messages')) {
            throw new InvalidConversationException;
        }
        //Here we can use a DTO
        $this->conversation = $conversation;
    }

    /**
     * @return Array
     */
    protected function guessPurpose() 
    {
        return collect($this->getMessages())->map(function($message) {
            $messageBody = data_get($message, 'message');

            if (preg_match(self::R_HAS_FORGOTTEN_PWD, $messageBody)) {
                $this->purposes['forgotPassword']++;
            }
            if (preg_match(self::R_WANNA_BUY_BIKE, $messageBody)) {
                $this->purposes['buyBike']++;
            }
        });
    }

    /**
     * @param String $expecting
     * @return Array
     */
    public function getReply($expecting = null) 
    {
        if ($reply = parent::getReply($expecting)) {
            return $reply;
        }

        $lastMessage = $this->getLastMessage();
        $count = $this->getMessages()->count();
        $this->guessPurpose();

        \Log::info('data::', [
            'lastMessage' => $lastMessage, 
            'purposes' => $this->purposes,
            'count' => $count
        ]);

        if ($count <= 7 && preg_match(self::R_HAS_FORGOTTEN_PWD, $lastMessage)) {
            return ['Did you forgot your password right?'];
        }
        
        if ($count <= 7 && preg_match(self::R_WANNA_BUY_BIKE, $lastMessage)) {
            return ['You mean you wanna buy a bike?'];
        }

        if ($count > 3 && preg_match(self::R_IS_CONFIRMING, $lastMessage)) {

            $botMessages = $this->getMessages()->filter(function($message) {
                return data_get($message, 'userType') === 'bot';
            });
            
            $lastBotquestion = collect($botMessages)->count() ? $botMessages->slice(-2, 1) : null;

            if ($this->purposes['forgotPassword']) {
                return [
                    'If you forgot your password you can visit http://www.site.com/recover'
                ];
            }

            if ($this->purposes['buyBike']) {
                return [
                    'That\'s a very good decision!',
                    'You can find in our store our latest and trending bikes http://www.bikes.com'
                ];
            }
        }

        /**
         * TODO: Some questions may require calling a third party service, 
         * for example checking stock, shipping costs, etc
         */
        if (preg_match('/TODO_is_asking_for_stock/', $lastMessage)) {
            $productNameOrCode = $this->guessProduct($this->getMessages());
            $stockUnits = ThirdPartyService::checkStock($productNameOrCode);

            return $stockUnits ? ['Yes, we have the product in stock'] : ['Oh, sorry, this is out of stock'];
        }

        if (preg_match(self::R_IS_CLOSING, $lastMessage) && $count > 5) {
            return $this->arrayRandom($this->endings);
        }

        return ['Please, give me more details..'];
    }

}
<?php

namespace App\Services\ReplierService;

use Illuminate\Support\Arr;

abstract class ReplierServiceBase {

    const R_IS_CONFIRMING = "/^(yes|yep|sure|yeah|(that\'?s right)|right)/i";
    const R_IS_NEGATING = "/^(nop?e?|nu|nah|neh|idn)/i";
    const R_IS_GREETING = "/^(morning|(good (morning|day|night|evening))|hola|hey|hi|hello|sup|(what?s.up)|(how are (you|u)?\?))/i";
    const R_IS_CLOSING = "/^(bye|good bye|bbye|chau.+(thank you|thanks)?)/i";
    const R_IS_APPRECIATING = "/^(ok.thanks|thanks|(thank.you)|great|tk)$/i";

    protected $purposes = [];
    protected $conversation;

    protected $startings = [
        [
            'Hey',
            'How I can help you?'
        ], [
            'Hello there!',
            'Can I help you?'
        ], [
            'Good morning',
            'Thanks for contact support, do you have any question?'
        ],
    ];

    protected $greetings = [
        'Hi', 'Hey!', 'Hello'
    ];

    protected $appreciatingResp = [
        'You are welcome!',
        'No problem!'
    ];

    protected $endings = [
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

    /**
     * @return void
     */
    abstract protected function guessPurpose();

    /**
     * @param Array $array
     * @return Mixed
     */
    protected function arrayRandom(array $array)
    {
        return Arr::random($array);
    }

    /**
     * @return String
     */
    protected function getLastMessage() 
    {
        $messages = $this->getMessages() ?: [];
        return data_get($messages->last(), 'message');
    }

    /**
     * @return Array
     */
    protected function getMessages() 
    {
        return collect(data_get($this->conversation, 'messages'));
    }

    /**
     * @param String $expecting
     * @return Array
     */
    public function getReply($expecting = null) 
    {
        $count = $this->getMessages()->count();
        $lastMessage = $this->getLastMessage();

        if ($count <= 1) {
            return $this->arrayRandom($this->startings);
        }

        if (preg_match(self::R_IS_GREETING, $lastMessage) && $count < 5) {
            return $this->arrayRandom($this->greetings);
        }

        if (preg_match(self::R_IS_APPRECIATING, $lastMessage) && $count >= 5) {
            return $this->arrayRandom($this->appreciatingResp);
        }
    }
}

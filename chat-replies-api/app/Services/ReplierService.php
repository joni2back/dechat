<?php

namespace App\Services;

abstract class ReplierService {

    const isConfirming = "/yes|sure|yeah|that\'s? right|right/i";
    const isNegating = "/nop?e?|nu|nah|neh|idn/i";
    const isGreeting = "/^morning|(good (morning|day|night|evening))|hey|hi|hello|sup|(what?s.up)|(how are (you|u)?\?)/i";
    const isClosing = "/bye|good bye|bbye|chau.+(thank you|thanks)?/i";

    static $startings = [
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

    static $greetings = [
        'Hi', 'Hey!', 'Hello'
    ];

    static $endings = [
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

    abstract protected function guessPurpose(array $messages);

    protected function arrayRandom(array $array)
    {
        return $array[rand(0, count($array))];
    }

    protected function getLastMessage(ConversationDto $conversation) 
    {
        return array_pop($conversation->messages); 
    }

    public function getAReplyForConversation(ConversationDto $conversation, $expecting = null) 
    {
        $count = count($conversation->messages);
        if ($count <= 1) {
            return static::arrayRandom(static::$startings);
        }

        if (preg_match(static::$isGreeting, $lastMessage) && $count < 5) {
            return static::arrayRandom(static::$greetings);
        }
    }
}

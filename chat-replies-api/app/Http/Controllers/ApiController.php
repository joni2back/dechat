<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\ReplierService\SupportBotReplierService;
use DB, Log;

class ApiController extends Controller
{
    /**
     * Get a reply based on a conversation
     * TODO: Improve logic, use AI or Deep learning service
     * @param Request $request
     * @return Response
     */
    public function getReply(Request $request) 
    {
        $conversation = $request->json()->get('conversation');

        $service = new SupportBotReplierService($conversation);
        $result = $service->getReply();

        Log::info('respondiendoooooo:::', [$result]);
        return response()->json($result);
    }

    /**
     * TODO: Saving a transcript, example code
     * @param Request $request
     * @return Response
     */
    public function saveConversation(Request $request) 
    {
        $conversationData = (object) $request->json()->get('conversation');

        $result = DB::transaction(function() {
            $conversationModel = new Models\Conversations;
            $conversationModel->mapWith($conversationData);
            $saved = $conversationModel->save();
            dispatch(AsyncJobs::SendTranscriptEmailToUser($conversationModel));
            return $saved;
        });

        return response()->json($result);
    }
}

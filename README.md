## dechat

### Services and applications
This chat has 2 final applications. 
- The first one is **chat-websocket-server** an express app that provides final frontend interface to the user and also handles websocket communication between **user <> bot**
- The second one is **chat-replies-api**, an isolated service to perform bot replies  based on a conversation history. This can use different approaches to return efficient replies, for example Artificial Intelligence, Machine Learning, Cleverbot, etc.


### Docker containers and microservices details

-  **chat_bot_node** 
	- Web application to serve websocket chat and frontend client
	- ***Works with:** ./chat-websocket-server/*
	- ***Language:** EcmaScript6 / Javascript*
	- ***Techs:** Node + SocketIO + ExpressJS + Mongoose*

-  **chat_bot_mongodb** 
	- Database to save chat conversations
	- ***Works with:** ./db/*
	- ***Techs:** MongoDB*

-  **chat_replies_api_nginx** 
 	- Nginx server to serve port 80 connecting to backend service of bot conversation replies
	- ***Works with:** ./chat-replies-api/*
	- ***Techs:** Nginx*

-  **chat_replies_api_phpfpm** 
 	- PHP-FPM service to expose the php application
	- ***Works with:** ./chat-replies-api/*
	- ***Techs:** Nginx*
  
---
### Todo

- Intercept chat conversation to continue by a real support person
- Add some AI to improve answers and conversations

---

### Setting up and running
#### Docker build and init containers
```docker-compose up```

*This may take a bit, regarding dependencies downloading, etc.*

#### Navigate
*Once containers are working, enter*
```http://localhost:80```
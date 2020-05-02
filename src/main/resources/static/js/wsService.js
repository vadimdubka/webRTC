'use strict';

class WsService {

    constructor(url) {
        //connecting to our signaling server
        console.log(`Trying to connected to the signaling server with url:\n${url}.`);
        this.wsConnection = new WebSocket(url);
        this.wsConnection.onopen = () => console.log('Connected to the signaling server.');
    }

    send(message) { this.wsConnection.send(JSON.stringify(message)); }

    setOnMessageFunc(onMessageFunc) {
        this.wsConnection.onmessage = onMessageFunc;
    }

}


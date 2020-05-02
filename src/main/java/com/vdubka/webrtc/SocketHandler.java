package com.vdubka.webrtc;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Component
public class SocketHandler extends TextWebSocketHandler {

    private final List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();

    /** we receive the message from a client, we will send it to all other clients except to itself. */
    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
        String currentSessionId = session.getId();
        for (WebSocketSession webSocketSession : sessions) {
            if (webSocketSession.isOpen() && !currentSessionId.equals(webSocketSession.getId())) {
                webSocketSession.sendMessage(message);
            }
        }
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        log.info("adding new websocket connection #{} from url:{}", sessions.size(), session.getUri());
        sessions.add(session);
    }
}

Test: http://localhost:8080/api/v1/hello

## WebRTC

This module contains articles about WebRTC

### Relevant Articles:

- [Guide to WebRTC](https://www.baeldung.com/webrtc)

WebRTC solves problem of near-realtime communications by creating a direct channel between the two browsers, eliminating the need for the server.

# Peer-to-Peer Connection
Unlike a client-server communication, where there's a known address for the server, and the client already knows the address of the server to communicate with, in a P2P (peer-to-peer) connection, none of the peers has a direct address to another peer.

To establish a peer-to-peer connection, there are few steps involved to allow clients to:

* make themselves available for communication
* identify each other and share network-related information
* share and agree on the format of the data, mode, and protocols involved
* share data
WebRTC defines a set of APIs and methodologies for performing these steps.

For the clients to discover each other, share the network details, and then share the format of the data, WebRTC uses a mechanism called *signaling*.

# Signaling
Signaling refers to the processes involved in network discovery, creation of a session, managing the session, and exchanging the media-capability metadata.

This is essential as the clients need to know each other up front to initiate the communication.

To achieve all these, WebRTC does not specify a standard for signaling and leaves it to the developer’s implementation. So, this provides us the flexibility to use WebRTC on a range of devices with any technology and supporting protocol.


The implementation of the signaling server is simple — we'll create an endpoint that a client application can use to register as a WebSocket connection.

# Exchanging Metadata
In a P2P connection, the clients can be very different from each other. For example, Chrome on Android can connect to Mozilla on a Mac.

Hence, the media capabilities of these devices can vary widely. Therefore, it's essential for a handshake between peers to agree upon the media types and codecs used for communication.

In this phase, WebRTC uses the *SDP (Session Description Protocol)* to agree on the metadata between the clients.

To achieve this, the initiating peer creates an offer that must be set as a remote descriptor by the other peer. In addition, the other peer then generates an answer that is accepted as a remote descriptor by the initiating peer.

The connection is established when this process is complete.

# Establishing a Connection With ICE
The next step in establishing a WebRTC connection involves the *ICE (Interactive Connection Establishment)* and *SDP* protocols, where the session descriptions of the peers are exchanged and accepted at both peers.

The signaling server is used to send this information between the peers. This involves a series of steps where the clients exchange connection metadata through the signaling server.

WebRTC uses the *ICE* protocol to **discover the peers and establish the connection**.
When we set the local description on the peerConnection, it triggers an icecandidate event.
Icecandidate event should transmit the candidate to the remote peer so that the remote peer can add it to its set of remote candidates.

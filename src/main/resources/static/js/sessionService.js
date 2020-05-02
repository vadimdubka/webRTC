'use strict';

class SessionService {

    wsService;
    rtcPeerConnection;
    dataChannel;

    localStream;

    constructor(wsService, configuration, remoteVideoEl) {
        console.log('RTCPeerConnection configuration:', configuration);
        // const rtcPeerConnection = new RTCPeerConnection(configuration, {optional: [{RtpDataChannels: true}]});
        const rtcPeerConnection = new RTCPeerConnection(configuration);
        console.log('Created local rtcPeerConnection object');
        // When we set the local sdp description on the rtcPeerConnection, it triggers an icecandidate event.
        // Setup ice handling. icecandidate event should transmit the candidate to the remote peer so that the remote peer can add it to its set of remote candidates
        rtcPeerConnection.onicecandidate = event => {
            console.log(`Local onicecandidate triggered with ICE candidate:\n${event.candidate ? event.candidate.candidate : '(null)'}`);
            if (event.candidate) {
                wsService.send({
                    event: "candidate",
                    data: event.candidate
                });
            }
        };
        rtcPeerConnection.oniceconnectionstatechange = event => {
            console.log(`Local ICE state: ${rtcPeerConnection.iceConnectionState}`);
            console.log('Local ICE state change event: ', event);
        };
        // when got remote stream
        rtcPeerConnection.ontrack = event => {
            if (remoteVideoEl.srcObject !== event.streams[0]) {
                remoteVideoEl.srcObject = event.streams[0];
                console.log('Received remote stream.');
            }
        };
        this.rtcPeerConnection = rtcPeerConnection;

        const dataChannel = this.rtcPeerConnection.createDataChannel("dataChannel", {reliable: true});
        // when we receive a message from the other peer, printing it on the console
        dataChannel.onmessage = event => console.log("> message:", event.data);
        dataChannel.onerror = error => console.log("> Error occured on datachannel:", error);
        dataChannel.onclose = () => console.log("> data channel is closed");
        this.dataChannel = dataChannel;

        wsService.setOnMessageFunc(this.createOnMessageFunc(rtcPeerConnection, wsService));
        this.wsService = wsService;
    }

    /** we create an SDP offer and set it as the local description of the peerConnection. We then send the offer to the other peer*/
    async createSdpOffer() {
        const offerOptions = {offerToReceiveAudio: 1, offerToReceiveVideo: 1};

        try {
            console.log('createSdpOffer() start');
            const sdpOffer = await this.rtcPeerConnection.createOffer(offerOptions);
            console.log(`rtcPeerConnection.createOffer() complete, sdpOffer:\n${sdpOffer.sdp}`);

            try {
                console.log('rtcPeerConnection.setLocalDescription() start');
                // When we set the local description on the peerConnection, it triggers an icecandidate event.
                await this.rtcPeerConnection.setLocalDescription(sdpOffer);
                // send a call to the signaling server to pass the sdpOffer information to other peer
                this.wsService.send({event: "offer", data: sdpOffer});
                console.log('rtcPeerConnection.setLocalDescription() complete');
            } catch(e) {
                console.log(`Failed to rtcPeerConnection.setLocalDescription: ${e}`);
            }
        } catch(e) {
            console.log(`Failed to createSdpOffer(): ${e}`);
        }
    }

    createOnMessageFunc(rtcPeerConnection, wsService) {
        async function handleSdpOffer(sdpOffer, rtcPeerConnection, wsService) {
            const answerOptions = {offerToReceiveAudio: 1, offerToReceiveVideo: 1};

            try {
                console.log('handleSdpOffer() and setRemoteDescription() start');
                // when the other peer receives the sdp sdpOffer, it must set it as the remote description.
                await rtcPeerConnection.setRemoteDescription(sdpOffer);
                console.log(`rtcPeerConnection.setRemoteDescription() complete`);

                try {
                    console.log('rtcPeerConnection.createAnswer start');
                    // generate an answer to an sdpOffer
                    const sdpAnswer = await rtcPeerConnection.createAnswer(answerOptions); // TODO is offerOptions correct?
                    console.log(`rtcPeerConnection.createAnswer complete, sdpAnswer:\\n${sdpAnswer.sdp}`);

                    try {
                        console.log('rtcPeerConnection.setLocalDescription() start');
                        // When we set the local sdp description on the peerConnection, it triggers an icecandidate event.
                        await rtcPeerConnection.setLocalDescription(sdpAnswer);
                        // sent answer to the initiating peer
                        wsService.send({event: "answer", data: sdpAnswer});
                        console.log(`rtcPeerConnection.setLocalDescription() complete`);
                    } catch(e) {
                        console.log(`Failed to rtcPeerConnection.setLocalDescription(): ${e}`);
                    }

                } catch(e) {
                    console.log(`Failed to rtcPeerConnection.createAnswer(): ${e}`);
                }

            } catch(e) {
                console.log(`Failed to handleSdpOffer(): ${e}`);
            }
        }

        /** The initiating peer receives the sdpAnswer and sets it as the remote description.
         * Now, we can send and receive data between the two peers directly, without the signaling server.*/
        async function handleSdpAnswer(sdpAnswer, rtcPeerConnection) {
            try {
                console.log('rtcPeerConnection.setRemoteDescription() start');
                await rtcPeerConnection.setRemoteDescription(sdpAnswer);
                console.log(`rtcPeerConnection.setRemoteDescription() complete`);
                console.log("----->connection established successfully!<-----");
            } catch(e) {
                console.log(`Failed to handleSdpAnswer(): ${e}`);
            }
        }

        /** process the ICE candidate sent by the other peer, add it to its candidate pool*/
        async function handleIceCandidate(candidate, rtcPeerConnection) {
            try {
                console.log(`handleIceCandidate() started with candidate: ${candidate}`);
                await rtcPeerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                console.log('handleIceCandidate() complete');
            } catch(e) {
                console.log(`Failed to handleIceCandidate(): ${e}`);
            }
        }

        return function(msg) {
            console.log("Got message", msg.data);
            const content = JSON.parse(msg.data);
            const data = content.data;
            switch (content.event) {
                // when somebody wants to call us
                case "offer":
                    handleSdpOffer(data, rtcPeerConnection, wsService);
                    break;
                // when somebody answers to our offer
                case "answer":
                    handleSdpAnswer(data, rtcPeerConnection);
                    break;
                // when a remote peer sends an ice candidate to us
                case "candidate":
                    handleIceCandidate(data, rtcPeerConnection);
                    break;
                default:
                    break;
            }
        };
    }

    /** Once we've established the connection, we can send messages between the peers using the send method of the dataChannel*/
    sendMessage(message) {
        this.dataChannel.send(message);
    }

    setLocalStream(localStream) {
        localStream.getTracks().forEach(track => this.rtcPeerConnection.addTrack(track, localStream));
        this.localStream = localStream;
        console.log('Added local stream to rtcPeerConnection');
    }

    closeSession() {
        console.log('Ending call');
        this.rtcPeerConnection.close();
        this.rtcPeerConnection = null;
    }
}

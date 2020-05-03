'use strict';
const wsUrl = 'ws://localhost:8080/socket';
// const wsUrl = 'ws://13.53.35.183:8080/socket';
const wsService = new WsService(wsUrl);
let sessionService;

let startTime;

const startVideoButton = document.getElementById('startVideoBtn');
const callButton = document.getElementById('callBtn');
const hangupButton = document.querySelector('#hangUpBtn');

callButton.disabled = true;
hangupButton.disabled = true;

startVideoButton.onclick = ev => startVideo();
callButton.onclick = ev => call();
hangupButton.addEventListener('click', hangUp);

const localVideoEl = document.getElementById('localVideoEl');
const remoteVideoEl = document.getElementById('remoteVideoEl');

localVideoEl.onloadedmetadata = ev => console.log(`Local video width: ${ev.target.videoWidth}px, height: ${ev.target.videoHeight}px`);
remoteVideoEl.onloadedmetadata = ev => console.log(`Remote video width: ${ev.target.videoWidth}px, height: ${ev.target.videoHeight}px`);
remoteVideoEl.addEventListener('resize', () => {
    console.log(`Remote video size changed to ${remoteVideoEl.videoWidth}x${remoteVideoEl.videoHeight}`);
    // We'll use the first onsize callback as an indication that video has started playing out.
    if (startTime) {
        const elapsedTime = window.performance.now() - startTime;
        console.log('Setup time: ' + elapsedTime.toFixed(3) + 'ms');
        startTime = null;
    }
});

//************** video **************
const mediaStreamConstraints = window.constraints = {audio: true, video: true};

async function startVideo() {
    console.log('Requesting local mediaStream.');
    startVideoButton.disabled = true;
    try {
        const localMediaStream = await navigator.mediaDevices.getUserMedia(mediaStreamConstraints);
        console.log('Received local localMediaStream with constraints:', mediaStreamConstraints);
        window.stream = localMediaStream; // make variable available to browser console
        localVideoEl.srcObject = localMediaStream;
        callButton.disabled = false;

        const videoTracks = localMediaStream.getVideoTracks();
        const audioTracks = localMediaStream.getAudioTracks();
        if (videoTracks.length > 0) {
            console.log(`Using video device: ${videoTracks[0].label}`);
        }
        if (audioTracks.length > 0) {
            console.log(`Using audio device: ${audioTracks[0].label}`);
        }


        // the purpose of the configuration object is to pass in the STUN and TURN servers and other configurations.
        // const configuration = getSelectedSdpSemantics();
        const configuration = {
            'iceServers': [
                {
                    'urls': 'stun:stun.l.google.com:19302'
                },
                {
                    'urls': 'turn:10.158.29.39:3478?transport=udp',
                    'credential': 'XXX', 'username': 'XXX'
                }]
        };
        sessionService = new SessionService(wsService, configuration, remoteVideoEl);
        sessionService.setLocalStream(localMediaStream);
    } catch(e) {
        startVideoButton.disabled = false;
        handleError(e);
    }
}

const errorElement = document.getElementById('errorMsg');

function handleError(error) {
    let msg;
    if (error.name === 'ConstraintNotSatisfiedError') {
        const v = mediaStreamConstraints.video;
        msg = `The resolution ${v.width.exact}x${v.height.exact} px is not supported by your device.`;
    } else if (error.name === 'PermissionDeniedError') {
        msg = 'Permissions have not been granted to use your camera and ' +
            'microphone, you need to allow the page access to your devices in ' +
            'order for the demo to work.';
    } else {
        msg = `getUserMedia error: ${error.name}`;
    }

    errorElement.innerHTML += `<p>${msg}</p>`;
    if (typeof error !== 'undefined') {
        console.error(error);
    }
}

function getSelectedSdpSemantics() {
    const sdpSemanticsSelect = document.querySelector('#sdpSemantics');
    const option = sdpSemanticsSelect.options[sdpSemanticsSelect.selectedIndex];
    return option.value === '' ? {} : {sdpSemantics: option.value};
}

async function call() {
    callButton.disabled = true;
    hangupButton.disabled = false;
    console.log('Starting call');
    startTime = window.performance.now();
    await sessionService.createSdpOffer();
}

function hangUp() {
    sessionService.closeSession();
    hangupButton.disabled = true;
    startVideoButton.disabled = false;
}


/************messaging*************/
function initializeMessaging() {
    sessionService = new SessionService(wsService, {});
    sessionService.createSdpOffer();
}

const messageInput = document.getElementById("messageInput");

function sendMessage() {
    sessionService.sendMessage(messageInput.value);
    messageInput.value = "";
}

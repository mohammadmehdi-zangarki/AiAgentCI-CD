import { useEffect, useReducer, useRef, useState } from "react";
import { sockets } from "../../utils/sockets";

const VoiceBtn = () => {
    const recorderRef = useRef(null);
    const socketRef = useRef(null);
    var chunks = [];

    useEffect(() => {
        if (!socketRef.current)
            socketRef.current = sockets.voice();
    }, []);

    const [state, dispatch] = useReducer((state, action) => {
        switch (action.type) {
            case 'START_RECORDING':

                if (state.isRecording || action.recorder == null)
                    return state;

                if (action.recorder.state == "inactive") {
                    action.recorder.start();
                    console.log("Recording started");
                }

                return { ...state, isRecording: true, recorder: action.recorder };

            case 'STOP_RECORDING':

                if (state.recorder == null)
                    return state

                if (state.recorder.state == "recording") {
                    state.recorder.stop();
                    console.log("Recording stoped");
                }

                return { ...state, isRecording: false, recorder: null };

            default:
                return state;
        }
    }, {
        isRecording: false,
        recorder: null
    });

    const sendAudioData = () => {
        if (chunks.length === 0) return;

        const blob = new Blob(chunks, { type: 'audio/webm' });
        chunks = [];

        const reader = new FileReader();
        reader.onloadend = () => {
            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                socketRef.current.send(reader.result);
                console.log("MP3 audio data sent to server");
            } else {
                console.error("WebSocket is not open. Cannot send audio data.");
            }
        };

        reader.readAsArrayBuffer(blob);
    };
    const handleVoiceClick = async () => {
        if (state.isRecording) {
            dispatch({ type: 'STOP_RECORDING' });
        } else {
            if (!checkMicSupport())
                return

            const stream = await getStream()

            if (!stream)
                return;

            recorderRef.current = recorderFactory(stream);

            dispatch({ type: 'START_RECORDING', recorder: recorderRef.current });
        }
    }

    const recorderFactory = (stream) => {
        const recorder = new MediaRecorder(stream);

        recorder.ondataavailable = (event) => { pushChunk(event) };

        recorder.onstop = () => {
            sendAudioData();
        }

        return recorder;
    }

    const pushChunk = (event) => {
        if (event.data.size > 0) {
            chunks.push(event.data);
        }
    }

    const checkMicSupport = async () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            return true
        } else {
            console.log("getUserMedia not supported on your browser!");
            return false;
        }
    }

    const getStream = async () => {
        return navigator.mediaDevices
            .getUserMedia(
                {
                    audio: true,
                },
            )

            // Success callback
            .then((stream) => {
                return stream;
            })

            // Error callback
            .catch((err) => {
                alert("Microphone permission is required to use voice input.");

                console.error(`The following getUserMedia error occurred: ${err}`);

                return false
            });
    }

    return (
        <button className="chat-submit-button w-full flex items-center justify-center" onClick={handleVoiceClick}>
            {state.isRecording ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="8" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-100" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14a3.996 3.996 0 0 0 4-4V5a4 4 0 0 0-8 0v5a3.996 3.996 0 0 0 4 4zm5-4a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-4.08A7 7 0 0 0 19 10h-2z" />
                </svg>
            )}
        </button>
    )
}

export default VoiceBtn;
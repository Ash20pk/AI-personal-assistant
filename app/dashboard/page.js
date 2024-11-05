"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Volume2, VolumeX } from 'lucide-react';
import dynamic from 'next/dynamic';
import { RealtimeClient } from '@openai/realtime-api-beta';
import { Howl } from 'howler';
import Recorder from 'recorder-js';  

// Dynamically import Lottie with no SSR
const Lottie = dynamic(() => import('lottie-react'), {
  ssr: false,
});

const CircularButton = ({ onClick, children, isActive }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    const loadAssets = async () => {
      if (typeof window !== 'undefined') {
        const clickSound = (await import('../button-click.mp3')).default;
        audioRef.current = new Audio(clickSound);
      }
    };

    loadAssets();
  }, []);

  const handleClick = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(error => console.error("Audio playback failed:", error));
    }
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out
                  relative overflow-hidden
                  ${isActive 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-transparent border-2 border-blue-500 text-blue-500'}
                  hover:bg-blue-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400`}
    >
      <div className="relative z-10">
        {children}
      </div>
      <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 transition-opacity duration-300 ease-in-out ${isActive ? 'opacity-100' : 'opacity-0'}`}></div>
      <div className="absolute inset-0 bg-grid bg-repeat bg-center opacity-20"></div>
    </button>
  );
};

const Dashboard = () => {
  const [isClient, setIsClient] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [note, setNote] = useState('');
  const [openAIResponse, setOpenAIResponse] = useState('');
  const [hasMicrophoneAccess, setHasMicrophoneAccess] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [animation, setAnimation] = useState(null);
  const [noteOpacity, setNoteOpacity] = useState(1);
  const [currentSound, setCurrentSound] = useState(null);
  
  const clientRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const speechSynthesisRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recorderInstanceRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);
  const workletNodeRef = useRef(null);

  // Load assets only on client side
  useEffect(() => {
    const loadAssets = async () => {
      const holographicPersonAnimation = (await import('../holo_animation.json')).default;
      setAnimation(holographicPersonAnimation);
      setIsClient(true);

      // Initialize Web Speech API recognition
      if (typeof window !== 'undefined') {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = true;

          recognitionRef.current.onresult = (event) => {
            setNoteOpacity(1);
            const transcript = Array.from(event.results)
              .map((result) => result[0])
              .map((result) => result.transcript)
              .join('');
            setNote(transcript);
          };

          recognitionRef.current.onend = () => {
            // Only stop listening if we're not in the middle of speech
            if (!isListening) {
              mediaRecorderRef.current?.stop();
            }
          };
        }
      }

      setHasMicrophoneAccess(true);

      // Initialize Web Audio API with AudioWorklet
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      
      try {
        await audioContextRef.current.audioWorklet.addModule('/audioProcessor.js');
      } catch (error) {
        console.error('Error loading audio worklet:', error);
      }

      // Initialize RealtimeClient
      initializeRealtimeClient();

      return () => {
        if (sourceRef.current) {
          sourceRef.current.disconnect();
        }
        if (workletNodeRef.current) {
          workletNodeRef.current.disconnect();
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
        }
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        if (clientRef.current) {
          clientRef.current.disconnect();
        }
        if (speechSynthesisRef.current) {
          speechSynthesisRef.current.cancel();
        }
        audioChunksRef.current = [];
      };
    };

    loadAssets();

    // Initialize speech synthesis
    speechSynthesisRef.current = window.speechSynthesis;

    // Initialize Web Audio API
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();

    // Initialize RealtimeClient
    initializeRealtimeClient();

    return () => {
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (workletNodeRef.current) {
        workletNodeRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel();
      }
      audioChunksRef.current = [];
    };
  }, []);

  const initializeRealtimeClient = async () => {
    clientRef.current = new RealtimeClient({ apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY, dangerouslyAllowAPIKeyInBrowser: true });
    // Can set parameters ahead of connecting, either separately or all at once
    clientRef.current.updateSession({ instructions: 'You are a great, upbeat friend.' });
    clientRef.current.updateSession({ voice: 'alloy' });
    clientRef.current.updateSession({
      turn_detection: { type: 'disabled' }, // or 'server_vad'
      input_audio_transcription: { model: 'whisper-1' },
    });

    // Connect to Realtime API
    await clientRef.current.connect();
  };

  const fetchResponse = async () => {
    // Set up event handling
    clientRef.current.on('conversation.item.completed', (item) => {
      if (item?.item?.formatted) {
        setOpenAIResponse(item.item.formatted.transcript || '');
        
        // Handle audio chunk
        if (item.item.formatted.audio && !isMuted) {
          // Each chunk is a new Int16Array
          const audioChunk = item.item.formatted.audio;
          if (audioChunk.length > 0) {
            playReceivedAudio(audioChunk);
          }
        }
      }
    });
  };

  const toggleListening = async () => {
    try {
      if (isListening) {
        // Stop listening
        if (sourceRef.current) {
          sourceRef.current.disconnect();
        }
        if (workletNodeRef.current) {
          workletNodeRef.current.disconnect();
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
        }
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (error) {
            console.error('Error stopping recognition:', error);
          }
        }
        handleSpeechEnd();
        setIsListening(false);
      } else {
        setNote('');
        try {
          // Make sure recognition is stopped before starting
          if (recognitionRef.current) {
            try {
              recognitionRef.current.stop();
            } catch (error) {
              // Ignore error if recognition wasn't actually running
            }
          }

          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              sampleRate: 24000,
              channelCount: 1,
              echoCancellation: true,
              noiseSuppression: true,
            },
          });
          mediaStreamRef.current = stream;

          // Create new audio context if the previous one was closed
          if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new AudioContext({ sampleRate: 24000 });
            await audioContextRef.current.audioWorklet.addModule('/audioProcessor.js');
          }

          // Resume audio context if it was suspended
          if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
          }

          const source = audioContextRef.current.createMediaStreamSource(stream);
          sourceRef.current = source;

          // Create AudioWorkletNode with explicit output channel count
          const workletNode = new AudioWorkletNode(audioContextRef.current, 'audio-processor', {
            numberOfInputs: 1,
            numberOfOutputs: 0,  // Set to 0 to prevent any audio output
            channelCount: 1,
          });
          workletNodeRef.current = workletNode;

          // Handle messages from the AudioWorklet
          workletNode.port.onmessage = (event) => {
            if (event.data.audioData && clientRef.current) {
              clientRef.current.appendInputAudio(event.data.audioData);
            }
          };

          // Connect source to worklet only
          source.connect(workletNode);

          // Start speech recognition for transcription after a small delay
          setTimeout(() => {
            if (recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (error) {
                console.error('Error starting recognition:', error);
              }
            }
          }, 100);

          setIsListening(true);
          setHasMicrophoneAccess(true);

        } catch (err) {
          console.error("Error starting recording:", err);
          setHasMicrophoneAccess(false);
        }
      }
    } catch (error) {
      console.error('Error toggling listening state:', error);
    }
  };

  const handleSpeechEnd = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);

      try {
        setIsAssistantSpeaking(true);
        clientRef.current.createResponse();
        
        setNote('');
        fetchResponse();
      } catch (error) {
        console.error('Error processing speech end:', error);
        setOpenAIResponse('An error occurred while processing your request.');
        setIsAssistantSpeaking(false);
      }
  };

  const playReceivedAudio = (audioChunk) => {
    try {
      // Create WAV buffer from this chunk
      const wavBuffer = createWavBuffer(audioChunk);
      const blob = new Blob([wavBuffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);

      // Create and play sound using Howler
      const sound = new Howl({
        src: [url],
        format: ['wav'],
        autoplay: true,
        html5: true,
        volume: 1.0,
        onend: () => {
          URL.revokeObjectURL(url);
          setCurrentSound(null);
        },
        onloaderror: (id, error) => {
          console.error('Error loading audio chunk:', error);
          URL.revokeObjectURL(url);
        },
        onplayerror: (id, error) => {
          console.error('Error playing audio chunk:', error);
          URL.revokeObjectURL(url);
        }
      });

      // Store the current sound
      setCurrentSound(sound);

    } catch (error) {
      console.error('Error processing audio chunk:', error);
    }
  };

  const createWavBuffer = (audioData) => {
    const numChannels = 1;
    const sampleRate = 24000;  // Match API sample rate
    const bitsPerSample = 16;  // PCM 16-bit
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = audioData.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // Write WAV header
    const writeString = (view, offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);       // PCM format (1)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write audio data as 16-bit PCM
    const offset = 44;
    for (let i = 0; i < audioData.length; i++) {
      view.setInt16(offset + i * bytesPerSample, audioData[i], true);
    }

    return buffer;
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (currentSound && !isMuted) {
      currentSound.stop();
    }
  };

  // Clean up sounds on unmount
  useEffect(() => {
    return () => {
      if (currentSound) {
        currentSound.stop();
      }
    };
  }, [currentSound]);

  if (!isClient || !animation) {
    return (
      <div className="min-h-screen bg-black pt-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-white">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center">
          <div className="w-full max-w-4xl flex flex-col items-center">        
            <div className="relative w-[85%] flex justify-center items-center mb-2">
              {animation && (
                <Lottie 
                  animationData={animation}
                  loop={true}
                  autoplay={true}
                  style={{ 
                    width: '60%', 
                    height: '60%',
                    opacity: isAssistantSpeaking ? 1 : 0.7,
                    transition: 'opacity 0.5s ease-in-out',
                  }}
                  className={`lottie-animation ${isListening ? 'brightness-100' : isAssistantSpeaking ? 'brightness-150' : 'brightness-50' }`}
                />
              )}
            </div>

            <div className="flex justify-center space-x-3 mb-6">
              {hasMicrophoneAccess ? (
                <>
                  <CircularButton onClick={toggleListening} isActive={isListening}>
                    <Mic size={24} />
                  </CircularButton>
                  <CircularButton onClick={toggleMute} isActive={!isMuted}>
                    {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                  </CircularButton>
                </>
              ) : (
                <p className="text-lg text-red-500">Please grant microphone access to use this feature.</p>
              )}
            </div>
            
            <div className="w-full text-center">
              <p 
                className="text-xl text-blue-300 transition-opacity duration-500" 
                style={{ opacity: noteOpacity }}
              >
                {note || "Speak to interact with JARVIS..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
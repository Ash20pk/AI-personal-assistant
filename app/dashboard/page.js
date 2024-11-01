"use client"
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Volume2, VolumeX } from 'lucide-react';
import { default as dynamicImport } from 'next/dynamic';

// Dynamically import Lottie with no SSR
const Lottie = dynamicImport(() => import('lottie-react'), {
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
  const recognitionRef = useRef(null);
  const speechSynthesisRef = useRef(null);
  const [noteOpacity, setNoteOpacity] = useState(1);

  // Load assets only on client side
  useEffect(() => {
    const loadAssets = async () => {
      const holographicPersonAnimation = (await import('../holo_animation.json')).default;
      setAnimation(holographicPersonAnimation);
      setIsClient(true);
    };

    loadAssets();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition && !recognitionRef.current) {
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
          setIsListening(false);
        };
      }

      speechSynthesisRef.current = window.speechSynthesis;

      // Request microphone access
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
          setHasMicrophoneAccess(true);
        })
        .catch((err) => {
          console.error("Error accessing microphone:", err);
          setHasMicrophoneAccess(false);
        });
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
      handleSpeechEnd();
    } else {
      setNote('');
      recognitionRef.current.start();
    }
    setIsListening(!isListening);
  };

  const handleSpeechEnd = async () => {
    if (isListening) {
      recognitionRef.current.stop();
    }
    if (note) {
      try {
        setIsAssistantSpeaking(true);
        const response = await fetch('/api/openai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: note }),
        });
        const data = await response.json();
        setOpenAIResponse(data.response);
        if (!isMuted) {
          speakResponse(data.response);
        }
      } catch (error) {
        console.error('Error:', error);
        setOpenAIResponse('An error occurred while processing your request.');
      }
    }
  };

  const speakResponse = (text) => {
    if (speechSynthesisRef.current) {
      const formattedText = text.replace(/\n/g, ' ');
      
      const utterance = new SpeechSynthesisUtterance(formattedText);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.voice = speechSynthesisRef.current.getVoices().find(voice => voice.name === 'Google UK English Male') || speechSynthesisRef.current.getVoices()[0];

      utterance.onstart = () => {
        setIsAssistantSpeaking(true);
        setNoteOpacity(0);
        setTimeout(() => {
          setNote('');
        }, 500);
      };

      utterance.onboundary = () => {
        setIsAssistantSpeaking(true);
      };

      utterance.onend = () => {
        setIsAssistantSpeaking(false);
      };

      speechSynthesisRef.current.speak(utterance);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (speechSynthesisRef.current) {
      if (!isMuted) {
        speechSynthesisRef.current.cancel();
      }
    }
  };

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
"use client"
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Volume2, VolumeX } from 'lucide-react';
import Lottie from 'lottie-react';
import holographicPersonAnimation from './holo_animation.json';

const CircularButton = ({ onClick, children, isActive }) => (
  <button
    onClick={onClick}
    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out
                ${isActive 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-transparent border-2 border-blue-500 text-blue-500'}
                hover:bg-blue-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400`}
  >
    {children}
  </button>
);

export default function Home() {
  const [isListening, setIsListening] = useState(false);
  const [note, setNote] = useState('');
  const [openAIResponse, setOpenAIResponse] = useState('');
  const [hasMicrophoneAccess, setHasMicrophoneAccess] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const recognitionRef = useRef(null);
  const speechSynthesisRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition && !recognitionRef.current) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map((result) => result[0])
            .map((result) => result.transcript)
            .join('');
          setNote(transcript);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };

        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(() => {
            console.log("Microphone access granted");
            setHasMicrophoneAccess(true);
          })
          .catch((err) => console.error("Error accessing microphone:", err));
      }

      speechSynthesisRef.current = window.speechSynthesis;
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
      handleSpeechEnd(); // Call handleSpeechEnd when the user stops listening
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
      } finally {
        setIsAssistantSpeaking(false);
      }
    }
  };

  console.log(openAIResponse);

  const speakResponse = (text) => {
    if (speechSynthesisRef.current) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.voice = speechSynthesisRef.current.getVoices().find(voice => voice.name === 'Google UK English Male') || speechSynthesisRef.current.getVoices()[0];
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

  return (
    <div className="min-h-screen bg-black text-blue-400 p-2 flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl flex flex-col items-center">        
        <div className="relative w-full aspect-square mb-8 flex justify-center items-center">
          <Lottie 
            animationData={holographicPersonAnimation}
            loop={true}
            autoplay={true}
            style={{ 
              width: '70%', 
              height: '70%',
              opacity: isAssistantSpeaking ? 1 : 0.7,
              transition: 'opacity 0.5s ease-in-out',
              filter: 'brightness(1.5)', 
            }}
            className={`lottie-animation ${isListening ? 'glow' : ''}`}
          />
        </div>

        <div className="flex justify-center space-x-4 mb-8">
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
          <p className="text-lg mb-4 text-blue-300">{note || "Speak to interact with JARVIS..."}</p>
          <p className="text-xl text-blue-400">{openAIResponse || "JARVIS is ready to assist you."}</p>
        </div>
      </div>
    </div>
  );
}
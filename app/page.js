"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Mic, StopCircle } from 'lucide-react';

const AnimatedWaveform = ({ isListening }) => (
  <div className={`flex justify-center items-center space-x-1 h-16 ${isListening ? 'animate-pulse' : ''}`}>
    {[...Array(5)].map((_, i) => (
      <div
        key={i}
        className={`w-1 bg-blue-500 rounded-full ${
          isListening ? `animate-waveform-${i + 1}` : 'h-2'
        }`}
        style={{ animationDelay: `${i * 0.1}s` }}
      ></div>
    ))}
  </div>
);

const Button = ({ onClick, children, color = 'blue' }) => (
  <button
    onClick={onClick}
    className={`bg-${color}-500 hover:bg-${color}-600 text-white font-bold py-2 px-4 rounded-full 
                transition-all duration-300 ease-in-out transform hover:scale-105 
                focus:outline-none focus:ring-2 focus:ring-${color}-400 focus:ring-opacity-50`}
  >
    {children}
  </button>
);

export default function Home() {
  const [isListening, setIsListening] = useState(false);
  const [note, setNote] = useState('');
  const [openAIResponse, setOpenAIResponse] = useState('');
  const [hasMicrophoneAccess, setHasMicrophoneAccess] = useState(false);
  const recognitionRef = useRef(null);

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

        // Request microphone access when the component mounts
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(() => {
            console.log("Microphone access granted");
            setHasMicrophoneAccess(true);
          })
          .catch((err) => console.error("Error accessing microphone:", err));
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setNote('');
      recognitionRef.current.start();
    }
    setIsListening(!isListening);
  };

  const handleStopListening = async () => {
    if (isListening) {
      recognitionRef.current.stop();
    }
    if (note) {
      try {
        const response = await fetch('/api/openai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: note }),
        });
        const data = await response.json();
        setOpenAIResponse(data.response);
      } catch (error) {
        console.error('Error:', error);
        setOpenAIResponse('An error occurred while processing your request.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-blue-400">Speech to Text with OpenAI</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-8 shadow-lg">
          <AnimatedWaveform isListening={isListening} />
          
          <div className="flex justify-center mb-4">
            {hasMicrophoneAccess ? (
              isListening ? (
                <Button onClick={handleStopListening} color="red">
                  <StopCircle className="inline mr-2" />
                  Stop Listening
                </Button>
              ) : (
                <Button onClick={toggleListening} color="green">
                  <Mic className="inline mr-2" />
                  Start Listening
                </Button>
              )
            ) : (
              <p className="text-lg">Please grant microphone access to use this feature.</p>
            )}
          </div>
          
          <div className="bg-gray-700 p-4 rounded-lg mb-4">
            <p className="text-lg">{note || "Your speech will appear here..."}</p>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <p className="bg-gray-700 p-2 rounded">{openAIResponse || ""}</p>
        </div>
      </div>
    </div>
  );
}
"use client"

import React, { useState, useEffect } from 'react';
import { Mic, StopCircle, Save } from 'lucide-react';

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

const Button = ({ onClick, disabled, children, color = 'blue' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`bg-${color}-500 hover:bg-${color}-600 text-white font-bold py-2 px-4 rounded-full 
                transition-all duration-300 ease-in-out transform hover:scale-105 
                focus:outline-none focus:ring-2 focus:ring-${color}-400 focus:ring-opacity-50
                disabled:opacity-50 disabled:cursor-not-allowed`}
  >
    {children}
  </button>
);

export default function Home() {
  const [isListening, setIsListening] = useState(false);
  const [note, setNote] = useState('');
  const [savedNotes, setSavedNotes] = useState([]);
  const [openAIResponse, setOpenAIResponse] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map((result) => result[0])
            .map((result) => result.transcript)
            .join('');
          setNote(transcript);
        };

        if (isListening) {
          recognition.start();
        } else {
          recognition.stop();
        }

        return () => {
          recognition.stop();
        };
      }
    }
  }, [isListening]);

  const handleSaveNote = async () => {
    setSavedNotes([...savedNotes, note]);
    setNote('');
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
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-blue-400">Speech to Text with OpenAI</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-8 shadow-lg">
          <AnimatedWaveform isListening={isListening} />
          
          <div className="flex justify-center space-x-4 mb-4">
            <Button onClick={() => setIsListening(prevState => !prevState)} color={isListening ? 'red' : 'green'}>
              {isListening ? <StopCircle className="inline mr-2" /> : <Mic className="inline mr-2" />}
              {isListening ? 'Stop Listening' : 'Start Listening'}
            </Button>
            <Button onClick={handleSaveNote} disabled={!note} color="purple">
              <Save className="inline mr-2" />
              Save & Process
            </Button>
          </div>
          
          <div className="bg-gray-700 p-4 rounded-lg mb-4">
            <p className="text-lg">{note || "Your speech will appear here..."}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-purple-400">Saved Notes</h2>
            {savedNotes.map((n, index) => (
              <p key={index} className="mb-2 bg-gray-700 p-2 rounded">{n}</p>
            ))}
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-green-400">OpenAI Response</h2>
            <p className="bg-gray-700 p-2 rounded">{openAIResponse || "OpenAI response will appear here..."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
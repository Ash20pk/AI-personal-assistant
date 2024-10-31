"use client"
import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
          Jarvis.ai
        </h1>
        <p className="text-xl mb-12 text-blue-300">
          Your personal AI assistant powered by advanced voice recognition
        </p>
        <div className="space-x-4">
          <Link 
            href="/login" 
            className="inline-block px-8 py-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            Login
          </Link>
          <Link 
            href="/register" 
            className="inline-block px-8 py-3 rounded-lg border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
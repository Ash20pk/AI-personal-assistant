"use client"
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, Bot, Shield, Zap } from 'lucide-react';

const AnimatedText = ({ text }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="overflow-hidden">
      <div className={`transform transition-transform duration-1000 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}>
        {text}
      </div>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description, delay }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={`p-8 bg-black border border-white/10 rounded-xl transform transition-all duration-700 hover:scale-105 hover:border-white/30 ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
    }`}>
      <Icon className="w-12 h-12 text-white mb-4" />
      <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
};

export default function Home() {
  const features = [
    {
      icon: Bot,
      title: "Advanced AI",
      description: "Powered by cutting-edge machine learning algorithms for human-like interactions"
    },
    {
      icon: Zap,
      title: "Real-time Processing",
      description: "Lightning-fast responses with minimal latency for seamless conversations"
    },
    {
      icon: Shield,
      title: "Secure Interface",
      description: "Enterprise-grade security with end-to-end encryption for your privacy"
    }
  ];

  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    setAnimationClass('animate-pulse');
    const timer = setInterval(() => {
      setAnimationClass(prev => prev === 'animate-pulse' ? '' : 'animate-pulse');
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-20">
          <div className="relative mb-8">
            <Sparkles 
              className={`absolute -top-8 -right-8 w-16 h-16 text-white/50 ${animationClass}`}
            />
            <AnimatedText text={
              <h1 className="text-6xl font-bold mb-8 tracking-tight">
                Next Generation
                <span className="block mt-2 bg-gradient-to-r from-white to-gray-500 text-transparent bg-clip-text">
                  AI Assistant
                </span>
              </h1>
            } />
          </div>
          
          <AnimatedText text={
            <p className="text-xl mb-12 text-gray-400">
              Experience the future of personal assistance with advanced voice recognition
              and natural language processing capabilities
            </p>
          } />
          
          <div className="space-x-6 relative">
            <Link 
              href="/dashboard"
              className="inline-block px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-black transition-colors duration-300"
            >
              Get Started
            </Link>
            <div className="absolute -z-10 inset-0 blur-3xl bg-white/5 rounded-full" />
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index} 
              {...feature} 
              delay={500 + (index * 200)}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-20">
          <AnimatedText text={
            <div className="space-y-6">
              <p className="text-gray-400 text-lg">Ready to experience the future?</p>
              <Link
                href="/register"
                className="inline-block px-12 py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors duration-300"
              >
                Start Free Trial
              </Link>
            </div>
          } />
        </div>
      </div>
    </div>
  );
}
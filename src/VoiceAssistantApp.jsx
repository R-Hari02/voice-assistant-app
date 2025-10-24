import React, { useState, useEffect } from 'react';
import logo from './logo.png';
const API_KEY = "AIzaSyAQeErVFkKQLcPVOgUnVThGH_niE6ZssAs";

export default function VoiceAssistantApp() {
  const [messages, setMessages] = useState([]);
  const [listening, setListening] = useState(false);
  const [inputText, setInputText] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [page, setPage] = useState('assistant');
  // Check for saved theme preference or default to light mode
  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Toggle dark mode and save preference
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'en-US';
  recognition.interimResults = false;

  // Add browser support message if needed
  if (!(window.SpeechRecognition || window.webkitSpeechRecognition)) {
    setMessages(prev => [...prev, { sender: 'System', text: 'Speech recognition not supported in this browser.' }]);
  }

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';

    utterance.onstart = () => {
      setIsSpeaking(true);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
    };

    speechSynthesis.speak(utterance);
  };

  const handleMicClick = () => {
    setListening(true);
    recognition.start();
  };

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // Add user message to chat
    setMessages((prev) => [...prev, { sender: 'You', text: inputText }]);

    // Clear input field
    const userText = inputText;
    setInputText('');

    // Get AI response
    const aiReply = await sendToGemini(userText);
    setMessages((prev) => [...prev, { sender: 'ProHariAI', text: aiReply }]);

    // Speak the response
    speak(aiReply);
  };

  recognition.onresult = async (event) => {
    const userText = event.results[0][0].transcript;
    setMessages((prev) => [...prev, { sender: 'You', text: userText }]);

    const aiReply = await sendToGemini(userText);
    setMessages((prev) => [...prev, { sender: 'ProHariAI', text: aiReply }]);

    speak(aiReply);
    setListening(false);
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    setMessages((prev) => [...prev, { sender: 'System', text: `Speech Error: ${event.error}` }]);
    setListening(false);
  };

  const sendToGemini = async (prompt) => {
    // Check for identity questions
    const identityRegex = /who are you|what'?s your name|your name|your identity/i;
    if (identityRegex.test(prompt)) {
      return "I am Pro Hari AI created by R Harinandan";
    }

    try {
      console.log('Sending request to Gemini API with prompt:', prompt);

      const modelName = 'gemini-1.5-flash-latest'; // Use a current model
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      console.log('API response status:', res.status);

      // Check if the response is ok
      if (!res.ok) {
        const errorText = await res.text();
        console.error('API error response:', errorText);

        // Special handling for API key errors
        if (res.status === 403 || res.status === 401) {
          return "API Error: Invalid or missing API key. Please check your API key.";
        }

        return `API Error: ${res.status} - ${res.statusText}`;
      }

      const data = await res.json();
      console.log('API response data:', data);

      // Check if we have valid content in the response
      if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.warn('Unexpected API response structure:', data);
        return "Sorry, I couldn't understand the response.";
      }

      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error in sendToGemini:', error);

      // Check for network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return "Network Error: Please check your internet connection.";
      }

      return `Error: ${error.message || 'Unknown error occurred'}`;
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen px-4 py-8 glow-edge ${isSpeaking && page === 'assistant' ? 'speaking-gradient' : ''}`}>
      {/* Dark mode toggle button and hamburger menu */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-2">
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? (
            // Sun icon for dark mode
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
          ) : (
            // Moon icon for light mode
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>
        {/* Hamburger menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          aria-label="Toggle menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      {/* Menu dropdown */}
      {menuOpen && (
        <div className="absolute top-16 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg w-48 z-50">
          <ul className="flex flex-col">
            <li className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">Home</li>
            <li className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">Dashboard</li>
            <li className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">Login</li>
            <li className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">Signup</li>
            <li
              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              onClick={() => {
                setPage('about');
                setMenuOpen(false);
              }}
            >
              About Us
            </li>
          </ul>
        </div>
      )}
      {/* Page content */}
      {page === 'about' ? (
        <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8">
          <img src={logo} alt="ProHariAI Logo" className="h-32 w-32 rounded-full mb-4" />
          <p className="text-lg text-gray-700 dark:text-gray-300">ProHari AI created by R Harinandan</p>
          <button
            onClick={() => setPage('assistant')}
            className="mt-6 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-700"
          >
            Back
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center w-full">
          <div className="relative mb-4">
            {isSpeaking && page === 'assistant' && (
              <div className="absolute -inset-2 rounded-full animate-pulse bg-black/20 dark:bg-purple-600/50 blur-2xl"></div>
            )}
            <img src={logo} alt="ProHariAI Logo" className="h-24 w-24 rounded-full relative" />
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold mb-6 text-gray-700 dark:text-gray-200">ProHariAI Virtual Assistant</h1>

          <div
            className="w-full max-w-5xl bg-white dark:bg-gray-800 p-4 h-[40rem] overflow-y-auto mb-6"
            style={{
              scrollBehavior: 'smooth',
              maskImage: 'linear-gradient(to bottom, black, black 85%, transparent)',
              WebkitMaskImage: 'linear-gradient(to bottom, black, black 85%, transparent)',
            }}
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-3 p-3 rounded-lg text-sm ${
                  msg.sender === 'You' 
                    ? 'bg-gray-800 dark:bg-gray-700 text-white dark:text-gray-200 self-end ml-8' 
                    : msg.sender === 'ProHariAI'
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 mr-8'
                      : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                }`}
              >
                <strong>{msg.sender}:</strong> {msg.text}
              </div>
            ))}
          </div>

          {/* Text input section */}
          <form onSubmit={handleTextSubmit} className="w-full max-w-5xl mb-6">
            <div className="flex">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 rounded-l-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500"
              />
              <button
                type="submit"
                className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-r-lg transition-colors text-sm dark:bg-gray-600 dark:hover:bg-gray-700"
              >
                Send
              </button>
            </div>
          </form>

          <button
            onClick={handleMicClick}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all ${
              listening 
                ? 'animate-pulseMic bg-gray-300 border-2 border-gray-400 dark:bg-gray-700 dark:border-gray-500' 
                : 'bg-white border border-gray-300 dark:bg-gray-800 dark:border-gray-600'
            }`}
            aria-label="Voice input"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-8 w-8 ${listening ? 'text-gray-700' : 'text-gray-500'} dark:text-gray-300`}
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>

          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            {listening ? 'Listening...' : 'Tap the mic and speak or type above'}
          </p>
        </div>
      )}
    </div>
  );
}

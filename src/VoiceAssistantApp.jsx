import React, { useState, useEffect } from 'react';
import Login from './Login';
import ForgetPassword from './ForgetPassword';

const API_KEY = "AIzaSyAQeErVFkKQLcPVOgUnVThGH_niE6ZssAs;

// Define personas
const personas = [
  {
    name: 'Friendly Buddy',
    description: 'Tone: warm, supportive, casual. Style: short sentences, emojis, positive energy. Emoji use: 😊🔥✨',
    greeting: 'Hey there! 😊 Ready to chat and have some fun? What\'s up?'
  },
  {
    name: 'Strict Teacher',
    description: 'Tone: direct, serious, no-nonsense. Style: formal but concise, corrective. Emoji use: very rare or none',
    greeting: 'Greetings. I am here to provide accurate and structured responses. How may I assist you?'
  },
  {
    name: 'Sarcastic Genius',
    description: 'Tone: witty, slightly sarcastic, clever humor. Style: playful but smart, uses metaphors. Emoji use: 😏💡',
    greeting: 'Oh, look who decided to grace me with their presence. 😏 What brilliant query do you have for me today?'
  }
];

export default function VoiceAssistantApp() {
  const [messages, setMessages] = useState([]);
  const [listening, setListening] = useState(false);
  const [inputText, setInputText] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [voiceType, setVoiceType] = useState('female');
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [page, setPage] = useState('assistant');
  const [user, setUser] = useState(null);
  const [selectedPersona, setSelectedPersona] = useState(null); // Index of selected persona or null for none
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  // Check for saved theme preference or default to light mode
  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Load selected persona from localStorage
  useEffect(() => {
    const savedPersona = localStorage.getItem('selectedPersona');
    if (savedPersona !== null && savedPersona !== 'null') {
      const personaIndex = parseInt(savedPersona, 10);
      if (personaIndex >= 0 && personaIndex < personas.length) {
        setSelectedPersona(personaIndex);
      }
    } else {
      setSelectedPersona(null);
    }
  }, []);

  // Handle voice loading
  useEffect(() => {
    const handleVoicesChanged = () => {
      console.log('Voices loaded');
      setVoicesLoaded(true);
      // Test speech synthesis
      if (speechSynthesis.getVoices().length > 0) {
        console.log('Speech synthesis is working');
        // Test with a simple utterance
        const testUtterance = new SpeechSynthesisUtterance('Test');
        testUtterance.volume = 0; // Silent test
        speechSynthesis.speak(testUtterance);
      }
    };
    speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    // Also check if voices are already loaded
    if (speechSynthesis.getVoices().length > 0) {
      setVoicesLoaded(true);
      console.log('Voices already loaded');
    }
    return () => speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
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

  // Toggle voice type
  const toggleVoiceType = () => {
    const newVoiceType = voiceType === 'female' ? 'male' : 'female';
    console.log('Toggling voice from', voiceType, 'to', newVoiceType);
    setVoiceType(newVoiceType);
    // Force re-render to update icon
    setTimeout(() => {
      console.log('Current voiceType after toggle:', newVoiceType);
    }, 0);
  };

  // Handle persona selection
  const selectPersona = (index) => {
    setSelectedPersona(index);
    localStorage.setItem('selectedPersona', index === null ? 'null' : index.toString());
    // Add greeting message when persona changes (only if not null)
    if (index !== null) {
      const persona = personas[index];
      setMessages(prev => [...prev, { sender: 'ProHariAI', text: persona.greeting }]);
    }
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type (images only)
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, GIF, WebP).');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB.');
        return;
      }

      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Clear selected file
  const clearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'en-US';
  recognition.interimResults = false;

  // Add browser support message if needed
  if (!(window.SpeechRecognition || window.webkitSpeechRecognition)) {
    setMessages(prev => [...prev, { sender: 'System', text: 'Speech recognition not supported in this browser.' }]);
  }

  const speak = (text) => {
    if (!text || text.trim() === '') {
      console.log('No text to speak');
      return;
    }

    console.log('Speaking text:', text);

    // Cancel any ongoing speech first
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1;
    utterance.pitch = voiceType === 'female' ? 1.2 : 0.8;
    utterance.volume = 1;

    // Select voice based on voiceType
    const voices = speechSynthesis.getVoices();
    console.log('Available voices:', voices.map(v => ({ name: v.name, lang: v.lang })));

    // Try to find a voice that matches the voiceType, fallback to default if not found
    let selectedVoice = voices.find(voice =>
      voice.lang.startsWith('en') && voice.name.toLowerCase().includes(voiceType)
    );

    // If no specific voice found, try to find any English voice
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
    }

    console.log('Selected voice for', voiceType, ':', selectedVoice);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      console.log('Speech started');
      setIsSpeaking(true);
    };
    utterance.onend = () => {
      console.log('Speech ended');
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      setIsSpeaking(false);
    };

    try {
      speechSynthesis.speak(utterance);
      console.log('Speech synthesis initiated');
    } catch (error) {
      console.error('Error initiating speech:', error);
      setIsSpeaking(false);
    }
  };

  const stopSpeech = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const handleMicClick = () => {
    setListening(true);
    recognition.start();
  };

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedFile) return;

    // Add user message to chat
    const messageText = inputText || (selectedFile ? 'Uploaded an image' : '');
    setMessages((prev) => [...prev, { sender: 'You', text: messageText, file: selectedFile, filePreview }]);

    // Clear input field and file
    const userText = inputText;
    setInputText('');
    clearFile();

    // Get AI response
    const aiReply = await sendToGemini(userText, selectedFile);
    setMessages((prev) => [...prev, { sender: 'ProHariAI', text: aiReply.display }]);

    // Speak the response after a short delay to ensure DOM is updated
    setTimeout(() => {
      speak(aiReply.speak);
    }, 100);
  };

  recognition.onresult = async (event) => {
    const userText = event.results[0][0].transcript;
    setMessages((prev) => [...prev, { sender: 'You', text: userText }]);

    const aiReply = await sendToGemini(userText, null); // No file for voice input
    setMessages((prev) => [...prev, { sender: 'ProHariAI', text: aiReply.display }]);

    // Speak the response after a short delay
    setTimeout(() => {
      speak(aiReply.speak);
    }, 100);
    setListening(false);
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    setMessages((prev) => [...prev, { sender: 'System', text: `Speech Error: ${event.error}` }]);
    setListening(false);
  };

  const sendToGemini = async (prompt, file = null) => {
    // Check for identity questions
    const identityRegex = /who are you|what'?s your name|your name|your identity/i;
    if (identityRegex.test(prompt)) {
      return { display: "I am Pro Hari AI created by R Harinandan", speak: "I am Pro Hari AI created by R Harinandan" };
    }

    // Get current persona
    let personaPrompt = prompt;
    if (selectedPersona !== null) {
      const persona = personas[selectedPersona];
      personaPrompt = `You are currently in the ${persona.name} persona. Speak exactly in this style: ${persona.description}. ${prompt}`;
    }

    try {
      console.log('Sending request to Gemini API with prompt:', personaPrompt);

      const modelName = 'gemini-2.5-flash'; // Use a current model

      // Prepare parts for the request
      const parts = [];
      if (file) {
        // Convert file to base64
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]); // Remove data URL prefix
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        parts.push({
          inline_data: {
            mime_type: file.type,
            data: base64Data
          }
        });
      }
      parts.push({ text: personaPrompt });

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
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
          const errorMsg = "API Error: Invalid or missing API key. Please check your API key.";
          return { display: errorMsg, speak: errorMsg };
        }

        const errorMsg = `API Error: ${res.status} - ${res.statusText}`;
        return { display: errorMsg, speak: errorMsg };
      }

      const data = await res.json();
      console.log('API response data:', data);

      // Check if we have valid content in the response
      if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.warn('Unexpected API response structure:', data);
        const errorMsg = "Sorry, I couldn't understand the response.";
        return { display: errorMsg, speak: errorMsg };
      }

      const rawText = data.candidates[0].content.parts[0].text;
      const cleanedText = rawText.replace(/\*/g, '');
      const displayText = cleanedText.replace(/\n/g, '<br>');
      const speakText = cleanedText.replace(/\n/g, ' ').replace(/<[^>]*>/g, ''); // Remove any HTML tags for speech
      return { display: displayText, speak: speakText };
    } catch (error) {
      console.error('Error in sendToGemini:', error);

      // Check for network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        const errorMsg = "Network Error: Please check your internet connection.";
        return { display: errorMsg, speak: errorMsg };
      }

      const errorMsg = `Error: ${error.message || 'Unknown error occurred'}`;
      return { display: errorMsg, speak: errorMsg };
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen px-4 py-8 glow-edge ${isSpeaking && page === 'assistant' ? 'speaking-gradient' : ''}`}>
      {/* Dark mode toggle button, voice toggle button, and hamburger menu */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-2">
        <div className="flex items-center space-x-2">
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
          <button
            onClick={toggleVoiceType}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label={`Switch to ${voiceType === 'female' ? 'male' : 'female'} voice`}
            disabled={!voicesLoaded}
          >
            <span className="font-bold text-lg">
              {voiceType === 'female' ? 'F' : 'M'}
            </span>
          </button>
          {/* Persona selector button */}
          <div className="relative">
            <button
              onClick={() => setPersonaMenuOpen(!personaMenuOpen)}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              aria-label="Select persona"
            >
              <span className="font-bold text-sm">
                {selectedPersona === null ? 'Persona' : personas[selectedPersona].name.split(' ')[0]} {/* Show 'Persona' if none selected, else first word of current persona */}
              </span>
            </button>
            {/* Persona dropdown */}
            {personaMenuOpen && (
              <div className="absolute top-12 left-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg w-48 z-50">
                <ul className="flex flex-col">
                  <li
                    className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
                      selectedPersona === null ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : ''
                    }`}
                    onClick={() => {
                      selectPersona(null);
                      setPersonaMenuOpen(false);
                    }}
                  >
                    None
                  </li>
                  {personas.map((persona, index) => (
                    <li
                      key={index}
                      className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
                        selectedPersona === index ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : ''
                      }`}
                      onClick={() => {
                        selectPersona(index);
                        setPersonaMenuOpen(false);
                      }}
                    >
                      {persona.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {/* Mute button, visible only when speaking */}
          {isSpeaking && (
            <button
              onClick={stopSpeech}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              aria-label="Stop speech"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            </button>
          )}
        </div>
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
            <li
              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              onClick={() => {
                setPage('assistant');
                setMenuOpen(false);
              }}
            >
              Home
            </li>
            <li
              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              onClick={() => {
                setPage('dashboard');
                setMenuOpen(false);
              }}
            >
              Dashboard
            </li>
            <li
              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              onClick={() => {
                setPage('login');
                setMenuOpen(false);
              }}
            >
              Login
            </li>
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
          <img src="/image/logo.png" alt="ProHariAI Logo" className="h-32 w-32 rounded-full mb-4" />
          <p className="text-lg text-gray-700 dark:text-gray-300">ProHari AI created by R Harinandan</p>
          <div className="mt-6 flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              <a href="https://www.linkedin.com/in/harinandan-r-prosphere/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">LinkedIn: Visit</a>
            </div>
            <div className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              <span className="text-gray-700 dark:text-gray-300">Email: rharinandanofficial@gmail.com</span>
            </div>
          </div>
          <button
            onClick={() => setPage('assistant')}
            className="mt-6 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-700"
          >
            Back
          </button>
        </div>
      ) : page === 'dashboard' ? (
        <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8">
          <img src="/image/logo.png" alt="ProHariAI Logo" className="h-48 w-48 rounded-full mb-4" />
          <h1 className="text-3xl font-semibold mb-6 text-gray-700 dark:text-gray-200">ProHari AI by ProSphere</h1>
          <img src="/image/logo.png" alt="ProHariAI Logo" className="h-32 w-32 rounded-full mb-6" />
          <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-6 mb-6 flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">ProHari AI</h2>
            <img src="/image/logo.png" alt="ProHariAI Logo" className="h-24 w-24 rounded-full" />
          </div>
          <button
            onClick={() => setPage('assistant')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Visit Home Page
          </button>
        </div>
      ) : page === 'login' ? (
        <Login setPage={setPage} darkMode={darkMode} setUser={setUser} />
      ) : page === 'forgetPassword' ? (
        <ForgetPassword setPage={setPage} darkMode={darkMode} />
      ) : (
        <div className="flex flex-col items-center w-full">
          {user && (
            <div className="w-full max-w-5xl flex justify-between items-center mb-4">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-700 dark:text-gray-200 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  <path d="M10 7a1 1 0 100-2 1 1 0 000 2z" />
                </svg>
                <span className="text-sm text-gray-700 dark:text-gray-200">Welcome, {user.displayName || user.email}</span>
              </div>
              <button
                onClick={() => {
                  setUser(null);
                  setPage('login');
                }}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
              >
                Logout
              </button>
            </div>
          )}
          <div className="relative mb-4">
            {isSpeaking && page === 'assistant' && (
              <div className="absolute -inset-2 rounded-full animate-pulse bg-black/20 dark:bg-purple-600/50 blur-2xl"></div>
            )}
            <img src="/image/logo.png" alt="ProHariAI Logo" className="h-24 w-24 rounded-full relative" />
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold mb-6 text-gray-700 dark:text-gray-200">ProHariAI Virtual Assistant</h1>

          <div
            className="relative w-full max-w-5xl bg-white dark:bg-gray-800 p-4 h-[40rem] overflow-y-auto mb-6"
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
                <strong>{msg.sender}:</strong> <span dangerouslySetInnerHTML={{ __html: msg.text }}></span>
                {msg.filePreview && (
                  <div className="mt-2">
                    <img src={msg.filePreview} alt="Uploaded" className="max-w-48 max-h-48 rounded-lg border" />
                  </div>
                )}
              </div>
            ))}

          </div>

          {/* Text input section */}
          <form onSubmit={handleTextSubmit} className="w-full max-w-5xl mb-6">
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 min-w-0 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500"
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer transition-colors text-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload
              </label>
              <button
                type="submit"
                className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors text-sm dark:bg-gray-600 dark:hover:bg-gray-700"
              >
                Send
              </button>
            </div>
            {filePreview && (
              <div className="mt-2 flex items-center">
                <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg border mr-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">{selectedFile?.name}</span>
                <button
                  onClick={clearFile}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            )}
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

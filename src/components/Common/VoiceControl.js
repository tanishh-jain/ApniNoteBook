// VoiceControl.jsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, ArrowRight } from 'lucide-react';

const VoiceControl = () => {
  const navigate = useNavigate();
  const [listening, setListening] = useState(false);
  const [lastCommand, setLastCommand] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [componentKey, setComponentKey] = useState(0);

  // Create a stable SpeechRecognition instance via a ref
  const recognitionRef = useRef(null);
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
    } else {
      console.error("Speech Recognition API is not supported in this browser.");
    }
  }, []);

  // Enable/Disable voice control
  const confirmVoiceControl = () => {
    setShowModal(false);
    setListening(true);
  };
  const disableVoiceControl = () => {
    setListening(false);
    setLastCommand('');
    try {
      recognitionRef.current?.stop();
    } catch (error) {
      console.error("Error stopping recognition:", error);
    }
  };

  // Process voice commands for navigation and page control
  const handleVoiceCommand = (transcript) => {
    if (transcript.includes('home') || transcript.includes('go to home')) {
      navigate('/');
    } else if (transcript.includes('about') || transcript.includes('open about')) {
      navigate('/about');
    } else if (transcript.includes('contact')) {
      navigate('/contact');
    } else if (transcript.includes('login')) {
      navigate('/login');
    } else if (transcript.includes('sign up') || transcript.includes('signup')) {
      navigate('/signup');
    } else if (transcript.includes('dashboard')) {
      navigate('/dashboard');
    } else if (transcript.includes('upload note')) {
      navigate('/uploadnote');
    } else if (transcript.includes('scroll down')) {
      window.scrollBy({ top: 300, behavior: 'smooth' });
    } else if (transcript.includes('scroll up')) {
      window.scrollBy({ top: -300, behavior: 'smooth' });
    } else if (transcript.includes('scroll to top') || transcript.includes('go top')) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (transcript.includes('scroll to bottom') || transcript.includes('go bottom')) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } else if (transcript.includes('reload page')) {
      window.location.reload();
    } else if (transcript.includes('logout')) {
      alert("Logging out...");
      // Your logout logic here
    } else if (transcript.includes('off voice control')) {
      disableVoiceControl();
    } else if (transcript.includes('refresh')) {
      // "Chrome" now refreshes the VoiceControl component only
      disableVoiceControl();
      setComponentKey(prev => prev + 1);
    }
  };

  // Manage voice recognition lifecycle with useEffect
  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!listening || !recognition) return;

    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => console.log("Voice recognition started");
    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
      setLastCommand(transcript);
      handleVoiceCommand(transcript);
    };
    recognition.onend = () => {
      if (listening) {
        try {
          recognition.start();
        } catch (err) {
          console.error("Auto-restart error:", err);
        }
      }
    };

    try {
      recognition.start();
      console.log("Starting recognition...");
    } catch (err) {
      console.error("Error starting recognition:", err);
    }
    return () => {
      try {
        recognition.stop();
      } catch (error) {
        console.error("Error stopping recognition:", error);
      }
    };
  }, [listening, navigate]);

  // List of available commands with their descriptions
  const availableCommands = [
    {
      command: "Go to home",
      description: "Navigates to the home page."
    },
    {
      command: "Open about",
      description: "Navigates to the about page."
    },
    {
      command: "Contact",
      description: "Navigates to the contact page."
    },
    {
      command: "Login",
      description: "Opens the login page."
    },
    {
      command: "Sign up",
      description: "Opens the signup page."
    },
    {
      command: "Dashboard",
      description: "Navigates to the dashboard."
    },
    {
      command: "Upload note",
      description: "Navigates to the note upload page."
    },
    {
      command: "Scroll down/up",
      description: "Scrolls the page down or up."
    },
    {
      command: "Scroll to top/bottom",
      description: "Scrolls to the top or bottom of the page."
    },
    {
      command: "Reload page",
      description: "Reloads the entire page."
    },
    {
      command: "Logout",
      description: "Triggers the logout action."
    },
    {
      command: "Off voice control",
      description: "Disables voice control."
    },
    {
      command: "Refresh",
      description: "Refreshes the Voice Control component."
    }
  ];

  return (
    <div key={componentKey}>
      {/* Floating Voice Control Button */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
        <motion.button
          onClick={() => {
            if (!listening) setShowModal(true);
            else disableVoiceControl();
          }}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          className="p-4 rounded-full shadow-xl transition-colors duration-300 bg-white text-purple-600"
          title={listening ? "Disable Voice Control" : "Enable Voice Control"}
        >
          {listening ? <MicOff color="#6b21a8" size={26} /> : <Mic color="#6b21a8" size={26} />}
        </motion.button>
        <AnimatePresence>
          {listening && lastCommand && (
            <motion.div
              key="lastCommand"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-2 bg-white bg-opacity-90 text-black py-2 px-3 rounded-md text-sm shadow-md"
            >
              <span className="font-semibold">Command: </span>
              <span>{lastCommand}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal with Apni Notebook Branding */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative mx-auto w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[80vh] overflow-y-auto"
              initial={{ translateY: -50, opacity: 0 }}
              animate={{ translateY: 0, opacity: 1 }}
              exit={{ translateY: -50, opacity: 0 }}
            >
              {/* Modal Header */}
              <div className="bg-purple-700 p-6 flex-shrink-0">
                <h2 className="text-3xl font-bold text-white text-center">
                  Apni Notebook Voice Assistant
                </h2>
                <p className="mt-1 text-center text-white text-sm">
                  Control your Apni Notebook with voice commands.
                </p>
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-4 right-4 text-white hover:text-gray-300"
                  title="Close"
                >
                  <X size={26} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 bg-purple-600 flex-1">
                {/* Available Commands Section */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-yellow-500 mb-2">
                    Available Commands
                  </h3>
                  <p className="text-white text-sm mb-4">
                    Speak any of these commands to navigate or trigger actions on the website.
                  </p>
                  <ul className="space-y-3">
                    {availableCommands.map(({ command, description }, idx) => (
                      <li key={idx} className="flex flex-col text-white font-bold">
                        <div className="flex items-center space-x-2">
                          <ArrowRight size={16} className="text-yellow-500" />
                          <span>“{command}”</span>
                        </div>
                        <p className="ml-8 text-xs text-white/80">{description}</p>
                      </li>
                    ))}
                  </ul>
                </div>

              
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end p-6 bg-purple-700 flex-shrink-0">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 mr-3 text-white font-bold rounded-md hover:bg-purple-500 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmVoiceControl}
                  className="px-5 py-2 bg-yellow-500 text-white font-bold rounded-md hover:bg-yellow-600 transition duration-200"
                >
                  Enable Voice Control
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceControl;

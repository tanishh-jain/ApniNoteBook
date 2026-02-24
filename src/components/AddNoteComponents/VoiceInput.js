import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { debounce } from "lodash";
import { motion, AnimatePresence } from "framer-motion";
import { FaMicrophone, FaPause, FaPlay, FaStop } from "react-icons/fa";
import * as Tone from "tone";
import FocusLock from "react-focus-lock";

const VoiceInput = forwardRef(
  (
    {
      isPremium,
      showAlert,
      onTranscribe,
      onVoiceStateChange,
      children,
    },
    ref
  ) => {
    const [isVoiceOn, setIsVoiceOn] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [interimText, setInterimText] = useState("");
    const [transcripts, setTranscripts] = useState([]);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewText, setPreviewText] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [micPermission, setMicPermission] = useState(null);
    const [audioLevel, setAudioLevel] = useState(0);
    const [errorMessage, setErrorMessage] = useState("");
    const recognitionRef = useRef(null);
    const timeoutRef = useRef(null);
    const analyserRef = useRef(null);
    const streamRef = useRef(null);
    const modalRef = useRef(null);
    const canvasRef = useRef(null);
    const animationFrameRef = useRef(null);

    // Track voice input usage for non-premium users
    const getUsageCount = (feature) => parseInt(localStorage.getItem(`${feature}UsageCount`) || "0", 10);
    const incrementUsageCount = (feature) => {
      const count = getUsageCount(feature);
      localStorage.setItem(`${feature}UsageCount`, count + 1);
    };
    const voiceUsageReached = !isPremium && getUsageCount("voice") >= 2;

    // Check microphone permission status
    const checkMicPermission = async () => {
      if (!navigator.permissions || !navigator.permissions.query) {
        setMicPermission("prompt");
        return true;
      }
      try {
        const permission = await navigator.permissions.query({ name: "microphone" });
        setMicPermission(permission.state);
        permission.onchange = () => setMicPermission(permission.state);
        return permission.state !== "denied";
      } catch (err) {
        console.error("Permission check error:", err);
        setMicPermission("prompt");
        return true;
      }
    };

    // Initialize audio analyser for waveform visualization
    const setupAudioAnalyser = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const context = Tone.getContext();
        const source = context.createMediaStreamSource(stream);
        const analyser = context.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const updateLevel = () => {
          if (!analyserRef.current || !canvasRef.current || !isVoiceOn || isPaused) {
            setAudioLevel(0);
            animationFrameRef.current = requestAnimationFrame(updateLevel);
            return;
          }
          const dataArray = new Float32Array(analyser.fftSize);
          analyser.getFloatTimeDomainData(dataArray);
          const rms = Math.sqrt(
            dataArray.reduce((sum, value) => sum + value * value, 0) / dataArray.length
          );
          setAudioLevel(rms * 100);
          animationFrameRef.current = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      } catch (err) {
        console.error("Audio analyser error:", err);
        showAlert("Failed to initialize audio analyser.", "warning");
        setErrorMessage("Failed to initialize audio analyser.");
      }
    };

    // Sanitize transcribed text
    const cleanText = (text) => text.replace(/[^a-zA-Z0-9\s.,!?]/g, "").trim();

    // Start speech recognition
    const startRecognition = async () => {
      if (!(await checkMicPermission())) {
        showAlert("Microphone access denied. Please enable it in browser settings.", "danger");
        setErrorMessage("Microphone access denied. Please enable it in browser settings.");
        return;
      }
      if (voiceUsageReached) {
        showAlert("Your free voice input limit is reached. Please upgrade.", "warning");
        setErrorMessage("Your free voice input limit is reached. Please upgrade.");
        return;
      }
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        showAlert("Your browser does not support live speech recognition.", "danger");
        setErrorMessage("Your browser does not support live speech recognition.");
        return;
      }
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.lang = "en-US";
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsVoiceOn(true);
          setIsPaused(false);
          setTranscripts([]);
          setErrorMessage("");
          timeoutRef.current = setTimeout(() => {
            recognition.stop();
            showAlert("Speech recognition timed out. Retrying...", "warning");
            startRecognition();
          }, 10000);
        };

        recognition.onresult = (event) => {
          if (!event.results || !event.results.length) return;
          clearTimeout(timeoutRef.current);
          let interimTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const speechToText = result[0].transcript.trim();
            if (result.isFinal) {
              const cleanedText = cleanText(speechToText);
              if (cleanedText) {
                setTranscripts((prev) => [...prev, cleanedText]);
              }
            } else {
              interimTranscript += speechToText + " ";
            }
          }
          setInterimText(cleanText(interimTranscript));
          timeoutRef.current = setTimeout(() => {
            recognition.stop();
            showAlert("Speech recognition timed out. Retrying...", "warning");
            startRecognition();
          }, 10000);
        };

        recognition.onerror = (event) => {
          clearTimeout(timeoutRef.current);
          showAlert(`Speech recognition error: ${event.error || "Unknown error"}`, "danger");
          setErrorMessage(`Speech recognition error: ${event.error || "Unknown error"}`);
          setIsVoiceOn(false);
          setIsPaused(false);
        };

        recognition.onend = () => {
          clearTimeout(timeoutRef.current);
          if (isVoiceOn && !isPaused && recognitionRef.current) {
            recognition.start();
          } else {
            setIsVoiceOn(false);
            setIsPaused(false);
            if (streamRef.current) {
              streamRef.current.getTracks().forEach((track) => track.stop());
              streamRef.current = null;
            }
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
        await setupAudioAnalyser();
        if (navigator.vibrate) navigator.vibrate(50);
        if (!isPremium) incrementUsageCount("voice");
      } catch (err) {
        console.error("Recognition start error:", err);
        showAlert("Failed to start speech recognition.", "danger");
        setErrorMessage("Failed to start speech recognition.");
        setIsVoiceOn(false);
        setIsPaused(false);
      }
    };

    // Stop speech recognition and clean up resources
    const stopRecognition = () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (analyserRef.current) analyserRef.current = null;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      setIsVoiceOn(false);
      setIsPaused(false);
      setInterimText("");
      setAudioLevel(0);
      clearTimeout(timeoutRef.current);
      if (transcripts.length > 0) {
        setPreviewText(transcripts.join(" "));
        setIsPreviewOpen(true);
      }
      setIsModalOpen(false);
      if (navigator.vibrate) navigator.vibrate(50);
    };

    // Toggle voice input on or off
    const toggleVoiceInput = () => {
      if (isVoiceOn) {
        stopRecognition();
      } else {
        setIsModalOpen(true);
        startRecognition();
      }
    };

    // Toggle pause/resume for speech recognition
    const togglePause = () => {
      if (!isVoiceOn || !recognitionRef.current) return;
      if (isPaused) {
        recognitionRef.current.start();
        setIsPaused(false);
        setupAudioAnalyser(); // Reinitialize analyser for waveform
      } else {
        recognitionRef.current.stop();
        setIsPaused(true);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        if (analyserRef.current) analyserRef.current = null;
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        setAudioLevel(0);
      }
      if (navigator.vibrate) navigator.vibrate(50);
    };

    // Notify parent of voice input state changes
    useEffect(() => {
      if (onVoiceStateChange) onVoiceStateChange(isVoiceOn);
    }, [isVoiceOn, onVoiceStateChange]);

    // Initialize microphone permission check and cleanup
    useEffect(() => {
      checkMicPermission();
      return () => {
        stopRecognition();
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };
    }, []);

    // Focus modal when opened
    useEffect(() => {
      if (isModalOpen && modalRef.current) {
        setTimeout(() => modalRef.current.focus(), 0);
      }
    }, [isModalOpen]);

    // Draw dynamic waveform for audio input
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const drawWaveform = () => {
        if (!ctx || !isVoiceOn || isPaused) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          animationFrameRef.current = requestAnimationFrame(drawWaveform);
          return;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, "#9333EA");
        gradient.addColorStop(1, "#3B82F6");
        ctx.fillStyle = gradient;
        const barWidth = canvas.width / 20;
        const level = Math.min(audioLevel * 2, canvas.height);
        for (let i = 0; i < 20; i++) {
          const height = Math.sin(i * 0.3 + Date.now() * 0.002) * level * 0.5 + level * 0.5;
          ctx.fillRect(i * barWidth, canvas.height / 2 - height / 2, barWidth - 2, height);
        }
        animationFrameRef.current = requestAnimationFrame(drawWaveform);
      };
      drawWaveform();
      return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };
    }, [audioLevel, isVoiceOn, isPaused]);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      toggleVoiceInput,
      stopRecognition,
    }));

    const statusColor = isVoiceOn && !isPaused ? "#10B981" : isPaused ? "#F59E0B" : errorMessage ? "#EF4444" : "transparent";

    return (
      <>
        {children({ isVoiceOn, audioLevel, toggleVoiceInput })}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-md z-[1000] px-4"
              onClick={() => {
                if (isVoiceOn) stopRecognition();
                setIsModalOpen(false);
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="voice-modal-title"
            >
              <FocusLock>
                <motion.div
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  ref={modalRef}
                  tabIndex="-1"
                  className="relative bg-gray-900/20 backdrop-blur-xl p-6 rounded-2xl shadow-4xl w-[90vw] max-w-[360px] border border-white/10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      if (isVoiceOn) stopRecognition();
                      setIsModalOpen(false);
                    }}
                    className="absolute top-4 right-4 text-gray-300 hover:text-white transition-colors"
                    aria-label="Close voice modal"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <h2 id="voice-modal-title" className="text-lg font-semibold text-white mb-4 font-[Inter]">
                    Voice Input
                  </h2>
                  {errorMessage && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-red-600/20 backdrop-blur-md border border-red-600/30 text-white p-2 rounded-lg mb-4 flex justify-between items-center"
                    >
                      <span className="text-sm">{errorMessage}</span>
                      <button
                        onClick={() => setErrorMessage("")}
                        className="text-white hover:text-gray-300"
                        aria-label="Dismiss error"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </motion.div>
                  )}
                  <div className="space-y-4">
                    {!isVoiceOn && !isPaused ? (
                      <motion.button
                        onClick={startRecognition}
                        disabled={voiceUsageReached}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-xl disabled:opacity-50 hover:bg-purple-700 transition-colors text-sm font-[Inter] w-full min-w-[48px] shadow-[0_0_10px_rgba(147,51,234,0.5)]"
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ boxShadow: "0 0 10px rgba(147, 51, 234, 0.7)" }}
                        aria-label="Start voice input"
                        title={voiceUsageReached ? "Premium required" : "Start voice input"}
                      >
                        <FaMicrophone />
                        Start
                      </motion.button>
                    ) : (
                      <>
                        <canvas
                          ref={canvasRef}
                          width="300"
                          height="40"
                          className="w-full"
                          aria-hidden="true"
                        />
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                          className="bg-gray-800/20 backdrop-blur-md border border-white/10 p-3 rounded-lg max-h-24 overflow-y-auto text-white text-sm font-[Inter]"
                          role="status"
                          aria-live="polite"
                        >
                          {interimText || (
                            <span className="animate-pulse">
                              Listening
                              <span className="inline-block animate-[pulse_1s_infinite_0.2s]">.</span>
                              <span className="inline-block animate-[pulse_1s_infinite_0.4s]">.</span>
                              <span className="inline-block animate-[pulse_1s_infinite_0.6s]">.</span>
                            </span>
                          )}
                        </motion.div>
                        <div className="flex gap-2 justify-center max-sm:flex-col max-sm:gap-3">
                          <motion.button
                            onClick={togglePause}
                            disabled={!isVoiceOn}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 text-white rounded-xl disabled:opacity-50 hover:bg-yellow-700 transition-colors text-sm font-[Inter] min-w-[48px] shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                            whileTap={{ scale: 0.95 }}
                            whileHover={{ boxShadow: "0 0 10px rgba(245, 158, 11, 0.7)" }}
                            aria-label={isPaused ? "Resume voice input" : "Pause voice input"}
                            title="Pause or resume voice input"
                          >
                            {isPaused ? <FaPlay /> : <FaPause />}
                            {isPaused ? "Resume" : "Pause"}
                          </motion.button>
                          <motion.button
                            onClick={stopRecognition}
                            disabled={!isVoiceOn}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl disabled:opacity-50 hover:bg-red-700 transition-colors text-sm font-[Inter] min-w-[48px] shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                            whileTap={{ scale: 0.95 }}
                            whileHover={{ boxShadow: "0 0 10px rgba(239, 68, 68, 0.7)" }}
                            aria-label="Stop voice input"
                            title="Stop voice input"
                          >
                            <FaStop />
                            Stop
                          </motion.button>
                        </div>
                      </>
                    )}
                    <div
                      className="h-3 rounded-b-2xl"
                      style={{ backgroundColor: statusColor }}
                      role="status"
                      aria-live="polite"
                    >
                      <span className="sr-only">
                        {micPermission === "denied"
                          ? "Microphone access denied"
                          : isVoiceOn && !isPaused
                          ? "Listening in English"
                          : isPaused
                          ? "Paused"
                          : errorMessage || ""}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </FocusLock>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {isPreviewOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-md z-[1000] px-4"
              onClick={() => setIsPreviewOpen(false)}
              role="dialog"
              aria-modal="true"
              aria-labelledby="preview-modal-title"
            >
              <FocusLock>
                <motion.div
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="relative bg-gray-900/20 backdrop-blur-xl p-6 rounded-2xl shadow-4xl w-[90vw] max-w-[480px] border border-white/10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setIsPreviewOpen(false)}
                    className="absolute top-4 right-4 text-gray-300 hover:text-white transition-colors"
                    aria-label="Close preview modal"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <h2 id="preview-modal-title" className="text-lg font-semibold text-white mb-4 font-[Inter]">
                    Preview Transcription
                  </h2>
                  <textarea
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    className="w-full h-40 p-2 bg-gray-800/20 backdrop-blur-md text-white rounded-lg resize-none focus:border-purple-500/30 focus:ring-2 focus:ring-purple-500/50 font-[Inter] text-sm"
                    aria-label="Edit transcribed text"
                  />
                  <div className="text-gray-400 text-xs mt-1 font-[Inter]">
                    {previewText.length}/1000 characters
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <motion.button
                      onClick={() => {
                        onTranscribe(previewText);
                        setIsPreviewOpen(false);
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-sm font-[Inter] shadow-[0_0_10px_rgba(147,51,234,0.5)]"
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ boxShadow: "0 0 10px rgba(147, 51, 234, 0.7)" }}
                    >
                      Add to Note
                    </motion.button>
                    <motion.button
                      onClick={() => setIsPreviewOpen(false)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors text-sm font-[Inter] shadow-[0_0_10px_rgba(107,114,128,0.5)]"
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ boxShadow: "0 0 10px rgba(107, 114, 128, 0.7)" }}
                    >
                      Cancel
                    </motion.button>
                  </div>
                </motion.div>
              </FocusLock>
            </motion.div>
          )}
        </AnimatePresence>
        <style jsx>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          .animate-pulse {
            animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          .shadow-4xl {
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }
        `}</style>
      </>
    );
  }
);

export default VoiceInput;
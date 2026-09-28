import { useState, useRef, useEffect, useCallback } from "react";

/**
 * Custom hook providing speech-to-text functionality using the browser's Web Speech API.
 * Configured specifically for Indian English ('en-IN'), with interim results and non-continuous mode.
 *
 * @param {Object} options
 * @param {Function} options.onTranscript - Callback invoked with the updated text transcript
 * @param {Function} [options.onError] - Optional callback when a recognition error occurs
 */
export const useSpeechToText = ({ onTranscript, onError } = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState(() => {
    if (typeof window === "undefined") return null;
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    return SpeechRecognition ? null : "Voice input works in Chrome/Edge";
  });

  const recognitionRef = useRef(null);
  const baseTextRef = useRef("");
  const errorTimeoutRef = useRef(null);

  const isSupported =
    typeof window !== "undefined" &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const clearError = useCallback(() => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    // Retain unsupported message if browser doesn't support the API
    if (!isSupported) {
      setErrorMessage("Voice input works in Chrome/Edge");
    } else {
      setErrorMessage(null);
    }
  }, [isSupported]);

  const setErrorWithTimeout = useCallback(
    (msg) => {
      setErrorMessage(msg);
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      if (msg && msg !== "Voice input works in Chrome/Edge") {
        errorTimeoutRef.current = setTimeout(() => {
          setErrorMessage(null);
        }, 4000);
      }
    },
    []
  );

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore already stopped state
        }
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(
    (currentText = "") => {
      if (!isSupported) {
        setErrorWithTimeout("Voice input works in Chrome/Edge");
        return;
      }

      // Stop any existing instance
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }

      clearError();
      baseTextRef.current = (currentText || "").trim();

      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      try {
        const recognition = new SpeechRecognition();
        recognition.lang = "en-IN";
        recognition.interimResults = true;
        recognition.continuous = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
          clearError();
        };

        recognition.onresult = (event) => {
          let sessionTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            sessionTranscript += event.results[i][0].transcript;
          }

          const base = baseTextRef.current;
          const speech = sessionTranscript.trimStart();
          const combined = base ? (speech ? `${base} ${speech}` : base) : speech;

          if (onTranscript) {
            onTranscript(combined);
          }
        };

        recognition.onerror = (event) => {
          if (event.error === "aborted") {
            setIsListening(false);
            return;
          }

          let message = "Voice input error. Please try again.";
          if (
            event.error === "not-allowed" ||
            event.error === "service-not-allowed"
          ) {
            message = "Microphone access denied";
          } else if (event.error === "no-speech") {
            message = "No speech detected";
          } else if (event.error === "network") {
            message = "Network error";
          }

          setErrorWithTimeout(message);
          setIsListening(false);

          if (onError) {
            onError(message, event.error);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          recognitionRef.current = null;
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.error("SpeechRecognition start failed:", err);
        setErrorWithTimeout("Could not start voice input");
        setIsListening(false);
      }
    },
    [isSupported, clearError, setErrorWithTimeout, onTranscript, onError]
  );

  const toggleListening = useCallback(
    (currentText = "") => {
      if (isListening) {
        stopListening();
      } else {
        startListening(currentText);
      }
    },
    [isListening, startListening, stopListening]
  );

  // Clean up recognition instance and timer on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    errorMessage,
    startListening,
    stopListening,
    toggleListening,
    clearError,
  };
};

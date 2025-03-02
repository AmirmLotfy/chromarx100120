
/// <reference types="vite/client" />
/// <reference types="chrome"/>

interface Window {
  SpeechRecognition?: typeof SpeechRecognition;
  webkitSpeechRecognition?: typeof SpeechRecognition;
}

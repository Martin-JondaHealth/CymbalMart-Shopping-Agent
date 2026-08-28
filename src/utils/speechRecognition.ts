// Speech recognition & synthesis utilities for hands-free voice control

export interface SpeechRecognitionHookOptions {
  onTranscript: (transcript: string, isFinal: boolean) => void;
  onCommand: (command: string) => void;
  onError?: (error: string) => void;
  onListeningChange?: (isListening: boolean) => void;
  wakeWordEnabled?: boolean;
}

export class VoiceController {
  private recognition: any = null;
  private isListening: boolean = false;
  private shouldKeepListening: boolean = false;
  private onTranscriptCallback: ((transcript: string, isFinal: boolean) => void) | null = null;
  private onCommandCallback: ((command: string) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private onListeningChangeCallback: ((isListening: boolean) => void) | null = null;
  private wakeWordEnabled: boolean = false;
  private speechSynth: SpeechSynthesis | null = null;
  private isSpeaking: boolean = false;
  public ttsEnabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.setupRecognitionListeners();
      }

      if ('speechSynthesis' in window) {
        this.speechSynth = window.speechSynthesis;
      }
    }
  }

  public isSupported(): boolean {
    return Boolean(this.recognition);
  }

  private setupRecognitionListeners() {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.onListeningChangeCallback?.(true);
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const activeText = finalTranscript || interimTranscript;
      if (activeText) {
        this.onTranscriptCallback?.(activeText, Boolean(finalTranscript));
      }

      if (finalTranscript) {
        const trimmed = finalTranscript.trim();
        if (this.wakeWordEnabled) {
          const lower = trimmed.toLowerCase();
          const wakeWords = ['hey cymbal', 'cymbal', 'cymbalmart', 'hey assistant', 'ok cymbal'];
          const matchedWake = wakeWords.find((w) => lower.startsWith(w) || lower.includes(w));
          if (matchedWake) {
            const commandAfterWake = lower.replace(matchedWake, '').trim();
            if (commandAfterWake) {
              this.onCommandCallback?.(commandAfterWake);
            } else {
              this.speak("I'm listening! What would you like to do?");
            }
          }
        } else {
          this.onCommandCallback?.(trimmed);
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        this.shouldKeepListening = false;
        this.isListening = false;
        this.onListeningChangeCallback?.(false);
        this.onErrorCallback?.('Microphone permission denied. Please allow mic access.');
      } else if (event.error === 'no-speech') {
        // Normal silence timeout, will auto-restart if shouldKeepListening
      } else {
        this.onErrorCallback?.(`Voice error: ${event.error}`);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onListeningChangeCallback?.(false);
      // Auto-restart if in hands-free continuous mode
      if (this.shouldKeepListening) {
        try {
          setTimeout(() => {
            if (this.shouldKeepListening && !this.isListening) {
              this.recognition?.start();
            }
          }, 300);
        } catch {
          // Ignore
        }
      }
    };
  }

  public startListening(options: {
    continuous?: boolean;
    wakeWord?: boolean;
    onTranscript?: (text: string, isFinal: boolean) => void;
    onCommand?: (command: string) => void;
    onError?: (error: string) => void;
    onListeningChange?: (listening: boolean) => void;
  }) {
    if (!this.recognition) {
      options.onError?.('Speech recognition is not supported in this browser. You can still test voice commands via simulated input!');
      return;
    }

    this.shouldKeepListening = options.continuous ?? true;
    this.wakeWordEnabled = options.wakeWord ?? false;

    if (options.onTranscript) this.onTranscriptCallback = options.onTranscript;
    if (options.onCommand) this.onCommandCallback = options.onCommand;
    if (options.onError) this.onErrorCallback = options.onError;
    if (options.onListeningChange) this.onListeningChangeCallback = options.onListeningChange;

    try {
      this.recognition.start();
    } catch {
      // Already running or starting
    }
  }

  public stopListening() {
    this.shouldKeepListening = false;
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
    }
    this.isListening = false;
    this.onListeningChangeCallback?.(false);
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  // Text-To-Speech Output
  public speak(text: string, onEnd?: () => void) {
    if (!this.ttsEnabled || !this.speechSynth || typeof window === 'undefined') {
      onEnd?.();
      return;
    }

    try {
      // Clean markdown tags like **bold** before speaking
      const cleanText = text.replace(/\*\*/g, '').replace(/•/g, '').replace(/#/g, '').replace(/`/g, '');

      this.speechSynth.cancel(); // cancel any active speech
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      // Select an engaging natural English voice if available
      const voices = this.speechSynth.getVoices();
      const preferredVoice = voices.find(
        (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Karen'))
      ) || voices.find((v) => v.lang.startsWith('en'));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      this.isSpeaking = true;
      utterance.onend = () => {
        this.isSpeaking = false;
        onEnd?.();
      };
      utterance.onerror = () => {
        this.isSpeaking = false;
        onEnd?.();
      };

      this.speechSynth.speak(utterance);
    } catch (e) {
      console.warn('TTS error:', e);
      this.isSpeaking = false;
      onEnd?.();
    }
  }

  public stopSpeaking() {
    if (this.speechSynth) {
      this.speechSynth.cancel();
      this.isSpeaking = false;
    }
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
}

export const voiceController = new VoiceController();

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  HelpCircle,
  X,
  ChevronUp,
  ChevronDown,
  Radio,
  CheckCircle2,
  AlertCircle,
  Layers,
  ShoppingBag,
  Zap,
  Play,
  RotateCcw,
} from 'lucide-react';
import { soundFX } from '../utils/soundEffects';
import { voiceController } from '../utils/speechRecognition';

interface VoiceControlHUDProps {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  liveTranscript: string;
  lastCommand: string;
  lastResponse: string;
  ttsMuted: boolean;
  onToggleListening: () => void;
  onToggleTtsMute: () => void;
  onExecuteSimulatedCommand: (command: string) => void;
  currentView: string;
}

export const VoiceControlHUD: React.FC<VoiceControlHUDProps> = ({
  isListening,
  isProcessing,
  isSpeaking,
  liveTranscript,
  lastCommand,
  lastResponse,
  ttsMuted,
  onToggleListening,
  onToggleTtsMute,
  onExecuteSimulatedCommand,
  currentView,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showCheatSheet, setShowCheatSheet] = useState<boolean>(false);
  const [customInput, setCustomInput] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // Animate audio waveform when listening
  useEffect(() => {
    let interval: any;
    if (isListening || isSpeaking) {
      interval = setInterval(() => {
        setAudioLevel(Math.floor(Math.random() * 80) + 20);
      }, 100);
    } else {
      setAudioLevel(0);
    }
    return () => clearInterval(interval);
  }, [isListening, isSpeaking]);

  const quickVoiceActions = [
    { label: '🛍️ Take Me to Checkout', cmd: 'Take me to check out please' },
    { label: '🍕 Add Pizza Platter', cmd: 'Add 2 packs of Gourmet Mini Pizza Bagels' },
    { label: '✨ Optimize Budget', cmd: 'Optimize budget to value tier' },
    { label: '🥩 Check Portions', cmd: 'Open portion guide for guests' },
    { label: '🥤 Filter Drinks', cmd: 'Filter by drinks' },
    { label: '🔥 Load BBQ Pack', cmd: 'Load backyard BBQ preset' },
  ];

  const handleSimulate = (cmd: string) => {
    soundFX.playListeningStart();
    onExecuteSimulatedCommand(cmd);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    handleSimulate(customInput.trim());
    setCustomInput('');
  };

  return (
    <>
      {/* Floating Hands-Free Voice Control Bar */}
      <div
        id="voice-control-hud"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl transition-all duration-300 ease-in-out"
      >
        <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden p-3 sm:p-4">
          {/* Main Top Bar */}
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Mic Activation Button & State Indicator */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                id="toggle-voice-mic-btn"
                onClick={onToggleListening}
                className={`relative p-3 rounded-xl font-bold flex items-center justify-center transition-all ${
                  isListening
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 animate-pulse'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                }`}
                title={isListening ? 'Stop Voice Listening' : 'Start Hands-Free Voice Control'}
              >
                {isListening ? (
                  <Mic className="w-5 h-5 animate-bounce" />
                ) : (
                  <MicOff className="w-5 h-5 text-emerald-100" />
                )}
                {isListening && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                  </span>
                )}
              </button>

              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-xs sm:text-sm tracking-tight text-white flex items-center space-x-1.5">
                    <span>Hands-Free Voice Control</span>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        isListening
                          ? 'bg-rose-950 text-rose-300 border-rose-800'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {isListening ? 'Listening Live' : 'Voice Standby'}
                    </span>
                  </span>
                </div>

                {/* Animated Audio Waveform */}
                <div className="flex items-center space-x-1.5 mt-1">
                  {isListening || isSpeaking ? (
                    <div className="flex items-center space-x-1 h-3">
                      <div
                        className="w-1 bg-emerald-400 rounded-full transition-all duration-100"
                        style={{ height: `${Math.max(4, audioLevel * 0.2)}px` }}
                      />
                      <div
                        className="w-1 bg-emerald-400 rounded-full transition-all duration-100"
                        style={{ height: `${Math.max(4, audioLevel * 0.4)}px` }}
                      />
                      <div
                        className="w-1 bg-emerald-300 rounded-full transition-all duration-100"
                        style={{ height: `${Math.max(4, audioLevel * 0.6)}px` }}
                      />
                      <div
                        className="w-1 bg-emerald-400 rounded-full transition-all duration-100"
                        style={{ height: `${Math.max(4, audioLevel * 0.3)}px` }}
                      />
                      <span className="text-[10px] text-emerald-300 font-medium ml-1">
                        {isSpeaking ? 'Assistant speaking...' : 'Listening for commands...'}
                      </span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-xs">
                      Tap mic to talk hands-free (or test phrases below)
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* TTS Mute Toggle */}
              <button
                type="button"
                id="toggle-voice-audio-btn"
                onClick={onToggleTtsMute}
                className={`p-2 rounded-lg text-xs font-semibold border transition ${
                  ttsMuted
                    ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    : 'bg-emerald-950/80 border-emerald-800 text-emerald-300 hover:bg-emerald-900/80'
                }`}
                title={ttsMuted ? 'Unmute Audio Speech Responses' : 'Mute Audio Speech Responses'}
              >
                {ttsMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Voice Cheat Sheet Guide */}
              <button
                type="button"
                id="voice-cheatsheet-btn"
                onClick={() => setShowCheatSheet(true)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
                title="Voice Command Examples & Guide"
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              {/* Expand / Collapse Tray */}
              <button
                type="button"
                id="expand-voice-tray-btn"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
                title={isExpanded ? 'Collapse Voice Tray' : 'Expand Voice Tray'}
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Real-time Live Transcript & Response Feed */}
          {(liveTranscript || lastResponse || isProcessing) && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-800 text-xs">
              {isProcessing && (
                <div className="flex items-center space-x-2 text-emerald-400 py-1 font-medium animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Processing voice command with AI...</span>
                </div>
              )}

              {liveTranscript && (
                <div className="flex items-start space-x-2 text-slate-200 bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider shrink-0 mt-0.5">
                    Heard:
                  </span>
                  <span className="font-semibold italic">"{liveTranscript}"</span>
                </div>
              )}

              {lastResponse && !isProcessing && (
                <div className="flex items-start space-x-2 text-slate-100 bg-emerald-950/60 p-2 rounded-lg border border-emerald-800/60 mt-1.5">
                  <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider shrink-0 mt-0.5">
                    Assistant:
                  </span>
                  <span className="text-[11px] leading-relaxed">{lastResponse}</span>
                </div>
              )}
            </div>
          )}

          {/* Expanded Drawer: Quick Test Phrases & Manual Input */}
          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-slate-800 space-y-3 animate-in fade-in duration-150">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  1-Click Hands-Free Voice Simulations:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {quickVoiceActions.map((qa, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSimulate(qa.cmd)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-900/80 hover:text-emerald-200 border border-slate-700 text-slate-300 font-medium transition"
                    >
                      {qa.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Voice Text Input */}
              <form onSubmit={handleManualSubmit} className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder='Try typing: "Add 2 packs of soda" or "Go to checkout"...'
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!customInput.trim()}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition disabled:opacity-40"
                >
                  Run Command
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Voice Command Cheat Sheet Modal */}
      {showCheatSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Mic className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Hands-Free Voice Command Guide</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCheatSheet(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
              <p className="text-slate-600 text-sm">
                Control the entire party planning and shopping process hands-free. Speak naturally, or try any of these commands:
              </p>

              {/* Categories */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-900 flex items-center space-x-1.5 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>1. Event Setup & Plans</span>
                  </h4>
                  <ul className="space-y-1 text-slate-600">
                    <li>• "Plan a BBQ party for 16 guests"</li>
                    <li>• "Set budget to 250 dollars"</li>
                    <li>• "Set guest count to 20"</li>
                    <li>• "Load Kids Birthday party pack"</li>
                    <li>• "Generate my shopping list"</li>
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-900 flex items-center space-x-1.5 mb-2">
                    <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>2. Cart & Item Modifications</span>
                  </h4>
                  <ul className="space-y-1 text-slate-600">
                    <li>• "Add 2 packs of hamburger buns"</li>
                    <li>• "Add sparkling apple cider"</li>
                    <li>• "Remove party ice"</li>
                    <li>• "Increase burger patties to 4"</li>
                    <li>• "Swap beef burgers to budget tier"</li>
                    <li>• "Upgrade everything to premium"</li>
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-900 flex items-center space-x-1.5 mb-2">
                    <Zap className="w-3.5 h-3.5 text-emerald-600" />
                    <span>3. Budget & Portions</span>
                  </h4>
                  <ul className="space-y-1 text-slate-600">
                    <li>• "Optimize my shopping budget"</li>
                    <li>• "Switch to Cymbal Everyday brand"</li>
                    <li>• "Open portion guide for 16 people"</li>
                    <li>• "What is my current total?"</li>
                    <li>• "How much meat do I need?"</li>
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-900 flex items-center space-x-1.5 mb-2">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    <span>4. Navigation & Checkout</span>
                  </h4>
                  <ul className="space-y-1 text-slate-600">
                    <li>• "Filter by drinks" or "Show food"</li>
                    <li>• "Sort list by store aisle"</li>
                    <li>• "Go to checkout"</li>
                    <li>• "Select curbside pickup"</li>
                    <li>• "Place my order"</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCheatSheet(false)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
              >
                Got It, Let's Plan!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

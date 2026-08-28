import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, Plus, Check, Undo2, X, MessageSquare, ChevronDown, ChevronUp, ShoppingBag, ArrowRight } from 'lucide-react';
import { ChatMessage, AIProposedAction, ShoppingItem, PartyEvent, BudgetMetrics } from '../types';

interface CymbalMartAssistantChatProps {
  currentEvent: PartyEvent;
  currentItems: ShoppingItem[];
  metrics: BudgetMetrics;
  onApplyAction: (action: AIProposedAction) => void;
  onUndoAction?: (action: AIProposedAction) => void;
}

export const CymbalMartAssistantChat: React.FC<CymbalMartAssistantChatProps> = ({
  currentEvent,
  currentItems,
  metrics,
  onApplyAction,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: `Hello! I'm your **CymbalMart Assistant** 🛒. I can help you portion food, suggest recipes, accommodate dietary needs, or adjust your list to stay within your $${currentEvent.targetBudget} budget. What would you like to tweak?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [appliedActionIds, setAppliedActionIds] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const quickPrompts = [
    '⚖️ Check food & drink portions',
    '💰 How can I save $25 on this list?',
    '🥑 Add vegan & gluten-free appetizer',
    '🍹 Suggest a signature party mocktail recipe',
    '🎉 Add party games for our guests',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationHistory: messages,
          currentEvent,
          currentItems,
          metrics,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMsg: ChatMessage = {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          proposedActions: data.proposedActions || [],
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error(data.error || 'Failed to get answer');
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `I'm here to help! For ${currentEvent.guestCount} guests, your current total is $${metrics.finalTotal.toFixed(2)}. Feel free to ask for budget trimming, portion estimates, or custom party items!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteAction = (action: AIProposedAction, actionIndex: number, msgId: string) => {
    const actionKey = `${msgId}-${actionIndex}`;
    onApplyAction(action);
    setAppliedActionIds((prev) => [...prev, actionKey]);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[580px] sticky top-20">
      {/* Header */}
      <div className="px-4 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-900 rounded-full" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="font-bold text-sm text-white">CymbalMart Assistant</h3>
              <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded-sm border border-emerald-800/80">
                AI Agent
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Live List & Budget Copilot</p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
            metrics.isOverBudget
              ? 'text-rose-300 bg-rose-950/80 border-rose-800'
              : 'text-emerald-300 bg-emerald-950/80 border-emerald-800'
          }`}>
            {metrics.isOverBudget ? 'Over Budget' : 'Budget On Track'}
          </span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[92%] ${
                isUser ? 'ml-auto' : 'mr-auto'
              }`}
            >
              <div
                className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-br-xs shadow-xs'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs shadow-xs'
                }`}
              >
                {/* Parse simple markdown bold / bullet points */}
                <div className="whitespace-pre-line">
                  {msg.text.split('\n').map((line, lIdx) => (
                    <p key={lIdx} className={line.startsWith('•') || line.startsWith('-') ? 'ml-2 my-0.5' : 'my-0.5'}>
                      {line}
                    </p>
                  ))}
                </div>

                {/* Proposed Action Cards */}
                {msg.proposedActions && msg.proposedActions.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                      Recommended Shopping List Update:
                    </span>
                    {msg.proposedActions.map((action, aIdx) => {
                      const actionKey = `${msg.id}-${aIdx}`;
                      const isApplied = appliedActionIds.includes(actionKey);

                      return (
                        <div
                          key={aIdx}
                          className={`p-2.5 rounded-xl border transition text-xs ${
                            isApplied
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                              : 'bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-bold block text-slate-900">
                                {action.description}
                              </span>
                              {action.item && (
                                <span className="text-[11px] text-slate-600 block mt-0.5">
                                  ${action.item.unitPrice?.toFixed(2)} x {action.item.quantity || 1} ({action.item.brand})
                                </span>
                              )}
                              {action.savingsAmount && (
                                <span className="text-[11px] font-bold text-emerald-700 block mt-0.5">
                                  Estimated Savings: -${action.savingsAmount.toFixed(2)}
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              id={`apply-action-btn-${aIdx}`}
                              disabled={isApplied}
                              onClick={() => handleExecuteAction(action, aIdx, msg.id)}
                              className={`shrink-0 px-2.5 py-1 rounded-lg font-bold text-[11px] transition flex items-center space-x-1 ${
                                isApplied
                                  ? 'bg-emerald-600 text-white cursor-default'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs'
                              }`}
                            >
                              {isApplied ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Applied</span>
                                </>
                              ) : action.type === 'navigate_checkout' ? (
                                <>
                                  <ShoppingBag className="w-3 h-3" />
                                  <span>Open Checkout</span>
                                </>
                              ) : action.type === 'open_portions' ? (
                                <>
                                  <Sparkles className="w-3 h-3" />
                                  <span>View Portions</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3 h-3" />
                                  <span>Apply to Cart</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center space-x-2 text-slate-500 text-xs py-2 bg-white px-3.5 rounded-xl border border-slate-200 w-fit">
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
            <span className="text-[11px] font-medium">Assistant is planning...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Chips */}
      <div className="px-3 py-2 bg-white border-t border-slate-100 overflow-x-auto scrollbar-none flex gap-1.5">
        {quickPrompts.map((prompt, pIdx) => (
          <button
            key={pIdx}
            type="button"
            onClick={() => handleSendMessage(prompt)}
            disabled={isLoading}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200 text-slate-700 font-semibold whitespace-nowrap transition"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2"
        >
          <input
            id="chat-assistant-input"
            type="text"
            placeholder="Ask CymbalMart Assistant to adjust list, portions, or budget..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isLoading}
            className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <button
            type="submit"
            id="send-chat-btn"
            disabled={!inputMessage.trim() || isLoading}
            className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

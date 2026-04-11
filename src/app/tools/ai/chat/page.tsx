'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, ArrowLeft, Brain, Globe, Sparkles, Trash2, MessageSquare, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { marked } from 'marked';
import styles from './AIChat.module.scss';
import { useChatStore, ChatMessage } from '@/store/chat-store';

export default function AIChatPage() {
  const { messages, addMessage, clearHistory, setMessages } = useChatStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinkingEnabled, setIsThinkingEnabled] = useState(false);
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const cleanContent = (content: string) => {
    // Remove <details> metadata blocks from the visible UI
    return content.replace(/<details>[\s\S]*?<\/details>/g, '').trim();
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { 
      role: 'user', 
      content: input,
      timestamp: Date.now()
    };
    
    addMessage(userMessage);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/qwen/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen-max-latest',
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          stream: true,
          enable_thinking: isThinkingEnabled,
          thinking_budget: isThinkingEnabled ? 30000 : undefined,
          tools: isWebSearchEnabled ? [{ type: 'web_search' }] : undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to connect to AI');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader found');

      const decoder = new TextDecoder();
      let assistantMessage: ChatMessage = { 
        role: 'assistant', 
        content: '', 
        thinking: '',
        timestamp: Date.now() 
      };

      // Create a temp state for streaming
      let streamingContent = '';
      let streamingThinking = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') continue;

            try {
              const data = JSON.parse(dataStr);
              const delta = data.choices[0].delta;

              if (delta.reasoning_content) {
                streamingThinking += delta.reasoning_content;
              }
              if (delta.content) {
                streamingContent += delta.content;
              }

              // Update the last message in store (we'll replace it at the end for persistence)
              // But for UI fluidity, we'll use a local state or just handle it carefully
              assistantMessage.content = streamingContent;
              assistantMessage.thinking = streamingThinking;
              
              // To trigger UI update, we update the store's last message
              // Better: use a local state for the active generation
              setMessages([...messages, userMessage, assistantMessage]);
            } catch (e) {}
          }
        }
      }
    } catch (error) {
      console.error('Chat Error:', error);
      addMessage({ 
        role: 'assistant', 
        content: 'Sorry, I encountered an error connecting to the AI.',
        timestamp: Date.now() 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.chatPage}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <Link href="/tools/ai" className={styles.backBtn}>
            <ArrowLeft size={20} />
          </Link>
          <div className={styles.headerTitle}>
            <Bot size={24} className={styles.icon} />
            <h1>AI Chat</h1>
          </div>
        </div>
        <div className={styles.headerActions}>
           <button 
            className={styles.clearBtn} 
            onClick={() => { if(confirm('Clear history?')) clearHistory(); }}
            title="Clear History"
           >
              <Trash2 size={16} />
           </button>
           <div className={styles.modelBadge}>
              <Sparkles size={12} />
              <span>Qwen Max</span>
           </div>
        </div>
      </header>

      <div className={styles.chatContainer} ref={scrollRef}>
        <div className={styles.messageList}>
          {messages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={styles.welcome}
            >
              <div className={styles.heroGlow} />
              <Bot size={48} className={styles.welcomeIcon} />
              <h2>How can I help?</h2>
              
              <div className={styles.suggestions}>
                <button onClick={() => setInput("Solve x^2 + 5x + 6 = 0")}>
                  <Sparkles size={14} /> Solve math
                </button>
                <button onClick={() => setInput("Latest AI news?")}>
                  <Globe size={14} /> AI News
                </button>
                <button onClick={() => setInput("Write a React hook")}>
                  <MessageSquare size={14} /> Write code
                </button>
              </div>
            </motion.div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${styles.message} ${styles[msg.role]}`}
            >
              {msg.role === 'assistant' && (
                <div className={`${styles.avatar} ${styles.assistantIcon}`}>
                  <Bot size={18} />
                </div>
              )}
              <div className={styles.messageBody}>
                {msg.thinking && (
                    <div className={styles.thinkingArea}>
                      <div className={styles.thinkingHeader}>
                        <Brain size={12} className={styles.spin} />
                        <span>AI Reasoning Process</span>
                      </div>
                      <div className={styles.thinkingContent}>{msg.thinking}</div>
                    </div>
                )}
                {msg.content && (
                  <div 
                    className={styles.content}
                    dangerouslySetInnerHTML={{ __html: marked.parse(cleanContent(msg.content)) as string }}
                  />
                )}
              </div>
            </motion.div>
          ))}

          {isLoading && !messages[messages.length - 1]?.content && !messages[messages.length - 1]?.thinking && (
            <div className={`${styles.message} ${styles.assistant}`}>
              <div className={`${styles.avatar} ${styles.assistantIcon}`}>
                <Bot size={18} />
              </div>
              <div className={styles.thinkingLoader}>
                <div className={styles.loaderPulse} />
                <Brain size={16} className={styles.pulseIcon} />
                <span>AI is thinking...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.inputWrapper}>
        <div className={styles.inputArea}>
          <div className={styles.controls}>
            <button 
              className={`${styles.controlBtn} ${isThinkingEnabled ? styles.active : ''}`}
              onClick={() => setIsThinkingEnabled(!isThinkingEnabled)}
            >
              <Brain size={14} />
              <span>Thinking Mode</span>
            </button>
            <button 
              className={`${styles.controlBtn} ${isWebSearchEnabled ? styles.active : ''}`}
              onClick={() => setIsWebSearchEnabled(!isWebSearchEnabled)}
            >
              <Globe size={14} />
              <span>Web Search</span>
            </button>
          </div>
          <div className={styles.mainInput}>
            <textarea
              ref={textareaRef}
              placeholder="Ask anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button 
              className={styles.sendBtn} 
              disabled={!input.trim() || isLoading}
              onClick={handleSend}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

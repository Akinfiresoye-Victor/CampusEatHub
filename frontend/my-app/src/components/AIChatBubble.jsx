import { useState, useRef, useEffect } from 'react'
import { Bot, User, X, Send, UtensilsCrossed, ShoppingBag, Package, Wallet } from 'lucide-react'

const QUICK_ACTIONS = [
  { label: 'Meal Recommender', icon: <UtensilsCrossed size={13} />, prompt: 'I need meal recommendations within my budget. What can I eat today on campus?' },
  { label: 'Browse Products', icon: <ShoppingBag size={13} />, prompt: 'Show me available products on campus' },
  { label: 'Track Orders', icon: <Package size={13} />, prompt: 'Show my recent orders and their status' },
  { label: 'Spending Summary', icon: <Wallet size={13} />, prompt: 'Give me a summary of my spending history' },
]

const INITIAL_MESSAGE = {
  id: 1,
  role: 'assistant',
  text: "Hey there! 👋 I'm your CampusConnect AI Assistant.\n\nI can help you find products, get meal recommendations within your budget, check cafeteria menus, track orders, and more!\n\nWhat would you like to do today?",
  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
}

export default function AIChatBubble() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pulse, setPulse] = useState(true)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300)
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [open])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 4000)
    return () => clearTimeout(t)
  }, [])

  const sendMessage = async (text) => {
    const userText = text || input.trim()
    if (!userText || loading) return

    setInput('')
    const userMsg = {
      id: Date.now(),
      role: 'user',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const response = await fetch('http://localhost:8000/api/student/ai/meal_recommender/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ question: userText }),
      })
      const data = await response.json()
      const replyText =
        data.success
          ? data.recommendation
          : (data.error || "Sorry, I couldn't process that. Please try again.")
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          text: 'Oops! Something went wrong. Please try again. 😅',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .ai-chat-wrapper * {
          box-sizing: border-box;
          font-family: 'Plus Jakarta Sans', 'Segoe UI', sans-serif;
        }

        .ai-fab {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          border-radius: 50%;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 1000;
          box-shadow: 0 6px 28px rgba(79,70,229,0.5);
          transition: transform 0.25s cubic-bezier(.34,1.56,.64,1), box-shadow 0.25s;
          color: white;
        }
        .ai-fab:hover {
          transform: scale(1.12);
          box-shadow: 0 10px 35px rgba(79,70,229,0.6);
        }
        .ai-fab.open-state {
          transform: scale(0.9) rotate(15deg);
        }
        .ai-fab.ai-fab-pulse::after {
          content: '';
          position: absolute;
          top: -4px;
          right: -4px;
          width: 18px;
          height: 18px;
          background: #22c55e;
          border-radius: 50%;
          border: 2px solid white;
          animation: pulseDot 1.5s ease-in-out infinite;
        }
        @keyframes pulseDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }

        .ai-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.3);
          backdrop-filter: blur(2px);
          z-index: 998;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .ai-panel {
          position: fixed;
          bottom: 108px;
          right: 30px;
          width: 380px;
          max-width: calc(100vw - 40px);
          height: 580px;
          max-height: calc(100vh - 140px);
          background: #f5f7fa;
          border-radius: 24px;
          box-shadow: 0 25px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.5);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 999;
          animation: slideUp 0.3s cubic-bezier(.34,1.56,.64,1);
        }
        @keyframes slideUp {
          from { transform: translateY(30px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }

        .ai-header {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          padding: 16px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }
        .ai-header-avatar {
          width: 42px;
          height: 42px;
          background: rgba(255,255,255,0.15);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(255,255,255,0.3);
          flex-shrink: 0;
          color: white;
        }
        .ai-header-info h4 {
          color: white;
          font-size: 0.95rem;
          font-weight: 700;
          margin: 0 0 2px;
        }
        .ai-header-info span {
          color: rgba(255,255,255,0.8);
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .ai-header-info span::before {
          content: '';
          width: 7px;
          height: 7px;
          background: #4ade80;
          border-radius: 50%;
          display: inline-block;
        }
        .ai-header-close {
          margin-left: auto;
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .ai-header-close:hover {
          background: rgba(255,255,255,0.35);
        }

        .ai-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          scroll-behavior: smooth;
        }
        .ai-messages::-webkit-scrollbar { width: 4px; }
        .ai-messages::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }

        .ai-msg {
          display: flex;
          gap: 8px;
          max-width: 88%;
        }
        .ai-msg.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }
        .ai-msg.assistant {
          align-self: flex-start;
        }
        .ai-msg-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .ai-msg.assistant .ai-msg-avatar {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: white;
        }
        .ai-msg.user .ai-msg-avatar {
          background: #e5e7eb;
          color: #6b7280;
        }
        .ai-msg-bubble {
          padding: 10px 14px;
          border-radius: 18px;
          font-size: 0.875rem;
          line-height: 1.5;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .ai-msg.assistant .ai-msg-bubble {
          background: white;
          color: #1a1a2e;
          border-bottom-left-radius: 4px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.07);
        }
        .ai-msg.user .ai-msg-bubble {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: white;
          border-bottom-right-radius: 4px;
        }
        .ai-msg-time {
          font-size: 0.68rem;
          color: #aaa;
          margin-top: 4px;
          padding: 0 2px;
        }
        .ai-msg.user .ai-msg-time {
          text-align: right;
        }

        .ai-typing-dots {
          display: flex;
          gap: 4px;
          padding: 12px 14px;
        }
        .ai-typing-dots span {
          width: 7px;
          height: 7px;
          background: #a5b4fc;
          border-radius: 50%;
          animation: bounce 1.2s infinite;
        }
        .ai-typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .ai-typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }

        .ai-quick-actions {
          padding: 8px 14px 0;
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          flex-shrink: 0;
        }
        .ai-quick-btn {
          background: white;
          border: 1.5px solid #e5e7eb;
          border-radius: 20px;
          padding: 6px 12px;
          font-size: 0.78rem;
          font-weight: 600;
          color: #4f46e5;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          font-family: inherit;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .ai-quick-btn:hover {
          background: #eef2ff;
          border-color: #4f46e5;
          transform: translateY(-1px);
        }

        .ai-input-area {
          padding: 12px 14px;
          background: white;
          border-top: 1px solid #f0f0f0;
          flex-shrink: 0;
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .ai-input-wrap {
          flex: 1;
          background: #f5f7fa;
          border: 1.5px solid #e5e7eb;
          border-radius: 22px;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          transition: border-color 0.2s;
        }
        .ai-input-wrap:focus-within {
          border-color: #4f46e5;
          background: white;
        }
        .ai-input-wrap input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 0.875rem;
          color: #333;
          font-family: inherit;
        }
        .ai-input-wrap input::placeholder { color: #aaa; }
        .ai-send-btn {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .ai-send-btn:hover:not(:disabled) {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(79,70,229,0.4);
        }
        .ai-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 480px) {
          .ai-panel {
            bottom: 100px;
            right: 15px;
            left: 15px;
            width: auto;
          }
          .ai-fab {
            bottom: 20px;
            right: 20px;
          }
        }
      `}</style>

      <div className="ai-chat-wrapper">

        {open && <div className="ai-backdrop" onClick={() => setOpen(false)} />}

        {open && (
          <div className="ai-panel">

            <div className="ai-header">
              <div className="ai-header-avatar">
                <Bot size={22} />
              </div>
              <div className="ai-header-info">
                <h4>Campus AI Assistant</h4>
                <span>Online • Always here to help</span>
              </div>
              <button className="ai-header-close" onClick={() => setOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="ai-messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`ai-msg ${msg.role}`}>
                  <div className="ai-msg-avatar">
                    {msg.role === 'assistant'
                      ? <Bot size={16} />
                      : <User size={16} />
                    }
                  </div>
                  <div className="ai-msg-body">
                    <div className="ai-msg-bubble">{msg.text}</div>
                    <div className="ai-msg-time">{msg.time}</div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="ai-msg assistant">
                  <div className="ai-msg-avatar"><Bot size={16} /></div>
                  <div className="ai-msg-body">
                    <div className="ai-msg-bubble" style={{ padding: 0 }}>
                      <div className="ai-typing-dots">
                        <span /><span /><span />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="ai-quick-actions">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.label}
                  className="ai-quick-btn"
                  onClick={() => sendMessage(a.prompt)}
                >
                  {a.icon}
                  {a.label}
                </button>
              ))}
            </div>

            <div className="ai-input-area">
              <div className="ai-input-wrap">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  disabled={loading}
                />
              </div>
              <button
                className="ai-send-btn"
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
              >
                <Send size={18} />
              </button>
            </div>

          </div>
        )}

        <button
          className={`ai-fab ${open ? 'open-state' : ''} ${pulse && !open ? 'ai-fab-pulse' : ''}`}
          onClick={() => setOpen((v) => !v)}
          title="AI Assistant"
        >
          {open ? <X size={26} /> : <Bot size={26} />}
        </button>

      </div>
    </>
  )
}
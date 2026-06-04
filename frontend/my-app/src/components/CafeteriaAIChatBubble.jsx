import { useState, useRef, useEffect } from 'react'

const QUICK_ACTIONS = [
  { label: '📦 Pending Orders', prompt: 'How many pending orders do I have right now?' },
  { label: '💰 Revenue Today', prompt: 'What is my revenue today?' },
  { label: '🍛 Best Seller', prompt: 'What is my best selling item today?' },
  { label: '📋 Order Summary', prompt: 'Give me a summary of today\'s orders' },
]

const INITIAL_MESSAGE = {
  id: 1,
  role: 'assistant',
  text: "Hey! 👋 I'm your Cafeteria AI Assistant.\n\nI can help you track orders, check revenue, manage your menu, and grow your business!\n\nWhat would you like to know today?",
  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
}

export default function CafeteriaAIChatBubble() {
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
      const response = await fetch('http://localhost:8000/api/cafeteria/ai/assistant/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ question: userText }),
      })
      const data = await response.json()
      const replyText =
        data.success
          ? data.answer
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

        .caf-ai-wrapper * {
          box-sizing: border-box;
          font-family: 'Plus Jakarta Sans', 'Segoe UI', sans-serif;
        }

        .caf-ai-fab {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #16a34a, #15803d);
          border-radius: 50%;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.9rem;
          cursor: pointer;
          z-index: 1000;
          box-shadow: 0 6px 28px rgba(22,163,74,0.5);
          transition: transform 0.25s cubic-bezier(.34,1.56,.64,1), box-shadow 0.25s;
        }
        .caf-ai-fab:hover {
          transform: scale(1.12);
          box-shadow: 0 10px 35px rgba(22,163,74,0.6);
        }
        .caf-ai-fab.open-state {
          transform: scale(0.9) rotate(15deg);
        }
        .caf-ai-fab.caf-ai-fab-pulse::after {
          content: '';
          position: absolute;
          top: -4px;
          right: -4px;
          width: 18px;
          height: 18px;
          background: #f59e0b;
          border-radius: 50%;
          border: 2px solid white;
          animation: cafPulseDot 1.5s ease-in-out infinite;
        }
        @keyframes cafPulseDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }

        .caf-ai-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.3);
          backdrop-filter: blur(2px);
          z-index: 998;
          animation: cafFadeIn 0.2s ease;
        }
        @keyframes cafFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .caf-ai-panel {
          position: fixed;
          bottom: 108px;
          right: 30px;
          width: 380px;
          max-width: calc(100vw - 40px);
          height: 560px;
          max-height: calc(100vh - 140px);
          background: #f0fdf4;
          border-radius: 24px;
          box-shadow: 0 25px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.5);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 999;
          animation: cafSlideUp 0.3s cubic-bezier(.34,1.56,.64,1);
        }
        @keyframes cafSlideUp {
          from { transform: translateY(30px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }

        .caf-ai-header {
          background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
          padding: 16px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }
        .caf-ai-header-avatar {
          width: 42px;
          height: 42px;
          background: rgba(255,255,255,0.15);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          border: 2px solid rgba(255,255,255,0.3);
          flex-shrink: 0;
        }
        .caf-ai-header-info h4 {
          color: white;
          font-size: 0.95rem;
          font-weight: 700;
          margin: 0 0 2px;
        }
        .caf-ai-header-info span {
          color: rgba(255,255,255,0.8);
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .caf-ai-header-info span::before {
          content: '';
          width: 7px;
          height: 7px;
          background: #fbbf24;
          border-radius: 50%;
          display: inline-block;
        }
        .caf-ai-header-close {
          margin-left: auto;
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .caf-ai-header-close:hover { background: rgba(255,255,255,0.35); }

        .caf-ai-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          scroll-behavior: smooth;
        }
        .caf-ai-messages::-webkit-scrollbar { width: 4px; }
        .caf-ai-messages::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }

        .caf-ai-msg {
          display: flex;
          gap: 8px;
          max-width: 88%;
        }
        .caf-ai-msg.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }
        .caf-ai-msg.assistant { align-self: flex-start; }
        .caf-ai-msg-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .caf-ai-msg.assistant .caf-ai-msg-avatar { background: linear-gradient(135deg, #16a34a, #15803d); }
        .caf-ai-msg.user .caf-ai-msg-avatar { background: #e5e7eb; }
        .caf-ai-msg-bubble {
          padding: 10px 14px;
          border-radius: 18px;
          font-size: 0.875rem;
          line-height: 1.5;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .caf-ai-msg.assistant .caf-ai-msg-bubble {
          background: white;
          color: #1a1a2e;
          border-bottom-left-radius: 4px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.07);
        }
        .caf-ai-msg.user .caf-ai-msg-bubble {
          background: linear-gradient(135deg, #16a34a, #15803d);
          color: white;
          border-bottom-right-radius: 4px;
        }
        .caf-ai-msg-time {
          font-size: 0.68rem;
          color: #aaa;
          margin-top: 4px;
          padding: 0 2px;
        }
        .caf-ai-msg.user .caf-ai-msg-time { text-align: right; }

        .caf-ai-typing-dots {
          display: flex;
          gap: 4px;
          padding: 12px 14px;
        }
        .caf-ai-typing-dots span {
          width: 7px;
          height: 7px;
          background: #86efac;
          border-radius: 50%;
          animation: cafBounce 1.2s infinite;
        }
        .caf-ai-typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .caf-ai-typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes cafBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }

        .caf-ai-quick-actions {
          padding: 8px 14px 0;
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          flex-shrink: 0;
        }
        .caf-ai-quick-btn {
          background: white;
          border: 1.5px solid #d1fae5;
          border-radius: 20px;
          padding: 6px 12px;
          font-size: 0.78rem;
          font-weight: 600;
          color: #15803d;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          font-family: inherit;
        }
        .caf-ai-quick-btn:hover {
          background: #dcfce7;
          border-color: #16a34a;
          transform: translateY(-1px);
        }

        .caf-ai-input-area {
          padding: 12px 14px;
          background: white;
          border-top: 1px solid #f0f0f0;
          flex-shrink: 0;
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .caf-ai-input-wrap {
          flex: 1;
          background: #f0fdf4;
          border: 1.5px solid #d1fae5;
          border-radius: 22px;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          transition: border-color 0.2s;
        }
        .caf-ai-input-wrap:focus-within {
          border-color: #16a34a;
          background: white;
        }
        .caf-ai-input-wrap input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 0.875rem;
          color: #333;
          font-family: inherit;
        }
        .caf-ai-input-wrap input::placeholder { color: #aaa; }
        .caf-ai-send-btn {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: linear-gradient(135deg, #16a34a, #15803d);
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .caf-ai-send-btn:hover:not(:disabled) {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(22,163,74,0.4);
        }
        .caf-ai-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        @media (max-width: 480px) {
          .caf-ai-panel {
            bottom: 100px;
            right: 15px;
            left: 15px;
            width: auto;
          }
          .caf-ai-fab {
            bottom: 20px;
            right: 20px;
          }
        }
      `}</style>

      <div className="caf-ai-wrapper">
        {open && <div className="caf-ai-backdrop" onClick={() => setOpen(false)} />}

        {open && (
          <div className="caf-ai-panel">
            <div className="caf-ai-header">
              <div className="caf-ai-header-avatar">🍴</div>
              <div className="caf-ai-header-info">
                <h4>Cafeteria AI Assistant</h4>
                <span>Online • Your business partner</span>
              </div>
              <button className="caf-ai-header-close" onClick={() => setOpen(false)}>✕</button>
            </div>

            <div className="caf-ai-messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`caf-ai-msg ${msg.role}`}>
                  <div className="caf-ai-msg-avatar">
                    {msg.role === 'assistant' ? '🍴' : '👤'}
                  </div>
                  <div className="caf-ai-msg-body">
                    <div className="caf-ai-msg-bubble">{msg.text}</div>
                    <div className="caf-ai-msg-time">{msg.time}</div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="caf-ai-msg assistant">
                  <div className="caf-ai-msg-avatar">🍴</div>
                  <div className="caf-ai-msg-body">
                    <div className="caf-ai-msg-bubble" style={{ padding: 0 }}>
                      <div className="caf-ai-typing-dots">
                        <span /><span /><span />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="caf-ai-quick-actions">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.label}
                  className="caf-ai-quick-btn"
                  onClick={() => sendMessage(a.prompt)}
                >
                  {a.label}
                </button>
              ))}
            </div>

            <div className="caf-ai-input-area">
              <div className="caf-ai-input-wrap">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask about orders, revenue, menu..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  disabled={loading}
                />
              </div>
              <button
                className="caf-ai-send-btn"
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
              >
                ➤
              </button>
            </div>
          </div>
        )}

        <button
          className={`caf-ai-fab ${open ? 'open-state' : ''} ${pulse && !open ? 'caf-ai-fab-pulse' : ''}`}
          onClick={() => setOpen((v) => !v)}
          title="Cafeteria AI Assistant"
        >
          {open ? '✕' : '🍴'}
        </button>
      </div>
    </>
  )
}
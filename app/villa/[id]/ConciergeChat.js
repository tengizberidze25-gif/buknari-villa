'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../LanguageContext';
import { t } from '../../i18n';

function stripMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^[-•]\s*/gm, '');
}

export default function ConciergeChat({ villaId }) {
  const { lang } = useLanguage();
  const tt = (key) => t(lang, key);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setSending(true);
    setError('');

    try {
      const res = await fetch('/api/villa-concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          villaId,
          message: text,
          history: newMessages.slice(0, -1),
          lang,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessages([...newMessages, { role: 'assistant', content: stripMarkdown(data.reply) }]);
      } else {
        setError(data.message || tt('conciergeError'));
      }
    } catch (err) {
      setError(tt('conciergeError'));
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={`concierge-fab${open ? ' open' : ''}`}
        onClick={() => setOpen(!open)}
        aria-label={tt('conciergeTitle')}
      >
        {open ? '✕' : '💬'}
      </button>

      {open && (
        <div className="concierge-panel">
          <div className="concierge-header">
            <span>🏡 {tt('conciergeTitle')}</span>
          </div>

          <div className="concierge-messages" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="concierge-msg concierge-msg-assistant">{tt('conciergeGreeting')}</div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`concierge-msg concierge-msg-${m.role}`}>
                {m.content}
              </div>
            ))}
            {sending && (
              <div className="concierge-msg concierge-msg-assistant concierge-typing">
                <span></span><span></span><span></span>
              </div>
            )}
            {error && <div className="concierge-msg concierge-msg-error">{error}</div>}
          </div>

          <form onSubmit={handleSend} className="concierge-input-row">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={tt('conciergePlaceholder')}
              maxLength={500}
            />
            <button type="submit" disabled={sending || !input.trim()}>
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}

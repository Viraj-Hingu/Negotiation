import { useEffect, useRef } from "react";
import useChat from "./hook/useChat";
import { resetChat } from "./service/chat.api";

function App() {
  const { message, userInput, setuserInput, getData, setMessage, loading } =
    useChat();
  const messagesEndRef = useRef(null);

  const initialMessage = [
    { send: "ai", Text: "Hi! The asking price is 5 lakh. What's your offer?" },
  ];

  const handleReset = async () => {
    try {
      await resetChat(); // reset backend state
    } catch (e) {
      console.warn("Backend reset failed:", e.message);
    }
    setMessage(initialMessage);
    setuserInput("");
  };

  const quickOffers = [
    "I can do 4.25 lakh",
    "Final 4.5 lakh",
    "Can you do 4 lakh?",
  ];

  const formatPrice = (price) => {
    if (!price) return "";
    if (price >= 100000) {
      const lakhValue = price / 100000;
      return `${Number.isInteger(lakhValue) ? lakhValue : lakhValue.toFixed(2)} lakh`;
    }
    return price;
  };

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [message, loading]);

  const handleSend = async (msg) => {
    const trimmed = msg.trim();
    if (!trimmed) return;

    // Clear input immediately after sending
    setuserInput("");

    const userMsg = { send: "user", Text: trimmed };
    setMessage((prev) => [...prev, userMsg]);

    try {
      const data = await getData(trimmed);

      if (!data?.message) {
        throw new Error("No response received from server");
      }

      const aiMsg = {
        send: "ai",
        Text: data.message,
        price: data.counterPrice,
        isAccepted: data.isAccepted,
      };

      setMessage((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      setMessage((prev) => [
        ...prev,
        {
          send: "ai",
          Text: "⚠️ Server is not responding. Please make sure the backend is running.",
        },
      ]);
    }
  };

  return (
    <div className="app-shell">
      {/* Floating cartoon stickers */}
      <div className="cartoon-sticker sticker-1">SALE! 🔥</div>
      <div className="cartoon-sticker sticker-2">Negotiate! 🤝</div>

      <main className="deal-chat">
        {/* ── Left: Product Pane ── */}
        <section className="product-pane" aria-label="Product details">
          <div className="product-image-wrap">
            <img
              src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=900&q=80"
              alt="Black car parked outdoors"
              className="product-image"
            />
            <span className="live-badge">🟢 Seller online</span>
          </div>

          <div className="product-copy">
            <p className="eyebrow">Marketplace negotiation</p>
            <h1>2018 City Drive Sedan</h1>
            <p className="product-text">
              Clean car, ready documents, and a seller who negotiates only on
              serious offers.
            </p>
          </div>

          <div className="price-strip">
            <div>
              <span>Asking price</span>
              <strong>5 lakh</strong>
            </div>
            <div>
              <span>Seller mood</span>
              <strong>Firm</strong>
            </div>
          </div>

          <div className="trust-list">
            <span>✅ Verified seller</span>
            <span>🤝 Negotiable for real buyers</span>
            <span>🚫 No silly offers</span>
          </div>
        </section>

        {/* ── Right: Chat Pane ── */}
        <section className="chat-pane" aria-label="Negotiation chat">
          <header className="chat-header">
            <div>
              <p className="eyebrow">Chat with seller</p>
              <h2>Make your best offer</h2>
            </div>
            <div className="header-actions">
              <button
                id="reset-btn"
                type="button"
                className="reset-btn"
                onClick={handleReset}
                title="Reset conversation"
              >
                🔄 Reset
              </button>
              <div className="status-pill">🔒 Secure</div>
            </div>
          </header>

          {/* Messages list */}
          <div className="messages" role="log" aria-live="polite">
            {message.map((msg, idx) => {
              const isUser = msg.send?.toLowerCase() === "user";
              return (
                <div
                  className={`message-row ${isUser ? "from-user" : "from-ai"}`}
                  key={idx}
                >
                  <div className="avatar" aria-hidden="true">
                    {isUser ? "You" : "🏷️"}
                  </div>
                  <div className="bubble">
                    <p>{msg.Text}</p>
                    {msg.price && (
                      <span className="price-note">
                        {msg.isAccepted ? "✅ Deal price" : "💬 Counter"}:{" "}
                        {formatPrice(msg.price)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {loading && (
              <div className="message-row from-ai">
                <div className="avatar" aria-hidden="true">🏷️</div>
                <div className="bubble typing" aria-label="Seller is typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} className="messages-end" />
          </div>

          {/* Quick offer chips */}
          <div className="offer-chips" aria-label="Quick offer suggestions">
            {quickOffers.map((offer) => (
              <button
                type="button"
                key={offer}
                onClick={() => handleSend(offer)}
                disabled={loading}
              >
                {offer}
              </button>
            ))}
          </div>

          {/* Composer / input */}
          <form
            className="composer"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(userInput);
            }}
          >
            <input
              id="offer-input"
              type="text"
              value={userInput}
              placeholder="e.g. I can do 4.5 lakh…"
              onChange={(e) => setuserInput(e.target.value)}
              autoComplete="off"
              disabled={loading}
            />
            <button
              id="send-btn"
              type="submit"
              disabled={loading || !userInput.trim()}
            >
              {loading ? "⏳ Sending…" : "Send offer 🚀"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

export default App;

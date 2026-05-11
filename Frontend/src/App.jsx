import { useEffect, useRef, useState } from "react";
import useChat from "./hook/useChat";
import { resetChat, fetchProducts, selectProduct } from "./service/chat.api";

function App() {
  const { message, userInput, setuserInput, getData, setMessage, loading } =
    useChat();
  const messagesEndRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

  const formatPrice = (price) => {
    if (!price) return "₹0";
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)} Lakh`;
    return `₹${price.toLocaleString()}`;
  };

  const initialMessage = (priceText) => [
    {
      send: "ai",
      Text: `Welcome to Deal Master. I am the AI assistant for this ${currentProduct?.name || "item"}. The asking price is ${priceText}. Shall we begin the negotiation?`,
    },
  ];

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchProducts();
        setProducts(data);
        if (data.length > 0) setCurrentProduct(data[0]);
      } catch (e) {
        console.error("Failed to load products:", e);
      }
    };
    load();
  }, []);

  const handleReset = async () => {
    if (loading) return;
    try {
      await resetChat();
      setMessage(initialMessage(formatPrice(currentProduct?.originalPrice)));
    } catch (e) {
      console.warn("Reset failed");
    }
  };

  const handleSwitchProduct = async (prod) => {
    if (loading || prod.id === currentProduct?.id) return;
    try {
      await selectProduct(prod.id);
      setCurrentProduct(prod);
      setMessage(initialMessage(formatPrice(prod.originalPrice)));
      setShowMobileDrawer(false);
    } catch (e) {
      console.error("Switch failed");
    }
  };

  const handleSend = async (msg) => {
    const trimmed = msg.trim();
    if (!trimmed || loading) return;
    setuserInput("");
    setMessage((prev) => [...prev, { send: "user", Text: trimmed }]);
    try {
      const data = await getData(trimmed);
      setMessage((prev) => [
        ...prev,
        {
          send: "ai",
          Text: data.message,
          price: data.counterPrice,
          isAccepted: data.isAccepted,
        },
      ]);
    } catch (err) {
      setMessage((prev) => [
        ...prev,
        { send: "ai", Text: "⚠️ Connection error. Please try again." },
      ]);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [message, loading]);

  const isChatStarted = message.length > 1;

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden select-none">
      {/* ================= DESKTOP SIDEBAR (LEFT) ================= */}
      <aside className="hidden lg:flex flex-col w-[400px] border-r-4 border-black bg-white overflow-y-auto scrollbar-hide">
        {/* 1. Brand Header */}
        <div className="p-8 border-b-4 border-black bg-primary text-white">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🤝</span>
            <div>
              <h1 className="text-2xl font-black leading-none">DEAL MASTER</h1>
              <p className="text-[10px] font-bold opacity-80 mt-1 uppercase tracking-tighter">AI-Powered Workspace</p>
            </div>
          </div>
        </div>

        {/* 2. Product Gallery */}
        <div className="p-6 border-b-4 border-black">
          <h3 className="section-label mb-4 text-xs font-black text-slate-400 tracking-widest uppercase">Product Catalog</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSwitchProduct(p)}
                className={`flex-shrink-0 w-20 h-20 rounded-2xl border-4 transition-all overflow-hidden ${
                  currentProduct?.id === p.id ? "border-primary scale-105 shadow-soft" : "border-slate-200 hover:border-black"
                }`}
              >
                <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* 3. Product Info */}
        <div className="p-8 space-y-4">
          <div className="flex items-center gap-2">
            <span className="badge-premium bg-secondary text-black">ID: {currentProduct?.id.toUpperCase()}</span>
            <span className="badge-premium bg-blue-100 text-blue-600 border-blue-600">VERIFIED SELLER ✅</span>
          </div>
          <h2 className="text-4xl leading-tight uppercase">{currentProduct?.name}</h2>
          <p className="text-sm text-slate-500 font-medium leading-relaxed italic">
            "Direct sale from verified owner. Pristine condition with complete service history."
          </p>
        </div>

        {/* 4. Product Stats Grid */}
        <div className="px-8 grid grid-cols-2 gap-4 pb-8">
          {[
            { label: "Asking Price", value: formatPrice(currentProduct?.originalPrice), color: "bg-purple-50 text-purple-600" },
            { label: "Condition", value: "Excellent", color: "bg-green-50 text-green-600" },
            { label: "Mileage", value: "12,450 KM", color: "bg-blue-50 text-blue-600" },
            { label: "Ownership", value: "1st Owner", color: "bg-orange-50 text-orange-600" },
            { label: "Insurance", value: "Valid 2026", color: "bg-teal-50 text-teal-600" },
            { label: "Fuel Type", value: "Petrol", color: "bg-slate-50 text-slate-600" },
          ].map((stat, i) => (
            <div key={i} className={`p-4 border-2 border-black rounded-2xl shadow-premium ${stat.color}`}>
              <span className="block text-[9px] font-black uppercase opacity-60 mb-1">{stat.label}</span>
              <span className="text-sm font-black">{stat.value}</span>
            </div>
          ))}
        </div>

        {/* 5. Control Panel */}
        <div className="mt-auto p-8 bg-slate-50 border-t-4 border-black space-y-4">
          <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Negotiation Active</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
             <button onClick={handleReset} className="btn-premium bg-white text-xs py-2 px-0">🔄 RESET</button>
             <button className="btn-premium bg-success text-white text-xs py-2 px-0">🔒 SECURE</button>
          </div>
          <button className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-[10px] font-black text-slate-400 hover:border-black hover:text-black transition-colors">
            DOWNLOAD SUMMARY PDF 📥
          </button>
        </div>
      </aside>

      {/* ================= MAIN CHAT AREA (RIGHT) ================= */}
      <main className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden">
        
        {/* --- MOBILE STICKY HEADER --- */}
        <header className="lg:hidden h-20 border-b-4 border-black flex-shrink-0 flex items-center px-6 justify-between bg-white z-50">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl border-2 border-black overflow-hidden shadow-soft">
                <img src={currentProduct?.image} alt="" className="w-full h-full object-cover" />
             </div>
             <div>
                <h2 className="text-sm font-black uppercase leading-none">{currentProduct?.name}</h2>
                <div className="flex items-center gap-1 mt-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                   <span className="text-[9px] font-black text-slate-400 uppercase">AI Seller Online</span>
                </div>
             </div>
          </div>
          <button 
            onClick={() => setShowMobileDrawer(true)}
            className="w-12 h-12 rounded-2xl border-2 border-black bg-secondary flex items-center justify-center shadow-soft active:shadow-none transition-all"
          >
            <span className="text-xl">📋</span>
          </button>
        </header>

        {/* --- DESKTOP HEADER --- */}
        <header className="hidden lg:flex h-20 border-b-4 border-black flex-shrink-0 items-center px-10 justify-between bg-white z-50">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-green-500"></div>
                 <span className="text-xs font-black uppercase tracking-widest text-slate-400">Live Negotiation</span>
              </div>
              <div className="h-6 w-px bg-slate-200"></div>
              <div className="flex flex-col">
                 <span className="text-[9px] font-black text-slate-400 uppercase leading-none">Negotiating for</span>
                 <span className="text-sm font-black uppercase">{currentProduct?.name}</span>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <div className="text-right">
                 <span className="text-[9px] font-black text-slate-400 uppercase leading-none">Best Offer so far</span>
                 <p className="text-sm font-black text-primary uppercase">₹ Pending</p>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-black bg-slate-100 flex items-center justify-center font-black italic">AI</div>
           </div>
        </header>

        {/* --- CONVERSATION AREA --- */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-12 space-y-8 scrollbar-hide">
          {message.map((msg, idx) => {
            const isUser = msg.send?.toLowerCase() === "user";
            return (
              <div key={idx} className={`flex w-full ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}>
                <div className={`max-w-[85%] lg:max-w-[60%] space-y-1`}>
                  <div className={`p-4 lg:p-5 border-[3px] border-black shadow-premium text-sm lg:text-[15px] font-bold leading-relaxed
                    ${isUser ? "bg-secondary rounded-l-2xl rounded-tr-2xl" : "bg-white rounded-r-2xl rounded-tl-2xl"}
                  `}>
                    {msg.Text}
                  </div>
                  {msg.price && (
                    <div className="flex items-center gap-2">
                       <div className={`px-4 py-2 border-2 border-black rounded-xl text-[11px] font-black uppercase shadow-soft
                          ${msg.isAccepted ? "bg-success text-white" : "bg-primary text-white"}
                       `}>
                          {msg.isAccepted ? "🚀 Deal Finalized at" : "💬 AI Counter Offer"}: {formatPrice(msg.price)}
                       </div>
                    </div>
                  )}
                  <span className="text-[10px] font-black text-slate-300 uppercase px-2">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex justify-start animate-pulse">
               <div className="p-5 bg-slate-100 border-4 border-slate-200 rounded-3xl text-slate-400 font-black italic text-xs uppercase tracking-widest">
                  Assistant is thinking...
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* --- BOTTOM INPUT AREA --- */}
        <div className="flex-shrink-0 bg-white border-t-4 border-black p-6 lg:p-8 space-y-4">
           {/* Suggestions */}
           {!isChatStarted && (
             <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
               {[
                 "I can do slightly less",
                 "What's your final price?",
                 "Can you include accessories?",
                 "Can you do 10% off?"
               ].map((offer) => (
                 <button
                   key={offer}
                   onClick={() => handleSend(offer)}
                   disabled={loading}
                   className="px-4 py-2 border-2 border-black rounded-full text-[10px] lg:text-xs font-black uppercase bg-white hover:bg-black hover:text-white transition-all shadow-soft active:shadow-none"
                 >
                   {offer}
                 </button>
               ))}
             </div>
           )}

           {/* Input Bar */}
           <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(userInput); }}
            className="flex flex-col lg:flex-row gap-3"
           >
             <div className="flex-1 relative">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setuserInput(e.target.value)}
                  placeholder="Type your message or negotiate price..."
                  className="w-full h-14 lg:h-16 px-6 pr-16 border-4 border-black rounded-2xl font-bold lg:text-lg focus:outline-none focus:ring-4 ring-primary/10 bg-slate-50"
                  disabled={loading}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                   <button type="button" className="text-lg opacity-30 hover:opacity-100 transition-opacity">🎙️</button>
                   <button type="button" className="text-lg opacity-30 hover:opacity-100 transition-opacity">📎</button>
                </div>
             </div>
             <button 
              type="submit"
              disabled={loading || !userInput.trim()}
              className="btn-premium bg-primary text-white h-14 lg:h-16 lg:px-10 flex items-center justify-center gap-2"
             >
                <span className="text-sm lg:text-base font-black uppercase">Send Offer</span>
                <span className="text-lg">🚀</span>
             </button>
           </form>
        </div>
      </main>

      {/* ================= MOBILE BOTTOM SHEET ================= */}
      {showMobileDrawer && (
        <div className="lg:hidden fixed inset-0 z-[100] flex flex-col justify-end">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowMobileDrawer(false)}></div>
           <div className="relative bg-white border-t-4 border-black rounded-t-[40px] max-h-[90vh] overflow-y-auto animate-slide-up">
              {/* Handle */}
              <div className="flex justify-center p-4">
                 <div className="w-16 h-1.5 bg-slate-200 rounded-full"></div>
              </div>

              {/* Drawer Content */}
              <div className="p-8 space-y-8">
                 <div className="flex items-center justify-between">
                    <h2 className="text-2xl uppercase tracking-tighter">Product Details</h2>
                    <button onClick={() => setShowMobileDrawer(false)} className="w-10 h-10 rounded-full border-2 border-black flex items-center justify-center text-xl">✕</button>
                 </div>

                 {/* Stats */}
                 <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Asking Price", value: formatPrice(currentProduct?.originalPrice), color: "bg-purple-50 text-purple-600" },
                      { label: "Condition", value: "Excellent", color: "bg-green-50 text-green-600" },
                      { label: "Mileage", value: "12,450 KM", color: "bg-blue-50 text-blue-600" },
                      { label: "Ownership", value: "1st Owner", color: "bg-orange-50 text-orange-600" },
                    ].map((stat, i) => (
                      <div key={i} className={`p-4 border-2 border-black rounded-2xl ${stat.color}`}>
                        <span className="block text-[8px] font-black uppercase opacity-60 mb-1">{stat.label}</span>
                        <span className="text-xs font-black">{stat.value}</span>
                      </div>
                    ))}
                 </div>

                 <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase text-slate-400">Switch Product</h3>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {products.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleSwitchProduct(p)}
                          className={`flex-shrink-0 w-20 h-20 rounded-2xl border-4 transition-all overflow-hidden ${
                            currentProduct?.id === p.id ? "border-primary scale-105" : "border-slate-100"
                          }`}
                        >
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4 pt-4">
                    <button onClick={handleReset} className="btn-premium bg-white text-xs py-4 px-0 uppercase">Reset Session</button>
                    <button className="btn-premium bg-success text-white text-xs py-4 px-0 uppercase">Secure Deal</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

export default App;

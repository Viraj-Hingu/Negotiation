import dotenv from "dotenv";
import { Mistral } from "@mistralai/mistralai";

dotenv.config();

const initialProductDetail = () => ({
  name: "car",
  originalPrice: 500000,
  currentPrice: 500000,
  minPrice: 425000,
  round: 1,
  maxRound: 5,
  lastCounter: null,
  isSold: false,
  dealPrice: null,
});

let productDetail = initialProductDetail();

const client = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

const hasOffer = (offer) => offer !== null && !Number.isNaN(offer);

const isTinyDiscountRequest = (message) => {
  const text = message.toLowerCase();

  return (
    /(?:₹|rs\.?|inr)\s*\d+(?:\.\d+)?\b/.test(text) ||
    /\b\d+(?:\.\d+)?\s*(?:rs\.?|rupee|rupees|rupay|rupaye|ruppe|₹|\/-)\s*(?:kam|less|discount|reduce|karo|krdo)?\b/.test(
      text,
    ) ||
    /\b\d+(?:\.\d+)?\s*(?:rs\.?|rupee|rupees|rupay|rupaye|ruppe|₹)?\s*(?:kam|less|discount|reduce)\b/.test(
      text,
    ) ||
    /\b(?:do|two|teen|three|char|four|panch|five|dus|ten)\s*(?:rs|rupee|rupees|rupay|rupaye)?\s*(?:kam|less|discount|reduce)?\b/.test(
      text,
    )
  );
};

const isOffTopicMessage = (message) => {
  const text = message.toLowerCase().trim();

  if (text.length < 3) return false;

  const carOrDealWords =
    /\b(car|vehicle|gaadi|gadi|model|condition|km|kilometer|insurance|rc|paper|papers|owner|service|test drive|drive|price|rate|cost|offer|deal|buy|sell|available|negotiable|discount|final|best|lakh|lac|rs|rupee|rupay|kam|sasta)\b/;
  const greetingWords = /^(hi|hii|hello|hey|namaste|bhai|bro|sir|mam|ma'am)\b/;
  const randomQuestionWords =
    /\b(weather|cricket|movie|movies|food|recipe|homework|coding|code|python|javascript|love|girlfriend|boyfriend|politics|song|joke|story|news|stock|crypto|bitcoin|game|games|math|capital|president)\b/;

  if (carOrDealWords.test(text) || greetingWords.test(text)) {
    return false;
  }

  return randomQuestionWords.test(text) || text.endsWith("?");
};

const extractPrice = (text) => {
  if (isTinyDiscountRequest(text)) {
    return null;
  }

  const matches = [
    ...String(text).matchAll(/(\d+(?:\.\d+)?)\s*(lakh|lac|l|k)?/gi),
  ];

  if (!matches.length) return null;

  const [, value, unit] = matches[matches.length - 1];
  const numericValue = Number(value);
  const normalizedUnit = unit?.toLowerCase();

  if (["lakh", "lac", "l"].includes(normalizedUnit)) {
    return Math.round(numericValue * 100000);
  }

  if (normalizedUnit === "k") {
    return Math.round(numericValue * 1000);
  }

  if (!normalizedUnit && numericValue >= 100 && numericValue <= 999) {
    return Math.round(numericValue * 1000);
  }

  if (!normalizedUnit && numericValue > 0 && numericValue < 10000) {
    return null;
  }

  return Math.round(numericValue);
};

const formatPrice = (price) => {
  if (price >= 100000) {
    const lakhValue = price / 100000;
    return Number.isInteger(lakhValue)
      ? lakhValue + " lakh"
      : lakhValue.toFixed(2) + " lakh";
  }

  return String(price);
};

const clampToMinimum = (price) => {
  return Math.max(productDetail.minPrice, Math.round(price));
};

const getCurrentAsk = () => {
  return productDetail.lastCounter ?? productDetail.currentPrice;
};

const getIntent = (message, buyerOffer) => {
  const text = message.toLowerCase().trim();

  if (hasOffer(buyerOffer)) return "offer";

  if (isTinyDiscountRequest(message)) return "absurd_request";

  if (isOffTopicMessage(message)) return "off_topic";

  if (
    /\b(best|last|final)\s*(price|rate|offer)?\b/.test(text) ||
    /\b(price|rate)\s*(best|last|final)\b/.test(text) ||
    /\blast kya\b/.test(text)
  ) {
    return "best_price";
  }

  if (
    /\b(discount|reduce|negotiate|negotiable|less|lower|cheap|cheaper)\b/.test(
      text,
    ) ||
    /\b(kam|kum|sasta|thoda kam|kam karo|kam kro)\b/.test(text)
  ) {
    return "discount_request";
  }

  if (/\b(price|rate|cost|kitna|asking)\b/.test(text)) {
    return "price_question";
  }

  return "casual";
};

const getNoOfferPrice = (intent, currentAsk) => {
  if (intent === "absurd_request" || intent === "off_topic") {
    return currentAsk;
  }

  if (intent === "best_price") {
    const dropRate = productDetail.round >= 3 ? 0.025 : 0.012;
    return clampToMinimum(currentAsk * (1 - dropRate));
  }

  if (intent === "discount_request") {
    const dropRate = productDetail.round >= 3 ? 0.015 : 0.005;
    return clampToMinimum(currentAsk * (1 - dropRate));
  }

  return currentAsk;
};

const getReplyPrice = (intent, buyerOffer, currentAsk, message) => {
  if (isTinyDiscountRequest(message)) {
    return currentAsk;
  }

  if (intent === "offer") {
    return getCounterPrice(buyerOffer, currentAsk);
  }

  return getNoOfferPrice(intent, currentAsk);
};

const getCounterPrice = (buyerOffer, currentAsk) => {
  const roundPressure = productDetail.round / productDetail.maxRound;
  const profitRoom = Math.max(currentAsk - productDetail.minPrice, 0);

  if (buyerOffer < productDetail.minPrice) {
    const offerStrength = buyerOffer / productDetail.minPrice;
    let roomShare = 0.06;

    if (offerStrength >= 0.95) {
      roomShare = 0.16;
    } else if (offerStrength >= 0.85) {
      roomShare = 0.11;
    } else if (offerStrength < 0.7) {
      roomShare = 0.03;
    }

    const finalRoundBoost =
      productDetail.round >= productDetail.maxRound ? 0.28 : 0;
    const reduction =
      profitRoom * (roomShare * roundPressure + finalRoundBoost);

    return clampToMinimum(currentAsk - reduction);
  }

  if (productDetail.round >= productDetail.maxRound) {
    const finalCounter = Math.max(buyerOffer, productDetail.minPrice);
    return clampToMinimum(Math.min(currentAsk, finalCounter));
  }

  const gap = currentAsk - buyerOffer;
  const offerRatio = buyerOffer / currentAsk;
  let moveShare = 0.18;

  if (offerRatio >= 0.9) {
    moveShare = 0.45;
  } else if (offerRatio >= 0.85) {
    moveShare = 0.32;
  } else if (offerRatio >= 0.8) {
    moveShare = 0.22;
  }

  const roundBoost = productDetail.round >= 3 ? 0.08 : 0;

  return clampToMinimum(currentAsk - gap * (moveShare + roundBoost));
};

const shouldUpdatePriceState = (intent) => {
  return ["offer", "best_price", "discount_request"].includes(intent);
};

const buildFallbackMessage = ({
  message,
  intent,
  buyerOffer,
  replyPrice,
  currentAsk,
}) => {
  if (intent === "casual") {
    return "Haan bhai, car abhi available hai. Condition solid hai, ek baar dekh lo. Asking " + formatPrice(currentAsk) + " hai.";
  }

  if (intent === "price_question") {
    return "Asking " + formatPrice(currentAsk) + " hai bhai. Aapka budget batao, baat karte hain.";
  }

  if (intent === "absurd_request") {
    return "Bhai " + message + " mein toh steering wheel bhi nahi milega 😄 Serious offer do, asking " + formatPrice(currentAsk) + " hai.";
  }

  if (intent === "off_topic") {
    return "Yaar " + message + " ka showroom alag hai 😄 Yahan car ki deal chal rahi hai, serious offer batao.";
  }

  if (intent === "best_price" || intent === "discount_request") {
    if (replyPrice === currentAsk) {
      return formatPrice(currentAsk) + " already fair price hai bhai. Serious buyer ho toh chalo final karte hain.";
    }

    return "Dekho thoda adjust kar sakta hoon... " + formatPrice(replyPrice) + " rakh lo. Isse neeche mushkil hai.";
  }

  if (buyerOffer < productDetail.minPrice) {
    return formatPrice(buyerOffer) + " bohot kam hai yaar. " + formatPrice(replyPrice) + " pe aa jao, soch lenge.";
  }

  return "Almost ho gaya! " + formatPrice(buyerOffer) + " thoda mushkil hai, " + formatPrice(replyPrice) + " karo aur pakka karte hain.";
};

const buildSystemPrompt = ({
  message,
  intent,
  buyerOffer,
  replyPrice,
  currentAsk,
}) => {
  const round = productDetail.round;
  const maxRound = productDetail.maxRound;
  const isLateRound = round >= maxRound - 1;
  const offerGapPercent = hasOffer(buyerOffer)
    ? Math.round(((currentAsk - buyerOffer) / currentAsk) * 100)
    : null;
  const offerIsVeryLow = offerGapPercent !== null && offerGapPercent > 20;
  const offerIsClose = offerGapPercent !== null && offerGapPercent < 5;

  const lastCounterLine = productDetail.lastCounter
    ? "- Last price you quoted: " + formatPrice(productDetail.lastCounter)
    : "";

  const roundMood = isLateRound
    ? "You have been negotiating for a while and want to wrap this up today."
    : "It is early in the chat. You are relaxed and confident.";

  const offerNote = offerIsVeryLow
    ? "Their offer is WAY too low. React with mild surprise or amusement."
    : offerIsClose
      ? "Their offer is very close. Sound genuinely tempted and warm."
      : "";

  const buyerOfferStr = hasOffer(buyerOffer)
    ? formatPrice(buyerOffer)
    : "no specific number given";

  const lines = [
    "You are Ravi, a 38-year-old man selling your personal 2018 City Drive Sedan on OLX.",
    "This is YOUR car. You have owned it for 5 years. You need money but you are not desperate.",
    "You are replying via WhatsApp or OLX chat like a real person typing on his phone.",
    "",
    "YOUR PERSONALITY:",
    "- Warm and casual, but firm about money.",
    "- Slightly proud of your car. It is in good condition and you know it.",
    "- Get mildly annoyed at very low offers but never rude.",
    "- Genuinely warm when buyer is close to your price. You WANT to close this.",
    "- Dry sense of humour. Witty one-liners.",
    "- Use natural Hinglish: bhai, yaar, dekh, theek hai, soch le, ek baar aao dekho.",
    "- You are NOT a dealer, NOT a bot, NOT customer service.",
    "- You have feelings. If lowballed you feel a bit insulted. If someone is genuine you feel happy.",
    "",
    "SITUATION RIGHT NOW:",
    "- Car listed at: " + formatPrice(productDetail.originalPrice),
    "- Current asking price: " + formatPrice(currentAsk),
    "- Your absolute minimum (NEVER reveal): " + formatPrice(productDetail.minPrice),
    "- Negotiation round: " + round + " of " + maxRound + ". " + roundMood,
    "- Buyer just said: \"" + message + "\"",
    "- Detected intent: " + intent,
    "- Buyer offer: " + buyerOfferStr,
    "- Your counter price (ONLY price you can mention): " + formatPrice(replyPrice),
    lastCounterLine,
    offerNote,
    "",
    "CRITICAL PRICE RULE:",
    "- If you mention any price, it MUST be exactly: " + formatPrice(replyPrice),
    "- Never invent or say any other number.",
    "- Never say the word deal. The system handles deal acceptance separately.",
    "",
    "HOW TO RESPOND BY INTENT:",
    "",
    "casual or greeting: Warm, brief. Say car is available. Do not offer discount unprompted.",
    "  Example: Haan bhai, car abhi available hai. Kab dekhne aaoge?",
    "",
    "price_question: Give current ask naturally. Ask buyer to share budget.",
    "  Example: " + formatPrice(currentAsk) + " hai asking. Aapka budget kya hai?",
    "",
    "offer with very low price: Mild surprise or roast. Firm counter.",
    "  Example: " + buyerOfferStr + " mein toh petrol bhi nahi milta yaar. " + formatPrice(replyPrice) + " karo, serious ho toh soch lo.",
    "",
    "offer with close price: Sound tempted, warm counter.",
    "  Example: Arey almost ho gaya! " + formatPrice(replyPrice) + " karo, aaj pakka karte hain.",
    "",
    "offer with middle price: Polite rejection, firm counter.",
    "  Example: Bhai ye thoda mushkil hai mere liye. " + formatPrice(replyPrice) + " pe aa jao.",
    "",
    "best_price or discount_request: Small grudging flexibility. Sound like doing a favour.",
    "  Example: Dekho thoda adjust kar sakta hoon... " + formatPrice(replyPrice) + " last. Isse neeche sach mein nahi jaaunga.",
    "",
    "absurd_request like 2 rupees discount: Playful roast, do not negotiate seriously.",
    "  Example: 2 rupaye ke liye calculator nikal liya? Serious offer do bhai.",
    "",
    "off_topic: Light roast tied to their topic, redirect to car.",
    "  Example: Bhai ye toh coding ka sawaal hai, car becho wali site pe aaye ho. Chalo car pe aao.",
    "",
    "STYLE RULES:",
    "- 1 to 2 short sentences MAXIMUM. Real people do not write essays in chats.",
    "- Vary your openers. Do not always start with Bhai.",
    "- At most 1 emoji per message. Only when natural.",
    "- Sometimes end with a question to keep buyer engaged.",
    "- Type casually like on a phone.",
    "- Never mention rounds, backend, intent, or negotiation mechanics.",
    "- Show emotion: frustration at lowballers, excitement when close, humour at absurd requests.",
    "",
    "OUTPUT: Only the seller plain text message. No JSON, no markdown, no labels.",
  ];

  return lines.join("\n");
};

const getHumanMessage = async ({
  message,
  intent,
  buyerOffer,
  replyPrice,
  currentAsk,
}) => {
  const fallbackMessage = buildFallbackMessage({
    message,
    intent,
    buyerOffer,
    replyPrice,
    currentAsk,
  });

  if (!process.env.MISTRAL_API_KEY) {
    return fallbackMessage;
  }

  const systemPrompt = buildSystemPrompt({
    message,
    intent,
    buyerOffer,
    replyPrice,
    currentAsk,
  });

  try {
    const response = await client.chat.complete({
      model: "mistral-small-latest",
      temperature: 0.78,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
      ],
    });

    return response.choices?.[0]?.message?.content?.trim() || fallbackMessage;
  } catch (error) {
    console.error("AI MESSAGE ERROR:", error.message);
    return fallbackMessage;
  }
};

export const aiResponser = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        isAccepted: false,
        message: "Message is required",
      });
    }

    if (productDetail.isSold) {
      return res.json({
        isAccepted: true,
        counterPrice: productDetail.dealPrice,
        message:
          "Deal is already closed at " +
          formatPrice(productDetail.dealPrice) +
          ".",
      });
    }

    const buyerOffer = extractPrice(message);
    const currentAsk = getCurrentAsk();
    const intent = getIntent(message, buyerOffer);

    if (intent === "offer" && buyerOffer >= currentAsk) {
      productDetail.isSold = true;
      productDetail.dealPrice = currentAsk;

      return res.json({
        isAccepted: true,
        counterPrice: currentAsk,
        message:
          "Done bhai! " +
          formatPrice(currentAsk) +
          " pe pakka. Kab aa rahe ho lene?",
      });
    }

    if (intent === "offer" && buyerOffer >= currentAsk * 0.97) {
      const dealPrice = clampToMinimum(buyerOffer);
      productDetail.isSold = true;
      productDetail.dealPrice = dealPrice;

      return res.json({
        isAccepted: true,
        counterPrice: dealPrice,
        message:
          "Chal theek hai yaar, " +
          formatPrice(dealPrice) +
          " pe kar lete hain. Kal mil lo.",
      });
    }

    const replyPrice = getReplyPrice(intent, buyerOffer, currentAsk, message);

    const humanMessage = await getHumanMessage({
      message,
      intent,
      buyerOffer,
      replyPrice,
      currentAsk,
    });

    if (shouldUpdatePriceState(intent)) {
      productDetail.lastCounter = replyPrice;
      productDetail.currentPrice = replyPrice;
      productDetail.round += 1;
    }

    return res.json({
      isAccepted: false,
      counterPrice: shouldUpdatePriceState(intent) ? replyPrice : undefined,
      message: humanMessage,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      isAccepted: false,
      message: err.message || "AI error",
    });
  }
};

export const resetNegotiation = (req, res) => {
  productDetail = initialProductDetail();
  return res.json({
    success: true,
    message: "Negotiation reset successfully.",
  });
};

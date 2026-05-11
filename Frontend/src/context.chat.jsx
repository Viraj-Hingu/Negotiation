import { useState } from "react";
import { createContext } from "react";

export const AichatConext = createContext();

export const AichatConextProvider = ({ children }) => {
  const [message, setMessage] = useState([
    {
      send: "Ai",
      Text: "Hi! The asking price is 5 lakh. What's your offer?",
    },
  ]);
  const [userInput, setuserInput] = useState("");
  const [loading, setloading] = useState(false);
  return (
    <AichatConext.Provider
      value={{
        message,
        setMessage,
        userInput,
        setuserInput,
        loading,
        setloading,
      }}
    >
      {children}
    </AichatConext.Provider>
  );
};

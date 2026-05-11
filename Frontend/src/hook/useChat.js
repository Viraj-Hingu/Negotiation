import { useContext } from "react";
import { AichatConext } from "../context.chat";
import { sendMessage } from "../service/chat.api";

const useChat = () => {
  const context = useContext(AichatConext);

  if (!context) {
    throw new Error("useChat must be used inside AichatConextProvider");
  }

  const { message, setMessage, userInput, setuserInput, loading, setloading } =
    context;

  const getData = async (messages) => {
    try {
      setloading(true);
      return await sendMessage(messages);
    } finally {
      setloading(false);
    }
  };

  return {
    message,
    setMessage,
    userInput,
    setuserInput,
    loading,
    setloading,
    getData,
  };
};

export default useChat;

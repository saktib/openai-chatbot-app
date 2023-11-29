import React, { useState } from 'react';
import axios from 'axios';

function Chat() {
  const [context, setContext] = useState('');
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  const sendMessage = async () => {
    try {
      const response = await axios.post('http://localhost:3001/chat', { context, message });
      setChatHistory([...chatHistory, { sender: 'User', text: message }, { sender: 'AI', text: response.data.reply }]);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Context"
        value={context}
        onChange={(e) => setContext(e.target.value)}
      />
      <textarea
        placeholder="Your Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      ></textarea>
      <button onClick={sendMessage}>Send</button>

      {chatHistory.map((msg, index) => (
        <p key={index}><strong>{msg.sender}:</strong> {msg.text}</p>
      ))}
    </div>
  );
}

export default Chat;

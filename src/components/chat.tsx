import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Message {
  id: string;
  gig_id: string;
  username: string;
  message: string;
  created_at: string;
}

const Chat: React.FC<{ gigId: string }> = ({ gigId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [username, setUsername] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const maxMessageLength = 250; // Limit to 250 characters

  useEffect(() => {
    // Fetch the username from local storage
    const token = localStorage.getItem('sb-vldhwuxhpskjvcdbwrir-auth-token');
    if (token) {
      const json = JSON.parse(token);
      setUsername(json.user?.user_metadata?.username || null);
    }

    // Fetch existing messages
    fetchMessages();
  }, [gigId]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('gig_id', gigId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setMessages(data || []);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !username) return;

    // Check if the message exceeds the limit
    if (newMessage.length > maxMessageLength) {
      setErrorMessage(`Message cannot exceed ${maxMessageLength} characters.`);
      return;
    }

    const newMsg = {
      gig_id: gigId,
      username: username,
      message: newMessage.trim(),
    };

    const { data, error } = await supabase
      .from('chat_messages')
      .insert([newMsg])
      .select();

    if (error) {
      console.error('Error sending message:', error);
    } else if (data) {
      setMessages([...messages, data[0]]);
      setNewMessage('');
      setErrorMessage(null); // Clear error message
    }
  };

  const deleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('Error deleting message:', error);
    } else {
      setMessages(messages.filter((msg) => msg.id !== messageId));
    }
  };

  return (
    <div className="bg-white shadow-2xl rounded-lg w-full h-full flex flex-col">
      <h2 className="text-2xl font-bold p-4 border-b border-black text-black">Chat</h2>
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`${msg.username === username ? 'text-right' : 'text-left'}`}>
            <p className="text-xs text-gray-600 mb-1">{msg.username}</p>
            <div className="flex items-center justify-between">
              <p
                className={`rounded-lg py-2 px-3 inline-block text-sm ${
                  msg.username === username ? 'bg-black text-white' : 'bg-gray-200 text-black'
                }`}
              >
                {msg.message}
              </p>
              {msg.username === username && (
                <button
                  onClick={() => deleteMessage(msg.id)}
                  className="ml-2 text-black hover:text-gray-700 text-xs"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} className="p-4 border-t border-black">
        {errorMessage && <p className="text-red-500 mb-2 text-xs">{errorMessage}</p>}
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="w-full px-3 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white text-black text-sm"
          maxLength={maxMessageLength}
        />
        <p className="text-xs text-gray-500 mt-1">
          {newMessage.length}/{maxMessageLength} characters
        </p>
        <button
          type="submit"
          className="mt-2 w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition duration-200 text-sm"
        >
          Send
        </button>
      </form>
    </div>
  )
}

export default Chat;

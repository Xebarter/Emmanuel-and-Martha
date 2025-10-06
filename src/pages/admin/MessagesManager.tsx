import React, { useEffect, useState } from 'react';
import { MessageSquare, Plus, X, Send, User, Clock, Trash2, Search } from 'lucide-react';
import { getMessages, addMessage, updateMessage, deleteMessage } from '../../services/messagesService';
import { supabase } from '../../lib/supabase';

type Message = {
  id: string;
  guest_id?: string;
  message: string;
  is_approved: boolean;
  created_at: string;
  guests?: {
    full_name: string;
    phone: string;
  } | null;
};

export default function MessagesManager() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    sender: '',
    content: ''
  });

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async (): Promise<void> => {
    setLoading(true);
    try {
      // First, get all messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('guest_messages')
        .select('id, guest_id, message, is_approved, created_at')
        .order('created_at', { ascending: false });
      
      if (messagesError) throw messagesError;
      
      // Then get guest information for each message
      const guestIds = messagesData
        .map(msg => msg.guest_id)
        .filter((id): id is string => id !== null && id !== undefined);
      
      let guestsData: any[] = [];
      if (guestIds.length > 0) {
        const { data, error: guestsError } = await supabase
          .from('guests')
          .select('id, full_name, phone')
          .in('id', guestIds);
        
        if (guestsError) throw guestsError;
        guestsData = data || [];
      }
      
      // Combine messages with guest data
      const combinedData = messagesData.map(message => {
        const guest = guestsData.find(g => g.id === message.guest_id) || null;
        return {
          ...message,
          guests: guest ? { full_name: guest.full_name, phone: guest.phone } : null
        };
      });
      
      setMessages(combinedData);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
    setLoading(false);
  };

  const handleAddMessage = async (message: Omit<Message, 'id'>): Promise<void> => {
    setLoading(true);
    try {
      // Ensure required fields are present
      if (!message.message) {
        throw new Error('Message text is required');
      }
      await addMessage({
        guest_id: message.guest_id,
        message: message.message,
        is_approved: message.is_approved ?? false,
      });
      await fetchMessages();
    } catch (err) {
      console.error('Error adding message:', err);
    }
    setLoading(false);
  };

  const handleUpdateMessage = async (id: string, updates: Partial<Message>): Promise<void> => {
    setLoading(true);
    try {
      await updateMessage(id, updates);
      await fetchMessages();
    } catch (err) {
      console.error('Error updating message:', err);
    }
    setLoading(false);
  };

  const handleDeleteMessage = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      await deleteMessage(id);
      await fetchMessages();
    } catch (err) {
      console.error('Error deleting message:', err);
    }
    setLoading(false);
  };

  const handleSubmit = () => {
    if (!formData.sender || !formData.content) return;

    // This function is for the manual message creation modal, not connected to guest messages
    closeModal();
  };

  const openModal = () => {
    setFormData({ sender: '', content: '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({ sender: '', content: '' });
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const filteredMessages = messages.filter(msg =>
  (msg.guests?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.message?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Messages</h1>
                  <p className="text-indigo-100 text-sm">
                    {messages.length > 0 ? `${messages.length} messages` : 'No messages yet'}
                  </p>
                </div>
              </div>
              <button
                onClick={openModal}
                className="inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-lg bg-white text-indigo-600 hover:bg-indigo-50 transition-colors shadow-md"
              >
                <Plus className="mr-2 h-4 w-4" /> New Message
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="px-8 py-4 bg-slate-50 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-pulse flex space-x-4 items-center">
                  <div className="h-12 w-12 bg-slate-200 rounded-full"></div>
                  <div className="space-y-3">
                    <div className="h-4 w-48 bg-slate-200 rounded"></div>
                    <div className="h-4 w-36 bg-slate-200 rounded"></div>
                  </div>
                </div>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  {searchTerm ? 'No messages found' : 'No messages yet'}
                </h3>
                <p className="text-slate-500 mb-6">
                  {searchTerm ? 'Try a different search term' : 'Messages from guests will appear here'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={openModal}
                    className="inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="mr-2 h-4 w-4" /> New Message
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMessages.map(message => (
                  <div
                    key={message.id}
                    className={`group relative bg-white border rounded-xl p-5 transition-all hover:shadow-md ${message.is_approved ? 'border-slate-200' : 'border-amber-200 bg-amber-50 bg-opacity-30'
                      }`}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {getInitials(message.guests?.full_name || 'Anonymous')}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-base font-semibold text-slate-900 flex items-center">
                            {message.guests?.full_name || 'Anonymous Guest'}
                            {!message.is_approved && (
                              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-amber-600 text-white rounded-full">
                                Pending Approval
                              </span>
                            )}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center text-xs text-slate-500">
                              <Clock className="h-3.5 w-3.5 mr-1" />
                              {formatTimestamp(message.created_at)}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMessage(message.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition-all p-1 rounded hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed">
                          {message.message}
                        </p>
                        <div className="flex items-center mt-3 space-x-3">
                          <span className="text-xs text-slate-500">
                            {message.guests?.phone || 'No phone provided'}
                          </span>
                          <button
                            onClick={() => handleUpdateMessage(message.id, { is_approved: !message.is_approved })}
                            className={`text-xs px-2 py-1 rounded ${message.is_approved 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}`}
                          >
                            {message.is_approved ? 'Approved' : 'Approve Message'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <Send className="mr-2 h-5 w-5" />
                New Message
              </h3>
              <button
                onClick={closeModal}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Recipient
                </label>
                <input
                  type="text"
                  placeholder="Enter recipient name"
                  value={formData.sender}
                  onChange={(e) => setFormData({ ...formData, sender: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Message
                </label>
                <textarea
                  placeholder="Type your message here..."
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={closeModal}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
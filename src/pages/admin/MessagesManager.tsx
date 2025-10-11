import React, { useEffect, useState } from 'react';
import { MessageSquare, Plus, X, Send, User, Clock, Trash2, Search, CheckCircle, AlertCircle, Filter, Eye, EyeOff, ChevronDown, ChevronUp, Edit3 } from 'lucide-react';
import { getMessages, addMessage, updateMessage, deleteMessage, bulkUpdateMessages, bulkDeleteMessages } from '../../services/messagesService';
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
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<'approve' | 'unapprove' | 'delete' | ''>('');
  const [showFilters, setShowFilters] = useState(false);
  const [formData, setFormData] = useState({
    sender: '',
    content: '',
    is_approved: false
  });

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await getMessages();
      setMessages(data);
    } catch (err) {
      console.error('Error in fetchMessages:', err);
    }
    setLoading(false);
  };

  const handleAddMessage = async (): Promise<void> => {
    if (!formData.content) return;
    
    setLoading(true);
    try {
      await addMessage({
        message: formData.content,
        is_approved: formData.is_approved,
      });
      await fetchMessages();
      closeModal();
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
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    
    setLoading(true);
    try {
      await deleteMessage(id);
      await fetchMessages();
      // Remove from selected messages if it was selected
      setSelectedMessages(selectedMessages.filter(msgId => msgId !== id));
    } catch (err) {
      console.error('Error deleting message:', err);
    }
    setLoading(false);
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedMessages.length === 0) return;

    setLoading(true);
    try {
      switch (bulkAction) {
        case 'approve':
          await Promise.all(
            selectedMessages.map(id => updateMessage(id, { is_approved: true }))
          );
          break;
        case 'unapprove':
          await Promise.all(
            selectedMessages.map(id => updateMessage(id, { is_approved: false }))
          );
          break;
        case 'delete':
          await Promise.all(
            selectedMessages.map(id => deleteMessage(id))
          );
          setSelectedMessages([]);
          break;
      }
      await fetchMessages();
    } catch (err) {
      console.error(`Error performing bulk ${bulkAction}:`, err);
    }
    setLoading(false);
    setBulkAction('');
  };

  const handleSubmit = async () => {
    if (!formData.content) return;

    if (editingMessage) {
      // Update existing message
      await handleUpdateMessage(editingMessage.id, {
        message: formData.content,
        is_approved: formData.is_approved
      });
    } else {
      // Add new message
      await handleAddMessage();
    }
    
    closeModal();
  };

  const openAddModal = () => {
    setEditingMessage(null);
    setFormData({ 
      sender: '', 
      content: '',
      is_approved: false
    });
    setShowModal(true);
  };

  const openEditModal = (message: Message) => {
    setEditingMessage(message);
    setFormData({ 
      sender: message.guests?.full_name || '', 
      content: message.message,
      is_approved: message.is_approved
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMessage(null);
    setFormData({ 
      sender: '', 
      content: '',
      is_approved: false
    });
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

  const toggleSelectMessage = (id: string) => {
    if (selectedMessages.includes(id)) {
      setSelectedMessages(selectedMessages.filter(msgId => msgId !== id));
    } else {
      setSelectedMessages([...selectedMessages, id]);
    }
  };

  const selectAllMessages = () => {
    if (selectedMessages.length === filteredMessages.length) {
      setSelectedMessages([]);
    } else {
      setSelectedMessages(filteredMessages.map(msg => msg.id));
    }
  };

  const filteredMessages = messages
    .filter(msg => {
      const matchesSearch = msg.guests?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.message?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterStatus === 'all' || 
        (filterStatus === 'approved' && msg.is_approved) || 
        (filterStatus === 'pending' && !msg.is_approved);
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5 sm:px-8 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Messages Management</h1>
                  <p className="text-indigo-100 text-sm">
                    {messages.length > 0 ? `${messages.length} messages` : 'No messages yet'}
                  </p>
                </div>
              </div>
              <button
                onClick={openAddModal}
                className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg bg-white text-indigo-600 hover:bg-indigo-50 transition-colors shadow-md"
              >
                <Plus className="mr-2 h-4 w-4" /> New Message
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Filters and Actions */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  <Filter className="h-4 w-4 mr-1.5" />
                  Filters
                  {showFilters ? (
                    <ChevronUp className="h-4 w-4 ml-1" />
                  ) : (
                    <ChevronDown className="h-4 w-4 ml-1" />
                  )}
                </button>

                {selectedMessages.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <select
                      value={bulkAction}
                      onChange={(e) => setBulkAction(e.target.value as any)}
                      className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    >
                      <option value="">Bulk actions</option>
                      <option value="approve">Approve selected</option>
                      <option value="unapprove">Unapprove selected</option>
                      <option value="delete">Delete selected</option>
                    </select>
                    <button
                      onClick={handleBulkAction}
                      disabled={!bulkAction}
                      className={`px-3 py-2 text-sm font-medium rounded-lg ${bulkAction 
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                        : 'bg-slate-200 text-slate-500 cursor-not-allowed'}`}
                    >
                      Apply
                    </button>
                    <span className="text-sm text-slate-600 ml-2">
                      {selectedMessages.length} selected
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-slate-700">Status:</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setFilterStatus('all')}
                      className={`px-3 py-1.5 text-sm rounded-full ${filterStatus === 'all' 
                        ? 'bg-indigo-100 text-indigo-800 font-medium' 
                        : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setFilterStatus('approved')}
                      className={`px-3 py-1.5 text-sm rounded-full flex items-center ${filterStatus === 'approved' 
                        ? 'bg-green-100 text-green-800 font-medium' 
                        : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approved
                    </button>
                    <button
                      onClick={() => setFilterStatus('pending')}
                      className={`px-3 py-1.5 text-sm rounded-full flex items-center ${filterStatus === 'pending' 
                        ? 'bg-amber-100 text-amber-800 font-medium' 
                        : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Pending
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-slate-700">Sort:</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSortBy('newest')}
                      className={`px-3 py-1.5 text-sm rounded-full ${sortBy === 'newest' 
                        ? 'bg-indigo-100 text-indigo-800 font-medium' 
                        : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      Newest
                    </button>
                    <button
                      onClick={() => setSortBy('oldest')}
                      className={`px-3 py-1.5 text-sm rounded-full ${sortBy === 'oldest' 
                        ? 'bg-indigo-100 text-indigo-800 font-medium' 
                        : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      Oldest
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 md:p-8">
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
                  {searchTerm || filterStatus !== 'all' ? 'No messages found' : 'No messages yet'}
                </h3>
                <p className="text-slate-500 mb-6">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Try a different search term or filter' 
                    : 'Messages from guests will appear here'}
                </p>
                {!(searchTerm || filterStatus !== 'all') && (
                  <button
                    onClick={openModal}
                    className="inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="mr-2 h-4 w-4" /> New Message
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Filter Options */}
                {showFilters && (
                  <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-slate-700">Status:</span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setFilterStatus('all')}
                          className={`px-3 py-1.5 text-sm rounded-full ${filterStatus === 'all' 
                            ? 'bg-indigo-100 text-indigo-800 font-medium' 
                            : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => setFilterStatus('approved')}
                          className={`px-3 py-1.5 text-sm rounded-full flex items-center ${filterStatus === 'approved' 
                            ? 'bg-green-100 text-green-800 font-medium' 
                            : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approved
                        </button>
                        <button
                          onClick={() => setFilterStatus('pending')}
                          className={`px-3 py-1.5 text-sm rounded-full flex items-center ${filterStatus === 'pending' 
                            ? 'bg-amber-100 text-amber-800 font-medium' 
                            : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                          <AlertCircle className="h-4 w-4 mr-1" />
                          Pending
                        </button>
                      </div>
                    </div>
                
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-slate-700">Sort:</span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSortBy('newest')}
                          className={`px-3 py-1.5 text-sm rounded-full ${sortBy === 'newest' 
                            ? 'bg-indigo-100 text-indigo-800 font-medium' 
                            : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                          Newest
                        </button>
                        <button
                          onClick={() => setSortBy('oldest')}
                          className={`px-3 py-1.5 text-sm rounded-full ${sortBy === 'oldest' 
                            ? 'bg-indigo-100 text-indigo-800 font-medium' 
                            : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                          Oldest
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                            
                {/* Selection Info */}
                {selectedMessages.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-indigo-800">
                        {selectedMessages.length} of {filteredMessages.length} messages selected
                      </div>
                      <button
                        onClick={() => setSelectedMessages([])}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Clear selection
                      </button>
                    </div>
                  </div>
                )}

                {/* Messages List */}
                <div className="space-y-4">
                  {filteredMessages.map(message => (
                    <div
                      key={message.id}
                      className={`group relative bg-white border rounded-xl p-5 transition-all hover:shadow-md ${message.is_approved ? 'border-slate-200' : 'border-amber-200 bg-amber-50 bg-opacity-30'}`}
                    >
                      <div className="flex items-start space-x-4">
                        {/* Checkbox */}
                        <div className="pt-1">
                          <input
                            type="checkbox"
                            checked={selectedMessages.includes(message.id)}
                            onChange={() => toggleSelectMessage(message.id)}
                            className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </div>

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
                                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-amber-600 text-white rounded-full flex items-center">
                                  <AlertCircle className="h-3 w-3 mr-1" />
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
                                onClick={() => openEditModal(message)}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600 transition-all p-1 rounded hover:bg-indigo-50"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
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
                          <div className="flex flex-wrap items-center mt-3 space-x-3">
                            <span className="text-xs text-slate-500">
                              {message.guests?.phone || 'No phone provided'}
                            </span>
                            <button
                              onClick={() => handleUpdateMessage(message.id, { is_approved: !message.is_approved })}
                              className={`text-xs px-2 py-1 rounded flex items-center ${message.is_approved 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}`}
                            >
                              {message.is_approved ? (
                                <>
                                  <Eye className="h-3 w-3 mr-1" />
                                  Approved
                                </>
                              ) : (
                                <>
                                  <EyeOff className="h-3 w-3 mr-1" />
                                  Approve Message
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
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
                {editingMessage ? 'Edit Message' : 'New Message'}
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
                  Sender Name
                </label>
                <input
                  type="text"
                  placeholder="Enter sender name"
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
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="approved"
                  checked={formData.is_approved}
                  onChange={(e) => setFormData({ ...formData, is_approved: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="approved" className="ml-2 block text-sm text-slate-700">
                  Approved
                </label>
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
                  disabled={!formData.content.trim()}
                  className={`px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-colors ${
                    formData.content.trim() 
                      ? 'bg-indigo-600 hover:bg-indigo-700' 
                      : 'bg-indigo-300 cursor-not-allowed'
                  }`}
                >
                  {editingMessage ? 'Update Message' : 'Send Message'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
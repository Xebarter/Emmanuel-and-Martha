import React, { useEffect, useState } from 'react';
import { Calendar, Plus, Edit2, Trash2, X, Clock } from 'lucide-react';
import { getMeetings, addMeeting, updateMeeting, deleteMeeting } from '../../services/meetingsService';

type Meeting = {
  id: string;
  title: string;
  description?: string;
  location?: string;
  starts_at?: string;
  ends_at?: string;
  created_by?: string;
};

export default function MeetingsManager() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: ''
  });

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await getMeetings();
      setMeetings(data || []);
    } catch (err) {
      // Optionally handle error
    }
    setLoading(false);
  };

  const handleAddMeeting = async (meeting: Omit<Meeting, 'id'>): Promise<void> => {
    setLoading(true);
    try {
      await addMeeting(meeting);
      await fetchMeetings();
    } catch (err) {
      // Optionally handle error
    }
    setLoading(false);
  };

  const handleUpdateMeeting = async (id: string, updates: Partial<Meeting>): Promise<void> => {
    setLoading(true);
    try {
      await updateMeeting(id, updates);
      await fetchMeetings();
    } catch (err) {
      // Optionally handle error
    }
    setLoading(false);
  };

  const handleDeleteMeeting = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      await deleteMeeting(id);
      await fetchMeetings();
    } catch (err) {
      // Optionally handle error
    }
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editingMeeting) {
      setMeetings(meetings.map(m =>
        m.id === editingMeeting.id
          ? { ...formData, id: editingMeeting.id }
          : m
      ));
    } else {
      if (formData.title && formData.date && formData.time) {
        const newMeeting = {
          ...formData,
          id: `${Date.now()}`
        };
        setMeetings([...meetings, newMeeting]);
      }
    }
    closeModal();
  };

  const openModal = (meeting = null) => {
    if (meeting) {
      setEditingMeeting(meeting);
      setFormData(meeting);
    } else {
      setEditingMeeting(null);
      setFormData({ title: '', date: '', time: '' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMeeting(null);
    setFormData({ title: '', date: '', time: '' });
  };

  const deleteMeeting = (id) => {
    setMeetings(meetings.filter(m => m.id !== id));
  };

  const formatTime = (time?: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  const formatDate = (date?: string) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-rose-500 to-pink-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Meetings Manager</h1>
                  <p className="text-rose-100 text-sm">Schedule and organize your events</p>
                </div>
              </div>
              <button
                onClick={() => openModal()}
                className="inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-lg bg-white text-rose-600 hover:bg-rose-50 transition-colors shadow-md"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Meeting
              </button>
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
            ) : meetings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No meetings scheduled</h3>
                <p className="text-slate-500 mb-6">Get started by adding your first meeting</p>
                <button
                  onClick={() => openModal()}
                  className="inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Meeting
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Meeting Title
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {meetings.map(meeting => (
                      <tr key={meeting.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-rose-400 to-pink-500 rounded-lg flex items-center justify-center">
                              <Calendar className="h-5 w-5 text-white" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-slate-900">{meeting.title}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900 font-medium">{formatDate(meeting.date)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-slate-600">
                            <Clock className="h-4 w-4 mr-1.5 text-slate-400" />
                            {formatTime(meeting.time)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => openModal(meeting)}
                            className="text-rose-600 hover:text-rose-900 mr-4 transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteMeeting(meeting.id)}
                            className="text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-rose-500 to-pink-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">
                {editingMeeting ? 'Edit Meeting' : 'Add New Meeting'}
              </h3>
              <button
                onClick={closeModal}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Meeting Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all"
                  placeholder="e.g., Team Meeting"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Time
                </label>
                <input
                  type="time"
                  required
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg font-semibold hover:from-rose-600 hover:to-pink-700 transition-all shadow-md"
                >
                  {editingMeeting ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
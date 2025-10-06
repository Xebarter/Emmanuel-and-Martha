import { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit2, 
  MessageSquare, 
  Trash2, 
  UserCheck, 
  Clock, 
  UserX, 
  Plus, 
  Download,
  Mail,
  Phone,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { getGuests, getMeetingRegisteredGuests, addGuest, updateGuest, deleteGuest } from '../../services/guestsService';
import type { Guest } from '../../lib/types';

export default function GuestsManager() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchGuests();
  }, []);

  const fetchGuests = async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await getMeetingRegisteredGuests();
      setGuests(data || []);
    } catch (err) {
      // Optionally handle error
    }
    setLoading(false);
  };

  const handleAddGuest = async (guest: Omit<Guest, 'id'>): Promise<void> => {
    setLoading(true);
    try {
      // Ensure required fields are present
      if (!guest.full_name || !guest.phone) {
        throw new Error('Full name and phone are required');
      }
      await addGuest({
        full_name: guest.full_name,
        phone: guest.phone,
        email: guest.email ?? '',
        message: guest.message ?? ''
      });
      await fetchGuests();
    } catch (err) {
      // Optionally handle error
    }
    setLoading(false);
  };

  const handleUpdateGuest = async (id: string, updates: Partial<Guest>): Promise<void> => {
    setLoading(true);
    try {
      await updateGuest(id, updates);
      await fetchGuests();
    } catch (err) {
      // Optionally handle error
    }
    setLoading(false);
  };

  const handleDeleteGuest = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      await deleteGuest(id);
      await fetchGuests();
    } catch (err) {
      // Optionally handle error
    }
    setLoading(false);
  };

  const filteredGuests = guests.filter(g => {
    const matchesSearch = (g.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.email?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = selectedStatus === 'all' || (g.status?.toLowerCase() === selectedStatus.toLowerCase()) || (g.rsvp_status?.toLowerCase() === selectedStatus.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || g.category === selectedCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalPages = Math.ceil(filteredGuests.length / itemsPerPage);
  const paginatedGuests = filteredGuests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const confirmedCount = guests.filter(g => g.status === 'Confirmed' || g.rsvp_status === 'confirmed').length;
  const pendingCount = guests.filter(g => g.status === 'Pending' || g.rsvp_status === 'pending').length;
  const declinedCount = guests.filter(g => g.status === 'Declined' || g.rsvp_status === 'declined').length;
  const totalWithPlusOne = guests.filter(g => (g.status === 'Confirmed' || g.rsvp_status === 'confirmed') && g.plusOne).length;

  const handleAction = (action: string, id: string) => {
    console.log(`${action} guest ${id}`);
    setShowActionMenu(null);
  };

  const getInitials = (name: string = ''): string => {
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
  };

  const getAvatarColor = (id: string): string => {
    const colors = [
      'from-violet-500 to-purple-500',
      'from-blue-500 to-cyan-500',
      'from-emerald-500 to-teal-500',
      'from-orange-500 to-red-500',
      'from-pink-500 to-rose-500',
      'from-indigo-500 to-blue-500',
      'from-amber-500 to-yellow-500',
      'from-teal-500 to-green-500',
    ];
    const index = parseInt(id.replace(/\D/g, '')) || 0;
    return colors[index % colors.length];
  };

  const getStatusStyle = (status?: string): string => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
      case 'pending':
        return 'bg-gradient-to-r from-amber-400 to-orange-400 text-white';
      case 'declined':
        return 'bg-gradient-to-r from-red-500 to-rose-500 text-white';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return <CheckCircle className="h-3 w-3" />;
      case 'pending':
        return <Clock className="h-3 w-3" />;
      case 'declined':
        return <XCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">
              Guests Management
            </h1>
            <p className="text-slate-600">Manage invitations and track guest responses</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={fetchGuests}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white text-slate-700 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm transition-all duration-200"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white hover:from-purple-700 hover:to-violet-700 shadow-lg shadow-purple-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-105 flex-1 sm:flex-none">
              <Plus className="h-4 w-4" />
              Add Guest
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Confirmed</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900">{confirmedCount}</p>
            <p className="text-xs text-slate-500 mt-2">+{totalWithPlusOne} with plus one</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Pending</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900">{pendingCount}</p>
            <p className="text-xs text-slate-500 mt-2">Awaiting response</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-red-100 to-rose-100 rounded-xl">
                <UserX className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Declined</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900">{declinedCount}</p>
            <p className="text-xs text-slate-500 mt-2">Unable to attend</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Total Guests</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900">{guests.length}</p>
            <p className="text-xs text-slate-500 mt-2">All invitations</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Controls Bar */}
          <div className="p-4 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl shadow-lg shadow-purple-500/30">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Guest List</h2>
                  <p className="text-xs text-slate-500">View and manage all guest information</p>
                </div>
              </div>

              <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors duration-150">
                <MessageSquare className="h-4 w-4" />
                Send Invites
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-full border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm placeholder:text-slate-400"
                />
              </div>

              <div className="flex gap-3">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="pl-10 pr-8 py-2.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-medium text-slate-700 bg-white appearance-none cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-medium text-slate-700 bg-white"
                >
                  <option value="all">All Categories</option>
                  <option value="Family">Family</option>
                  <option value="Friends">Friends</option>
                  <option value="Colleagues">Colleagues</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-200 rounded-full"></div>
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                  </div>
                  <p className="text-slate-600 font-semibold">Loading guests...</p>
                </div>
              </div>
            ) : filteredGuests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="p-6 bg-slate-100 rounded-full mb-4">
                  <Users className="h-12 w-12 text-slate-400" />
                </div>
                <p className="text-slate-900 font-semibold text-lg mb-1">No guests found</p>
                <p className="text-slate-500 text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Guest
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider hidden lg:table-cell">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider hidden md:table-cell">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider hidden sm:table-cell">
                      Plus One
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedGuests.map((guest, index) => (
                    <tr
                      key={guest.id}
                      className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-transparent transition-all duration-200 group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${getAvatarColor(guest.id)} flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                            {getInitials(guest.name || guest.full_name || '')}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{guest.name || guest.full_name}</p>
                            <p className="text-xs text-slate-500">{guest.dietary !== 'None' ? `🍽️ ${guest.dietary}` : 'No dietary restrictions'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Mail className="h-3 w-3 text-slate-400" />
                            {guest.email}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {guest.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                          {guest.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${guest.plusOne ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                          {guest.plusOne ? '✓ Yes' : '✗ No'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${getStatusStyle(guest.status)}`}>
                          {getStatusIcon(guest.status)}
                          {guest.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setShowActionMenu(showActionMenu === guest.id ? null : guest.id)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-150 group/btn"
                          >
                            <MoreVertical className="h-4 w-4 text-slate-600 group-hover/btn:text-slate-900" />
                          </button>

                          {showActionMenu === guest.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-10 animate-in fade-in slide-in-from-top-2 duration-200">
                              <button
                                onClick={() => handleAction('view', guest.id)}
                                className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                              >
                                <Eye className="h-4 w-4 text-blue-600" />
                                View Details
                              </button>
                              <button
                                onClick={() => handleAction('edit', guest.id)}
                                className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                              >
                                <Edit2 className="h-4 w-4 text-emerald-600" />
                                Edit Guest
                              </button>
                              <button
                                onClick={() => handleAction('message', guest.id)}
                                className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                              >
                                <MessageSquare className="h-4 w-4 text-purple-600" />
                                Send Message
                              </button>
                              <div className="my-1 border-t border-slate-200"></div>
                              <button
                                onClick={() => handleAction('delete', guest.id)}
                                className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                                Remove Guest
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Enhanced Footer with Pagination */}
          {!loading && filteredGuests.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <p className="text-sm text-slate-600">
                  Showing <span className="font-bold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-bold text-slate-900">{Math.min(currentPage * itemsPerPage, filteredGuests.length)}</span> of{' '}
                  <span className="font-bold text-slate-900">{filteredGuests.length}</span> guests
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border-2 border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 hover:border-slate-300"
                  >
                    Previous
                  </button>

                  <div className="flex gap-1">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-10 h-10 text-sm font-bold rounded-lg transition-all duration-150 ${currentPage === i + 1
                          ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-500/30'
                          : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-violet-600 rounded-lg hover:from-purple-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-lg shadow-purple-500/30"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
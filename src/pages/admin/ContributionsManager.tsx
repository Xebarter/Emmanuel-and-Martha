import React, { useEffect, useState } from 'react';
import { Gift, Plus, Search, MoreVertical, TrendingUp, Users, DollarSign, Calendar, Filter, Download, RefreshCw, Edit2, Trash2, Eye } from 'lucide-react';
import { getContributions, addContribution, updateContribution, deleteContribution } from '../../services/contributionsService';

type Contribution = {
  id: string;
  guest_id?: string;
  name?: string;
  email?: string;
  amount: number;
  currency?: string;
  status: string;
  type?: string;
  metadata?: any;
  created_at?: string;
  date?: string;
  contributor_name?: string;
  contributor_email?: string;
  contributor_phone?: string;
  message?: string;
  pesapal_tracking_id?: string;
};

export default function ContributionsManager() {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchContributions();
  }, []);

  const fetchContributions = async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await getContributions();
      setContributions(data || []);
    } catch (err) {
      console.error('Error fetching contributions:', err);
    }
    setLoading(false);
  };

  const handleAddContribution = async (contribution: Omit<Contribution, 'id'>): Promise<void> => {
    setLoading(true);
    try {
      // Ensure required fields are present
      if (!contribution.amount || !contribution.currency || !contribution.status) {
        throw new Error('Amount, currency, and status are required');
      }
      await addContribution({
        guest_id: contribution.guest_id,
        amount: contribution.amount,
        currency: contribution.currency,
        status: contribution.status,
        metadata: contribution.metadata ?? {},
        contributor_name: contribution.contributor_name,
        contributor_email: contribution.contributor_email,
        contributor_phone: contribution.contributor_phone,
        message: contribution.message
      });
      await fetchContributions();
    } catch (err) {
      console.error('Error adding contribution:', err);
    }
    setLoading(false);
  };

  const handleUpdateContribution = async (id: string, updates: Partial<Contribution>): Promise<void> => {
    setLoading(true);
    try {
      await updateContribution(id, updates);
      await fetchContributions();
    } catch (err) {
      console.error('Error updating contribution:', err);
    }
    setLoading(false);
  };

  const handleDeleteContribution = async (id: string): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this contribution?')) {
      return;
    }
    
    setLoading(true);
    try {
      await deleteContribution(id);
      await fetchContributions();
    } catch (err) {
      console.error('Error deleting contribution:', err);
    }
    setLoading(false);
  };

  const handleAction = (action: string, id: string) => {
    console.log(`${action} contribution ${id}`);
    setShowActionMenu(null);
    
    switch (action) {
      case 'view':
        // Implement view details functionality
        break;
      case 'edit':
        // Implement edit functionality
        break;
      case 'delete':
        handleDeleteContribution(id);
        break;
      default:
        break;
    }
  };

  const filteredContributions = contributions.filter(c => {
    const matchesSearch = !searchQuery || 
      (c.contributor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contributor_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = selectedStatus === 'all' || c.status === selectedStatus || 
      (selectedStatus === 'pending' && (c.status === 'pending' || c.status === 'pending_payment'));
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredContributions.length / itemsPerPage);
  const paginatedContributions = filteredContributions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalAmount = contributions.reduce((sum, c) => sum + c.amount, 0);
  const avgContribution = contributions.length > 0 ? totalAmount / contributions.length : 0;
  const completedCount = contributions.filter(c => c.status === 'completed').length;
  const pendingAmount = contributions
    .filter(c => c.status === 'pending' || c.status === 'pending_payment')
    .reduce((sum, c) => sum + c.amount, 0);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getInitials = (name: string = 'U') => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getAvatarColor = (id: string) => {
    const colors = [
      'from-rose-500 to-pink-500',
      'from-blue-500 to-indigo-500',
      'from-emerald-500 to-teal-500',
      'from-amber-500 to-orange-500',
      'from-purple-500 to-violet-500',
      'from-cyan-500 to-sky-500',
    ];
    const index = parseInt(id.replace(/[^0-9]/g, '')) || 0;
    return colors[index % colors.length];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
              Contributions Dashboard
            </h1>
            <p className="text-slate-600">Manage and track all contributions in real-time</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={fetchContributions}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white text-slate-700 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white hover:from-rose-700 hover:to-pink-700 shadow-lg shadow-rose-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-rose-500/40 hover:scale-105 flex-1 sm:flex-none">
              <Plus className="h-4 w-4" />
              Add Contribution
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-rose-100 to-pink-100 rounded-xl">
                <DollarSign className="h-6 w-6 text-rose-600" />
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 bg-green-100 rounded-full">
                <TrendingUp className="h-3 w-3 text-green-700" />
                <span className="text-xs text-green-700 font-bold">12.5%</span>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Total Amount</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900">{formatCurrency(totalAmount)}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 bg-green-100 rounded-full">
                <TrendingUp className="h-3 w-3 text-green-700" />
                <span className="text-xs text-green-700 font-bold">8.2%</span>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Total Contributors</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900">{contributions.length}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl">
                <Gift className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Avg Contribution</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900">{formatCurrency(avgContribution)}</p>
            <p className="text-xs text-slate-500 mt-2">{completedCount} completed</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl">
                <Calendar className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Pending Amount</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900">{formatCurrency(pendingAmount)}</p>
            <p className="text-xs text-slate-500 mt-2">{contributions.length - completedCount} pending</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Controls Bar */}
          <div className="p-4 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl shadow-lg shadow-rose-500/30">
                  <Gift className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Contributions Management</h2>
                  <p className="text-xs text-slate-500">View and manage all contribution records</p>
                </div>
              </div>

              <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors duration-150 shadow-sm">
                <Download className="h-4 w-4" />
                Export Data
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
                  className="pl-10 pr-4 py-2.5 w-full border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm placeholder:text-slate-400"
                />
              </div>

              <div className="flex gap-3">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="pl-10 pr-8 py-2.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm font-medium text-slate-700 bg-white appearance-none cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="pending_payment">Pending Payment</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm font-medium text-slate-700 bg-white"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
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
                    <div className="w-16 h-16 border-4 border-rose-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                  </div>
                  <p className="text-slate-600 font-semibold">Loading contributions...</p>
                </div>
              </div>
            ) : filteredContributions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="p-6 bg-slate-100 rounded-full mb-4">
                  <Gift className="h-12 w-12 text-slate-400" />
                </div>
                <p className="text-slate-900 font-semibold text-lg mb-1">No contributions found</p>
                <p className="text-slate-500 text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Contributor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider hidden sm:table-cell">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider hidden md:table-cell">
                      Type
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
                  {paginatedContributions.map((contribution, index) => (
                    <tr
                      key={contribution.id}
                      className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-transparent transition-all duration-200 group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${getAvatarColor(contribution.id)} flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                            {getInitials(contribution.contributor_name || contribution.name)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{contribution.contributor_name || contribution.name || 'Anonymous'}</p>
                            <p className="text-xs text-slate-500">{contribution.message || 'No message'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">
                          {contribution.contributor_email || contribution.email || contribution.contributor_phone || 'No contact'}
                        </div>
                        {(contribution.contributor_phone && contribution.contributor_phone !== (contribution.contributor_email || contribution.email)) ? (
                          <div className="text-xs text-slate-500">
                            {contribution.contributor_phone}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-base font-bold text-slate-900">{formatCurrency(contribution.amount)}</span>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          {contribution.created_at ? new Date(contribution.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          }) : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                          {contribution.type === 'recurring' ? '🔄 Recurring' : '⚡ One-time'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${
                          contribution.status === 'completed'
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                            : (contribution.status === 'pending' || contribution.status === 'pending_payment')
                            ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white'
                            : 'bg-gradient-to-r from-slate-400 to-slate-500 text-white'
                        }`}>
                          {contribution.status === 'completed' 
                            ? '✓ Completed' 
                            : (contribution.status === 'pending' || contribution.status === 'pending_payment')
                            ? '⏱ Pending' 
                            : contribution.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setShowActionMenu(showActionMenu === contribution.id ? null : contribution.id)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-150 group/btn"
                          >
                            <MoreVertical className="h-4 w-4 text-slate-600 group-hover/btn:text-slate-900" />
                          </button>

                          {showActionMenu === contribution.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-10 animate-in fade-in slide-in-from-top-2 duration-200">
                              <button
                                onClick={() => handleAction('view', contribution.id)}
                                className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                              >
                                <Eye className="h-4 w-4 text-blue-600" />
                                View Details
                              </button>
                              <button
                                onClick={() => handleAction('edit', contribution.id)}
                                className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                              >
                                <Edit2 className="h-4 w-4 text-emerald-600" />
                                Edit
                              </button>
                              <div className="my-1 border-t border-slate-200"></div>
                              <button
                                onClick={() => handleAction('delete', contribution.id)}
                                className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
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
          {!loading && filteredContributions.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <p className="text-sm text-slate-600">
                  Showing <span className="font-bold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-bold text-slate-900">{Math.min(currentPage * itemsPerPage, filteredContributions.length)}</span> of{' '}
                  <span className="font-bold text-slate-900">{filteredContributions.length}</span> contributions
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
                          ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg shadow-rose-500/30'
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
                    className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-rose-600 to-pink-600 rounded-lg hover:from-rose-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-lg shadow-rose-500/30"
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
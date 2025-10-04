import React, { useEffect, useState } from 'react';
import { Gift, Search, MoreVertical, Calendar, Filter, RefreshCw, CheckCircle, XCircle, Package, DollarSign } from 'lucide-react';
import { getPledges, updatePledgeStatus, deletePledge } from '../../services/pledgesService';

type Pledge = {
  id: string;
  guest_id: string | null;
  type: 'money' | 'item';
  item_description: string | null;
  amount: number | null;
  quantity: number | null;
  status: 'pending' | 'fulfilled' | 'cancelled';
  phone: string;
  email: string | null;
  notes: string | null;
  created_at: string;
  fulfilled_at: string | null;
  guest?: {
    full_name: string;
  } | null;
};

export default function PledgesManager() {
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPledges();
  }, []);

  const fetchPledges = async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await getPledges();
      setPledges(data || []);
    } catch (err) {
      console.error('Error fetching pledges:', err);
    }
    setLoading(false);
  };

  const handleUpdatePledgeStatus = async (id: string, status: 'pending' | 'fulfilled' | 'cancelled') => {
    try {
      await updatePledgeStatus(id, status);
      await fetchPledges();
      setShowActionMenu(null);
    } catch (err) {
      console.error('Error updating pledge status:', err);
    }
  };

  const handleDeletePledge = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this pledge?')) {
      return;
    }
    
    try {
      await deletePledge(id);
      await fetchPledges();
    } catch (err) {
      console.error('Error deleting pledge:', err);
    }
  };

  const handleAction = (action: string, id: string) => {
    setShowActionMenu(null);
    
    switch (action) {
      case 'fulfilled':
        handleUpdatePledgeStatus(id, 'fulfilled');
        break;
      case 'cancelled':
        handleUpdatePledgeStatus(id, 'cancelled');
        break;
      case 'pending':
        handleUpdatePledgeStatus(id, 'pending');
        break;
      case 'delete':
        handleDeletePledge(id);
        break;
      default:
        break;
    }
  };

  const filteredPledges = pledges.filter(p => {
    const matchesSearch = !searchQuery || 
      (p.guest?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.item_description && p.item_description.toLowerCase().includes(searchQuery.toLowerCase())));
    
    const matchesStatus = selectedStatus === 'all' || p.status === selectedStatus;
    const matchesType = selectedType === 'all' || p.type === selectedType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const totalPages = Math.ceil(filteredPledges.length / itemsPerPage);
  const paginatedPledges = filteredPledges.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPledges = pledges.length;
  const fulfilledCount = pledges.filter(p => p.status === 'fulfilled').length;
  const pendingCount = pledges.filter(p => p.status === 'pending').length;
  const moneyPledgesTotal = pledges
    .filter(p => p.type === 'money' && p.amount)
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
              Pledges Dashboard
            </h1>
            <p className="text-slate-600">Manage and track all guest pledges</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={fetchPledges}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white text-slate-700 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                <Gift className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Total Pledges</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900">{totalPledges}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Fulfilled</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900">{fulfilledCount}</p>
            <p className="text-xs text-slate-500 mt-2">{totalPledges > 0 ? Math.round((fulfilledCount/totalPledges)*100) : 0}% fulfilled</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl">
                <Calendar className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Pending</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900">{pendingCount}</p>
            <p className="text-xs text-slate-500 mt-2">{totalPledges > 0 ? Math.round((pendingCount/totalPledges)*100) : 0}% pending</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Money Pledged</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900">{formatCurrency(moneyPledgesTotal)}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Controls Bar */}
          <div className="p-4 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg shadow-blue-500/30">
                  <Gift className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Pledges Management</h2>
                  <p className="text-xs text-slate-500">View and manage all guest pledges</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, phone, email or item..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-full border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder:text-slate-400"
                />
              </div>

              <div className="flex gap-3">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="pl-10 pr-8 py-2.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium text-slate-700 bg-white appearance-none cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="fulfilled">Fulfilled</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium text-slate-700 bg-white"
                >
                  <option value="all">All Types</option>
                  <option value="money">Money</option>
                  <option value="item">Item</option>
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
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                  </div>
                  <p className="text-slate-600 font-semibold">Loading pledges...</p>
                </div>
              </div>
            ) : filteredPledges.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="p-6 bg-slate-100 rounded-full mb-4">
                  <Gift className="h-12 w-12 text-slate-400" />
                </div>
                <p className="text-slate-900 font-semibold text-lg mb-1">No pledges found</p>
                <p className="text-slate-500 text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Guest
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider hidden sm:table-cell">
                      Date
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
                  {paginatedPledges.map((pledge) => (
                    <tr
                      key={pledge.id}
                      className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-transparent transition-all duration-200 group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${getAvatarColor(pledge.id)} flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                            {getInitials(pledge.guest?.full_name || '')}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {pledge.guest?.full_name || 'Anonymous'}
                            </p>
                            <p className="text-xs text-slate-500">{pledge.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          pledge.type === 'money' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {pledge.type === 'money' ? (
                            <>
                              <DollarSign className="h-3 w-3 mr-1" />
                              Money
                            </>
                          ) : (
                            <>
                              <Package className="h-3 w-3 mr-1" />
                              Item
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {pledge.type === 'money' ? (
                          <div>
                            <p className="text-base font-bold text-slate-900">
                              {pledge.amount ? formatCurrency(pledge.amount) : 'N/A'}
                            </p>
                            {pledge.notes && (
                              <p className="text-xs text-slate-500 mt-1">{pledge.notes}</p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {pledge.item_description || 'N/A'}
                            </p>
                            {pledge.quantity && (
                              <p className="text-xs text-slate-500">Qty: {pledge.quantity}</p>
                            )}
                            {pledge.notes && (
                              <p className="text-xs text-slate-500 mt-1">{pledge.notes}</p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          {formatDate(pledge.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${
                          pledge.status === 'fulfilled'
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                            : pledge.status === 'pending'
                            ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white'
                            : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                        }`}>
                          {pledge.status === 'fulfilled' 
                            ? '✓ Fulfilled' 
                            : pledge.status === 'pending' 
                            ? '⏱ Pending' 
                            : '✗ Cancelled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setShowActionMenu(showActionMenu === pledge.id ? null : pledge.id)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-150 group/btn"
                          >
                            <MoreVertical className="h-4 w-4 text-slate-600 group-hover/btn:text-slate-900" />
                          </button>

                          {showActionMenu === pledge.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-10 animate-in fade-in slide-in-from-top-2 duration-200">
                              {pledge.status !== 'fulfilled' && (
                                <button
                                  onClick={() => handleAction('fulfilled', pledge.id)}
                                  className="w-full px-4 py-2.5 text-left text-sm font-medium text-emerald-600 hover:bg-emerald-50 flex items-center gap-3 transition-colors"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Mark Fulfilled
                                </button>
                              )}
                              {pledge.status !== 'cancelled' && (
                                <button
                                  onClick={() => handleAction('cancelled', pledge.id)}
                                  className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                                >
                                  <XCircle className="h-4 w-4" />
                                  Mark Cancelled
                                </button>
                              )}
                              {pledge.status !== 'pending' && (
                                <button
                                  onClick={() => handleAction('pending', pledge.id)}
                                  className="w-full px-4 py-2.5 text-left text-sm font-medium text-amber-600 hover:bg-amber-50 flex items-center gap-3 transition-colors"
                                >
                                  <Calendar className="h-4 w-4" />
                                  Mark Pending
                                </button>
                              )}
                              <div className="my-1 border-t border-slate-200"></div>
                              <button
                                onClick={() => handleAction('delete', pledge.id)}
                                className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                              >
                                <XCircle className="h-4 w-4" />
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
          {!loading && filteredPledges.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <p className="text-sm text-slate-600">
                  Showing <span className="font-bold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-bold text-slate-900">{Math.min(currentPage * itemsPerPage, filteredPledges.length)}</span> of{' '}
                  <span className="font-bold text-slate-900">{filteredPledges.length}</span> pledges
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
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
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
                    className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-lg shadow-blue-500/30"
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
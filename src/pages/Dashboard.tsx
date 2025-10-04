import { useState, useEffect } from 'react';
import { getGuests } from '../services/guestsService';
import { getContributions } from '../services/contributionsService';
import { getActivities } from '../services/activitiesService';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Image,
  Users,
  Calendar,
  Gift,
  Menu,
  X,
  MessageSquare,
  DollarSign,
  Clock,
  CheckCircle,
  UserPlus,
  BarChart2,
  Activity,
  Plus,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Wrench,
  Package
} from 'lucide-react';
import { GalleryManager } from './admin/GalleryManager';
import { default as GuestsManager } from './admin/GuestsManager';
import MeetingsManager from './admin/MeetingsManager';
import { default as ContributionsManager } from './admin/ContributionsManager';
import MessagesManager from './admin/MessagesManager';
import PledgesManager from './admin/PledgesManager';
import { SupabaseTest } from './SupabaseTest';

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
};

const navigation: NavItem[] = [
  { name: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, path: '/' },
  { name: 'Gallery', icon: <Image className="w-5 h-5" />, path: '/gallery' },
  { name: 'Guests', icon: <Users className="w-5 h-5" />, path: '/guests' },
  { name: 'Meetings', icon: <Calendar className="w-5 h-5" />, path: '/meetings' },
  { name: 'Contributions', icon: <Gift className="w-5 h-5" />, path: '/contributions' },
  { name: 'Pledges', icon: <Package className="w-5 h-5" />, path: '/pledges' },
  { name: 'Messages', icon: <MessageSquare className="w-5 h-5" />, path: '/messages' },
  { name: 'Analytics', icon: <BarChart2 className="w-5 h-5" />, path: '/analytics' },
];

function DashboardContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isNavItemActive = (path: string) => {
    return location.pathname === `/dashboard${path}` ||
      (path !== '/' && location.pathname.startsWith(`/dashboard${path}`));
  };

  const currentNav = navigation.find((nav) => isNavItemActive(nav.path)) || navigation[0];

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between h-16 px-6 bg-gradient-to-r from-rose-600 to-pink-600">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Admin Panel</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = isNavItemActive(item.path);
              return (
                <Link
                  key={item.name}
                  to={`/dashboard${item.path}`}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${isActive
                    ? 'bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className={`mr-3 ${isActive ? 'text-rose-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                    {item.icon}
                  </span>
                  {item.name}
                  {isActive && (
                    <ChevronRight className="ml-auto w-4 h-4 text-rose-600" />
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-slate-200">
            <button className="flex items-center w-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
              <LogOut className="w-4 h-4 mr-3" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 bg-white border-r border-slate-200 shadow-sm">
          <div className="flex items-center h-16 px-6 bg-gradient-to-r from-rose-600 to-pink-600">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Admin Panel</span>
            </div>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = isNavItemActive(item.path);
              return (
                <Link
                  key={item.name}
                  to={`/dashboard${item.path}`}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${isActive
                    ? 'bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                  <span className={`mr-3 ${isActive ? 'text-rose-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                    {item.icon}
                  </span>
                  {item.name}
                  {isActive && (
                    <ChevronRight className="ml-auto w-4 h-4 text-rose-600" />
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-slate-200">
            <button className="flex items-center w-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
              <LogOut className="w-4 h-4 mr-3" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top navigation */}
        <div className="bg-white shadow-sm border-b border-slate-200">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden text-slate-600 hover:text-slate-900 focus:outline-none"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{currentNav.name}</h1>
                <p className="text-sm text-slate-500">Manage your wedding planning</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
              </button>
              <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                <Settings className="h-5 w-5" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">JD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="p-6">
            <Routes>
              <Route path="/gallery" element={<GalleryManager />} />
              <Route path="/guests" element={<GuestsManager />} />
              <Route path="/meetings" element={<MeetingsManager />} />
              <Route path="/contributions" element={<ContributionsManager />} />
              <Route path="/pledges" element={<PledgesManager />} />
              <Route path="/messages" element={<MessagesManager />} />
              <Route path="/supabase-test" element={<SupabaseTest />} />
              <Route path="/analytics" element={<AnalyticsPlaceholder />} />
              <Route path="/" element={<DashboardHome />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

function AnalyticsPlaceholder() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
      <BarChart2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-slate-900 mb-2">Analytics Coming Soon</h3>
      <p className="text-slate-600">Detailed analytics and insights will be available here.</p>
    </div>
  );
}

function DashboardHome() {
  const [stats, setStats] = useState({
    totalGuests: 0,
    confirmedGuests: 0,
    pendingRSVPs: 0,
    totalContributions: 0,
  });
  const [loading, setLoading] = useState(true);
  type ActivityType = {
    id: string;
    type: string;
    user: string;
    message: string;
    time: string;
  };
  const [recentActivities, setRecentActivities] = useState<ActivityType[]>([]);

  useEffect(() => {
    async function fetchStatsAndActivities() {
      setLoading(true);
      try {
        const guests = await getGuests();
        const contributions = await getContributions();
        const activities = await getActivities();

        setStats({
          totalGuests: guests.length,
          confirmedGuests: guests.filter(g => g.rsvp_status === 'confirmed').length,
          pendingRSVPs: guests.filter(g => g.rsvp_status === 'pending').length,
          totalContributions: contributions.reduce((sum, c) => sum + (c.amount || 0), 0),
        });
        setRecentActivities(
          activities.map(a => ({
            id: a.id,
            type: a.type,
            user: a.user,
            message: a.message,
            time: new Date(a.created_at).toLocaleString()
          }))
        );
      } catch (err) {
        // Optionally handle error
      }
      setLoading(false);
    }
    fetchStatsAndActivities();
  }, []);

  const StatCard = ({
    title,
    value,
    icon,
    change,
    changeType,
    gradient
  }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    change?: string;
    changeType?: 'increase' | 'decrease';
    gradient: string;
  }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600">{title}</p>
          {loading ? (
            <div className="mt-2 h-8 w-24 bg-slate-200 animate-pulse rounded"></div>
          ) : (
            <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          )}
          {change && !loading && (
            <div className={`mt-2 inline-flex items-center text-sm font-medium ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}>
              {changeType === 'increase' ? (
                <ArrowUp className="w-4 h-4 mr-1" />
              ) : (
                <ArrowDown className="w-4 h-4 mr-1" />
              )}
              {change} from last week
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${gradient}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const ActivityItem = ({ type, user, message, time }: { type: string; user: string; message: string; time: string }) => {
    const getActivityConfig = () => {
      switch (type) {
        case 'rsvp':
          return { icon: <CheckCircle className="w-5 h-5" />, color: 'bg-green-100 text-green-600' };
        case 'message':
          return { icon: <MessageSquare className="w-5 h-5" />, color: 'bg-blue-100 text-blue-600' };
        case 'contribution':
          return { icon: <DollarSign className="w-5 h-5" />, color: 'bg-amber-100 text-amber-600' };
        default:
          return { icon: <Activity className="w-5 h-5" />, color: 'bg-slate-100 text-slate-600' };
      }
    };

    const config = getActivityConfig();

    return (
      <div className="flex items-start space-x-3 pb-4 last:pb-0">
        <div className={`p-2 rounded-lg ${config.color} flex-shrink-0`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-slate-900 truncate">{user}</p>
            <span className="text-xs text-slate-500 whitespace-nowrap">{time}</span>
          </div>
          <p className="text-sm text-slate-600 mt-0.5">{message}</p>
        </div>
      </div>
    );
  };

  const QuickActionCard = ({
    icon,
    title,
    description,
    gradient,
    onClick
  }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    gradient: string;
    onClick?: () => void;
  }) => (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-xl hover:shadow-md hover:border-slate-300 transition-all group"
    >
      <div className={`p-4 rounded-xl ${gradient} mb-3 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <span className="text-sm font-semibold text-slate-900 mb-1">{title}</span>
      <span className="text-xs text-slate-500">{description}</span>
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Dashboard Overview</h2>
          <p className="text-slate-600 mt-1">
            Welcome back! Here's what's happening with your wedding planning.
          </p>
        </div>
        <button className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white text-sm font-semibold rounded-lg shadow-md hover:from-rose-700 hover:to-pink-700 transition-all">
          <Plus className="mr-2 h-4 w-4" />
          Add New Guest
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Guests"
          value={stats.totalGuests}
          icon={<Users className="w-6 h-6 text-white" />}
          change="+12%"
          changeType="increase"
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          title="Confirmed RSVPs"
          value={stats.confirmedGuests}
          icon={<CheckCircle className="w-6 h-6 text-white" />}
          change="+8%"
          changeType="increase"
          gradient="bg-gradient-to-br from-green-500 to-green-600"
        />
        <StatCard
          title="Pending RSVPs"
          value={stats.pendingRSVPs}
          icon={<Clock className="w-6 h-6 text-white" />}
          change="-3%"
          changeType="decrease"
          gradient="bg-gradient-to-br from-amber-500 to-amber-600"
        />
        <StatCard
          title="Total Contributions"
          value={`$${stats.totalContributions.toLocaleString()}`}
          icon={<DollarSign className="w-6 h-6 text-white" />}
          change="+24%"
          changeType="increase"
          gradient="bg-gradient-to-br from-rose-500 to-pink-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Quick Actions</h3>
              <button className="text-sm text-rose-600 hover:text-rose-700 font-semibold">View all</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <QuickActionCard
                icon={<UserPlus className="w-5 h-5 text-white" />}
                title="Add Guest"
                description="Invite someone"
                gradient="bg-gradient-to-br from-rose-500 to-pink-600"
              />
              <QuickActionCard
                icon={<MessageSquare className="w-5 h-5 text-white" />}
                title="Send Update"
                description="Email guests"
                gradient="bg-gradient-to-br from-blue-500 to-blue-600"
              />
              <QuickActionCard
                icon={<Gift className="w-5 h-5 text-white" />}
                title="Add Gift"
                description="Register gift"
                gradient="bg-gradient-to-br from-green-500 to-green-600"
              />
              <QuickActionCard
                icon={<Image className="w-5 h-5 text-white" />}
                title="Add Photos"
                description="Upload media"
                gradient="bg-gradient-to-br from-purple-500 to-purple-600"
              />
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Upcoming Events</h3>
              <button className="text-sm text-rose-600 hover:text-rose-700 font-semibold">View all</button>
            </div>
            <div className="space-y-4">
              <div className="flex items-start p-4 bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100 rounded-xl">
                <div className="p-3 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 mr-4 flex-shrink-0">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-slate-900">Wedding Ceremony</h4>
                    <span className="text-xs px-3 py-1 bg-rose-600 text-white rounded-full font-semibold">This Week</span>
                  </div>
                  <p className="text-sm text-slate-600 font-medium">Saturday, June 15, 2024</p>
                  <p className="text-sm text-slate-500">2:00 PM - 6:00 PM</p>
                </div>
              </div>
              <div className="flex items-start p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 mr-4 flex-shrink-0">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 mb-1">Bridal Shower</h4>
                  <p className="text-sm text-slate-600 font-medium">Saturday, May 25, 2024</p>
                  <p className="text-sm text-slate-500">11:00 AM - 3:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
              <button className="text-sm text-rose-600 hover:text-rose-700 font-semibold">View all</button>
            </div>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <ActivityItem
                  key={activity.id}
                  type={activity.type}
                  user={activity.user}
                  message={activity.message}
                  time={activity.time}
                />
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Progress Overview</h3>
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Guest Response Rate</span>
                  <span className="text-sm font-bold text-slate-900">85%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 h-2.5 rounded-full shadow-sm" style={{ width: '85%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Budget Used</span>
                  <span className="text-sm font-bold text-slate-900">$12,450 / $25,000</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full shadow-sm" style={{ width: '50%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Tasks Completed</span>
                  <span className="text-sm font-bold text-slate-900">24/36</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                  <div className="bg-gradient-to-r from-rose-500 to-pink-600 h-2.5 rounded-full shadow-sm" style={{ width: '67%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardContent;
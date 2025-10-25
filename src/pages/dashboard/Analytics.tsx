import { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

// Types
interface Guest {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  message?: string;
  created_at: string;
}

interface Contribution {
  id: string;
  guest_id: string | null;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

interface Pledge {
  id: string;
  guest_id: string | null;
  type: 'money' | 'item';
  amount: number | null;
  quantity: number | null;
  status: 'pending' | 'fulfilled' | 'cancelled';
  created_at: string;
}

interface Meeting {
  id: string;
  title: string;
  starts_at: string;
  location: string;
}

interface Message {
  id: string;
  guest_id: string | null;
  message: string;
  is_approved: boolean;
  created_at: string;
}

// Color palette - professional gradient colors
const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'];
const CHART_COLORS = {
  primary: '#8B5CF6',
  secondary: '#EC4899',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',
  danger: '#EF4444'
};

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all');
  
  // Mock data for demonstration
  const [guests] = useState<Guest[]>([
    { id: '1', full_name: 'Emmanuel Martha', phone: '123', created_at: '2024-08-15T10:00:00Z' },
    { id: '2', full_name: 'Jane Smith', phone: '456', created_at: '2024-09-10T10:00:00Z' },
    { id: '3', full_name: 'Bob Johnson', phone: '789', created_at: '2024-09-20T10:00:00Z' },
    { id: '4', full_name: 'Alice Brown', phone: '012', created_at: '2024-10-01T10:00:00Z' },
  ]);
  
  const [contributions] = useState<Contribution[]>([
    { id: '1', guest_id: '1', amount: 500000, currency: 'UGX', status: 'completed', created_at: '2024-08-16T10:00:00Z' },
    { id: '2', guest_id: '2', amount: 750000, currency: 'UGX', status: 'completed', created_at: '2024-09-11T10:00:00Z' },
    { id: '3', guest_id: '3', amount: 300000, currency: 'UGX', status: 'completed', created_at: '2024-09-21T10:00:00Z' },
    { id: '4', guest_id: '4', amount: 1000000, currency: 'UGX', status: 'completed', created_at: '2024-10-02T10:00:00Z' },
    { id: '5', guest_id: '1', amount: 200, currency: 'USD', status: 'completed', created_at: '2024-10-05T10:00:00Z' },
  ]);
  
  const [pledges] = useState<Pledge[]>([
    { id: '1', guest_id: '1', type: 'money', amount: 500000, quantity: null, status: 'fulfilled', created_at: '2024-08-15T10:00:00Z' },
    { id: '2', guest_id: '2', type: 'item', amount: null, quantity: 2, status: 'pending', created_at: '2024-09-10T10:00:00Z' },
    { id: '3', guest_id: '3', type: 'money', amount: 300000, quantity: null, status: 'fulfilled', created_at: '2024-09-20T10:00:00Z' },
    { id: '4', guest_id: '4', type: 'item', amount: null, quantity: 1, status: 'cancelled', created_at: '2024-10-01T10:00:00Z' },
  ]);
  
  const [meetings] = useState<Meeting[]>([
    { id: '1', title: 'Venue Visit', starts_at: '2024-11-15T14:00:00Z', location: 'Hotel Grand' },
    { id: '2', title: 'Cake Tasting', starts_at: '2024-11-20T10:00:00Z', location: 'Sweet Delights' },
  ]);
  
  const [messages] = useState<Message[]>([
    { id: '1', guest_id: '1', message: 'Congratulations!', is_approved: true, created_at: '2024-08-15T10:00:00Z' },
    { id: '2', guest_id: '2', message: 'Best wishes!', is_approved: false, created_at: '2024-09-10T10:00:00Z' },
    { id: '3', guest_id: '3', message: 'So happy for you!', is_approved: true, created_at: '2024-09-20T10:00:00Z' },
  ]);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 800);
  }, []);

  // Process data for charts
  const getGuestsByMonth = () => {
    const guestsByMonth: Record<string, number> = {};
    
    guests.forEach(guest => {
      const date = new Date(guest.created_at);
      const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      guestsByMonth[month] = (guestsByMonth[month] || 0) + 1;
    });

    return Object.entries(guestsByMonth)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([month, count]) => ({
        month,
        guests: count
      }));
  };

  const getContributionsByMonth = () => {
    const contributionsByMonth: Record<string, {count: number, amount: number}> = {};
    
    contributions.filter(c => c.status === 'completed').forEach(contribution => {
      const date = new Date(contribution.created_at);
      const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!contributionsByMonth[month]) {
        contributionsByMonth[month] = { count: 0, amount: 0 };
      }
      contributionsByMonth[month].count += 1;
      
      // Convert all currencies to UGX for display
      if (contribution.currency === 'UGX') {
        contributionsByMonth[month].amount += contribution.amount;
      } else if (contribution.currency === 'USD') {
        // Convert USD to UGX
        contributionsByMonth[month].amount += (contribution.amount * 3700);
      } else {
        // Default conversion for other currencies
        contributionsByMonth[month].amount += (contribution.amount * 3700);
      }
    });

    return Object.entries(contributionsByMonth)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([month, data]) => ({
        month,
        contributions: data.count,
        amount: data.amount
      }));
  };

  const getPledgeStatusData = () => {
    const statusCount: Record<string, number> = {
      pending: 0,
      fulfilled: 0,
      cancelled: 0
    };
    
    pledges.forEach(pledge => {
      statusCount[pledge.status] = (statusCount[pledge.status] || 0) + 1;
    });

    return Object.entries(statusCount).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count
    }));
  };

  const getContributionCurrencyData = () => {
    // We'll aggregate all contributions in UGX value
    const totalUGX = contributions
      .filter(c => c.status === 'completed')
      .reduce((sum, contribution) => {
        if (contribution.currency === 'UGX') {
          return sum + contribution.amount;
        } else if (contribution.currency === 'USD') {
          return sum + (contribution.amount * 3700);
        }
        // Default conversion for other currencies
        return sum + (contribution.amount * 3700);
      }, 0);

    // Return all contributions aggregated as UGX
    return [{
      name: 'UGX',
      value: totalUGX
    }];
  };

  // Calculate stats
  const totalGuests = guests.length;
  const totalContributions = contributions.filter(c => c.status === 'completed').length;
  // Convert all amounts to UGX
  const totalAmount = contributions
    .filter(c => c.status === 'completed')
    .reduce((sum, contribution) => {
      if (contribution.currency === 'UGX') {
        return sum + contribution.amount;
      } else if (contribution.currency === 'USD') {
        // Assuming exchange rate: 1 USD = 3700 UGX (typical rate)
        return sum + (contribution.amount * 3700);
      }
      // For any other currency, we'll use a default conversion rate
      return sum + (contribution.amount * 3700); // Default to USD rate
    }, 0);
  const totalPledges = pledges.length;
  const fulfilledPledges = pledges.filter(p => p.status === 'fulfilled').length;
  const pendingMessages = messages.filter(m => !m.is_approved).length;
  const approvalRate = totalPledges > 0 ? ((fulfilledPledges / totalPledges) * 100).toFixed(1) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Analytics Dashboard
            </h1>
            <p className="mt-2 text-gray-600">
              Comprehensive overview of your wedding planning metrics
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex gap-2">
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="month">This Month</option>
              <option value="week">This Week</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Guests"
            value={totalGuests}
            icon={<Users />}
            gradient="from-purple-500 to-purple-600"
            trend="+12%"
            trendUp={true}
          />
          <StatCard
            title="Contributions"
            value={totalContributions}
            icon={<TrendingUp />}
            gradient="from-green-500 to-green-600"
            trend="+8%"
            trendUp={true}
          />
          <StatCard
            title="Total Amount"
            value={new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'UGX',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(totalAmount)}
            icon={<DollarSign />}
            gradient="from-blue-500 to-blue-600"
            trend="+15%"
            trendUp={true}
          />
          <StatCard
            title="Pledge Rate"
            value={`${approvalRate}%`}
            icon={<CheckCircle />}
            gradient="from-pink-500 to-pink-600"
            subtitle={`${fulfilledPledges}/${totalPledges} fulfilled`}
          />
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Guest Registration Trend */}
          <ChartCard title="Guest Registration Trend" subtitle="New guests over time">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={getGuestsByMonth()}>
                <defs>
                  <linearGradient id="colorGuests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: 'none', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="guests" 
                  stroke={CHART_COLORS.primary} 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorGuests)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Contributions Analysis */}
          <ChartCard title="Contribution Analysis" subtitle="Amount and frequency">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getContributionsByMonth()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis yAxisId="left" stroke="#6b7280" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: 'none', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value, name) => {
                    if (name === 'Total Amount (UGX)') {
                      return [new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'UGX',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(Number(value)), name];
                    }
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar 
                  yAxisId="left" 
                  dataKey="contributions" 
                  name="Number of Contributions" 
                  fill={CHART_COLORS.success}
                  radius={[8, 8, 0, 0]}
                />
                <Bar 
                  yAxisId="right" 
                  dataKey="amount" 
                  name="Total Amount (UGX)" 
                  fill={CHART_COLORS.warning}
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Secondary Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pledge Status Distribution */}
          <ChartCard title="Pledge Status" subtitle="Current pledge breakdown">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={getPledgeStatusData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={90}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {getPledgeStatusData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: 'none', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Currency Distribution */}
          <ChartCard title="Currency Distribution" subtitle="Contributions by currency">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={getContributionCurrencyData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={90}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }: { name: string; value: number }) => {
                    const total = getContributionCurrencyData().reduce((sum, item) => sum + item.value, 0);
                    const percent = ((value / total) * 100).toFixed(0);
                    return `${name} ${percent}%`;
                  }}
                >
                  {getContributionCurrencyData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: 'none', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value, name) => [new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'UGX', // Always display in UGX
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(Number(value)), 'Amount']}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Bottom Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InfoCard
            title="Messages"
            value={messages.length}
            subtitle={`${pendingMessages} pending approval`}
            icon={<MessageSquare />}
            color="indigo"
          />
          <InfoCard
            title="Upcoming Events"
            value={meetings.length}
            subtitle="Planned meetings"
            icon={<Calendar />}
            color="yellow"
          />
          <InfoCard
            title="Active Pledges"
            value={totalPledges}
            subtitle={`${((fulfilledPledges/totalPledges)*100).toFixed(0)}% completion rate`}
            icon={<Package />}
            color="pink"
          />
        </div>
      </div>
    </div>
  );
}

// Reusable Components
function StatCard({ title, value, icon, gradient, trend, trendUp, subtitle }: any) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <div className="flex items-center mt-2">
              <span className={`text-sm font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                {trend}
              </span>
              <span className="text-xs text-gray-500 ml-1">vs last period</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-md`}>
          <div className="text-white">
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: any) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function InfoCard({ title, value, subtitle, icon, color }: any) {
  const colorMap: any = {
    indigo: 'from-indigo-500 to-indigo-600',
    yellow: 'from-yellow-500 to-yellow-600',
    pink: 'from-pink-500 to-pink-600'
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-4 rounded-xl bg-gradient-to-br ${colorMap[color]} shadow-md`}>
          <div className="text-white">
            {icon}
          </div>
        </div>
        <div className="ml-5 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

// Icon Components
function Users() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function TrendingUp() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function DollarSign() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CheckCircle() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function MessageSquare() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function Calendar() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function Package() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  );
}
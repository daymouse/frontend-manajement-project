import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "./../../../Server";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { socket } from "./../../../socket";

// 🔹 Komponen Card yang lebih modern
function Card({ children, className = "" }) {
  return (
    <div className={`bg-white shadow-xl rounded-xl p-6 border border-gray-100 transition-all duration-300 hover:shadow-2xl ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ children, className = "" }) {
  return <div className={`mb-4 border-b border-gray-100 pb-3 ${className}`}>{children}</div>;
}

function CardTitle({ children, className = "" }) {
  return <h2 className={`text-2xl font-bold text-gray-800 ${className}`}>{children}</h2>;
}

function CardContent({ children, className = "" }) {
  return <div className={`mt-4 ${className}`}>{children}</div>;
}

// 🔹 Komponen Stat Card untuk menampilkan metrik individual
function StatCard({ title, value, subtitle, icon, color = "blue", trend }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    red: "bg-red-50 text-red-600 border-red-200",
    yellow: "bg-yellow-50 text-yellow-600 border-yellow-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-200",
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${colorClasses[color]} transition-transform duration-300 hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs opacity-70 mt-1">{subtitle}</p>}
          {trend && (
            <div className={`text-xs mt-1 ${trend.value > 0 ? 'text-green-600' : trend.value < 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {trend.value > 0 ? '↗' : trend.value < 0 ? '↘' : '→'} {trend.label}
            </div>
          )}
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
}

// 🔹 Skeleton Loading yang lebih baik
function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 bg-gray-200 rounded-lg"></div>
        <div className="h-80 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  );
}

// 🔹 Chart Container dengan fallback
function ChartContainer({ children, height = 300, className = "" }) {
  return (
    <div 
      className={`relative ${className}`}
      style={{ height: `${height}px`, minHeight: `${height}px` }}
    >
      {children}
    </div>
  );
}

// 🔹 Fallback ketika chart tidak bisa render
function ChartFallback({ message = "Data tidak tersedia" }) {
  return (
    <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border border-gray-200">
      <div className="text-center text-gray-500">
        <div className="text-4xl mb-2">📊</div>
        <p>{message}</p>
      </div>
    </div>
  );
}

// 🔹 Komponen utama
export default function UserBoardAnalytics() {
  const { board_id } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await apiFetch(`/analytics/user/${board_id}`);
      
      // Pastikan data memiliki struktur yang benar
      const formattedData = res || {
        card_progress: { 
          total_assigned: 0, 
          completed: 0, 
          in_progress: 0, 
          todo: 0, 
          completion_rate: 0 
        },
        subtask_breakdown: { 
          total: 0, 
          completed: 0, 
          in_progress: 0, 
          todo: 0, 
          review: 0, 
          completion_rate: 0 
        },
        time_metrics: { 
          avg_subtask_duration_minutes: 0, 
          total_work_minutes: 0, 
          max_subtask_duration_minutes: 0 
        },
        blocker_metrics: {
          unresolved_blockers: 0,
          resolved_this_period: 0,
          avg_resolution_hours: 0
        },
        productivity_trend: []
      };
      
      setAnalytics(formattedData);
    } catch (err) {
      console.error("❌ Gagal memuat analitik:", err);
      setError("Gagal memuat data analitik. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!board_id) {
      setError("Board ID tidak valid");
      setLoading(false);
      return;
    }

    fetchAnalytics();

    // Socket listener untuk realtime refresh
    socket.emit("join_board_analytics", board_id);
    socket.on("analytics_refetch", (payload) => {
      if (String(payload.board_id) === String(board_id)) {
        setAnalytics(payload.data);
      }
    });

    return () => {
      socket.off("analytics_refetch");
      socket.emit("leave_board_analytics", board_id);
    };
  }, [board_id]);

  // Data untuk chart progress cards - dengan fallback
  const cardProgressData = analytics?.card_progress ? [
    {
      name: "Kartu Saya",
      total: analytics.card_progress.total_assigned || 0,
      completed: analytics.card_progress.completed || 0,
      in_progress: analytics.card_progress.in_progress || 0,
      todo: analytics.card_progress.todo || 0,
    }
  ] : [];

  // Data untuk subtask breakdown - dengan fallback
  const subtaskData = analytics?.subtask_breakdown ? [
    { 
      name: "Selesai", 
      value: analytics.subtask_breakdown.completed || 0, 
      color: "#22c55e" 
    },
    { 
      name: "Dalam Proses", 
      value: analytics.subtask_breakdown.in_progress || 0, 
      color: "#3b82f6" 
    },
    { 
      name: "Todo", 
      value: analytics.subtask_breakdown.todo || 0, 
      color: "#e5e7eb" 
    },
    { 
      name: "Review", 
      value: analytics.subtask_breakdown.review || 0, 
      color: "#f59e0b" 
    },
  ].filter(item => item.value > 0) : []; // Hanya tampilkan yang memiliki value

  // Data untuk trend produktivitas - dengan fallback
  const productivityTrend = analytics?.productivity_trend || [
    { date: '2024-01-01', completed_tasks: 0, work_minutes: 0 }
  ];

  // Cek apakah ada data untuk ditampilkan
  const hasChartData = cardProgressData.length > 0 && cardProgressData[0].total > 0;
  const hasSubtaskData = subtaskData.length > 0;
  const hasTrendData = productivityTrend.length > 0 && productivityTrend.some(item => item.completed_tasks > 0 || item.work_minutes > 0);

  if (loading) return <AnalyticsSkeleton />;

  if (error) {
    return (
      <Card className="mt-6">
        <CardContent>
          <div className="text-center py-8">
            <div className="text-6xl mb-4">😞</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Terjadi Kesalahan</h3>
            <p className="text-gray-500">{error}</p>
            <button
              onClick={fetchAnalytics}
              className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      {/* Header tanpa Time Range Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="text-3xl">📊</span>
            <div>
              <CardTitle>Dashboard Performa Pribadi</CardTitle>
              <div className="text-sm font-normal text-gray-500 mt-1">
                Analisis produktivitas dan kontribusi Anda di board ini
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stat Cards - Metrik Utama */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Kartu Dipimpin"
          value={analytics?.card_progress?.total_assigned || 0}
          subtitle={`${analytics?.card_progress?.completed || 0} selesai`}
          icon="👑"
          color="purple"
          trend={{ 
            value: analytics?.card_progress?.completion_rate || 0, 
            label: `${Math.round(analytics?.card_progress?.completion_rate || 0)}% selesai` 
          }}
        />
        <StatCard
          title="Subtask Dikerjakan"
          value={analytics?.subtask_breakdown?.total || 0}
          subtitle={`${analytics?.subtask_breakdown?.completed || 0} selesai`}
          icon="✅"
          color="green"
          trend={{ 
            value: analytics?.subtask_breakdown?.completion_rate || 0, 
            label: `${Math.round(analytics?.subtask_breakdown?.completion_rate || 0)}% selesai` 
          }}
        />
        <StatCard
          title="Rata-rata Waktu"
          value={`${Math.round(analytics?.time_metrics?.avg_subtask_duration_minutes || 0)}m`}
          subtitle="per subtask"
          icon="⏱️"
          color="blue"
        />
        <StatCard
          title="Blocker Aktif"
          value={analytics?.blocker_metrics?.unresolved_blockers || 0}
          subtitle={`${analytics?.blocker_metrics?.resolved_this_period || 0} terselesaikan`}
          icon="🚧"
          color="red"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Kartu */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status Kartu yang Dipimpin</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer height={320}>
              {hasChartData ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={cardProgressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completed" fill="#22c55e" name="Selesai" />
                    <Bar dataKey="in_progress" fill="#3b82f6" name="Dalam Proses" />
                    <Bar dataKey="todo" fill="#e5e7eb" name="Belum Dimulai" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ChartFallback message="Belum ada data kartu yang dipimpin" />
              )}
            </ChartContainer>
            
            {/* Progress Summary */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-semibold">Completion Rate</div>
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(analytics?.card_progress?.completion_rate || 0)}%
                  </div>
                </div>
                <div>
                  <div className="font-semibold">In Progress</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {analytics?.card_progress?.in_progress || 0}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Breakdown Subtask */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribusi Subtask</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer height={320}>
              {hasSubtaskData ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={subtaskData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {subtaskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <ChartFallback message="Belum ada data subtask" />
              )}
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Time Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📈 Metrik Waktu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Rata waktu subtask:</span>
                <span className="font-semibold">
                  {Math.round(analytics?.time_metrics?.avg_subtask_duration_minutes || 0)} menit
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Total waktu bekerja:</span>
                <span className="font-semibold">
                  {Math.round((analytics?.time_metrics?.total_work_minutes || 0) / 60)} jam
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Subtask terlama:</span>
                <span className="font-semibold">
                  {Math.round(analytics?.time_metrics?.max_subtask_duration_minutes || 0)} menit
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Blocker Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🚧 Status Blocker</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Aktif:</span>
                <span className="font-semibold text-red-600">
                  {analytics?.blocker_metrics?.unresolved_blockers || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Terselesaikan:</span>
                <span className="font-semibold text-green-600">
                  {analytics?.blocker_metrics?.resolved_this_period || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Rata penyelesaian:</span>
                <span className="font-semibold">
                  {Math.round(analytics?.blocker_metrics?.avg_resolution_hours || 0)} jam
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Productivity Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📊 Trend Produktivitas</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer height={200}>
              {hasTrendData ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <LineChart data={productivityTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="completed_tasks" 
                      stroke="#22c55e" 
                      name="Task Selesai" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <ChartFallback message="Belum ada data trend produktivitas" />
              )}
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
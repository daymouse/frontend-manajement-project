import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, LogIn, UserPlus, LayoutDashboard, Rocket, Users, BarChart3, Shield } from "lucide-react";

export default function LandingPage({ user, loading }) {
  const navigate = useNavigate();

  const handleDashboard = () => {
    if (user?.is_admin) navigate("/admin/dashboard");
    else navigate("/user/dashboard");
  };

  const features = [
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Real-time",
      description: "Perubahan data secara langsung untuk efisiensi maksimal"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Kolaborasi Tim",
      description: "Kerja sama yang efisien dengan seluruh anggota tim"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Grub Chat",
      description: "implementasi fitur grub chat untuk komunikasi yang lebih efektif antar anggota tim dalam proyek."
    }
  ];

  return (
    <div className="font-poppins min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-100 flex flex-col items-center justify-center text-gray-900 px-6 relative overflow-hidden">

      {/* Background Elements */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply opacity-20 blur-3xl animate-float" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply opacity-20 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply opacity-15 blur-3xl animate-float" style={{ animationDelay: "4s" }} />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto text-center relative z-10">
        
        {/* Header Section */}
        <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-8 mb-12 shadow-2xl border border-white/80">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Rocket className="w-4 h-4" />
            Platform Manajemen Proyek Modern
          </div>
          
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
            Kelola Proyek
            <span className="block text-4xl mt-2">Dengan Lebih Efisien</span>
          </h1>
          
          <p className="text-gray-600 text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
            Transformasi cara Anda mengelola proyek dengan platform terpadu yang 
            menggabungkan kecepatan, keamanan, dan kolaborasi tim yang optimal.
          </p>

          {/* Auth Buttons */}
          {loading ? (
            <button className="bg-white text-gray-700 px-12 py-4 rounded-2xl flex items-center gap-3 text-lg font-semibold shadow-lg border border-gray-200 mx-auto">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Checking Authentication...
            </button>
          ) : user ? (
            <button
              onClick={handleDashboard}
              className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-12 py-4 rounded-2xl font-semibold flex items-center gap-3 text-lg hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 shadow-xl mx-auto transform hover:scale-105"
            >
              <LayoutDashboard /> Go to Dashboard <ArrowRight size={20} />
            </button>
          ) : (
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                to="/login"
                className="bg-white text-gray-800 px-12 py-4 rounded-2xl font-semibold flex items-center gap-3 text-lg hover:bg-gray-50 transition-all duration-300 shadow-lg border border-gray-200 hover:shadow-xl transform hover:scale-105"
              >
                <LogIn /> Login
              </Link>

              <Link
                to="/register"
                className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-12 py-4 rounded-2xl font-semibold flex items-center gap-3 text-lg hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 shadow-xl transform hover:scale-105"
              >
                <UserPlus /> Daftar Sekarang
              </Link>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/60 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 mb-4 mx-auto">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-lg mb-2 text-gray-800">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 text-center">
        <p className="text-gray-500 text-sm tracking-wide">
          © 2025 ManPro — Sistem Manajemen Proyek Modern
        </p>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        .animate-float {
          animation: float 10s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
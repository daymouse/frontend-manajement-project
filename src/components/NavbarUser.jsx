import { useEffect, useState } from "react";
import { Bell, ChevronDown } from "lucide-react";

const NavbarUser = () => {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    // Fungsi untuk update waktu lokal setiap detik
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("id-ID", { hour12: false }));
    };

    // Jalankan langsung pertama kali
    updateTime();

    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-16 bg-white flex items-center justify-between px-6 shadow-sm font-poppins mb-8 rounded-4xl">
      {/* Left */}
      <div>
        <span className="font-poppins font-semibold">Project</span>
      </div>

      {/* Center */}
      <div>
        <span className="font-poppins font-semibold">{currentTime}</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-6">
        {/* Notification */}
        <button className="relative">
          <Bell size={20} className="text-gray-600 hover:text-purple-600" />
          <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 cursor-pointer">
          <img
            src="https://i.pravatar.cc/40"
            alt="profile"
            className="w-9 h-9 rounded-full border"
          />
          <div className="text-sm text-right">
            <p className="font-medium text-gray-800">Nicklas Larsen</p>
            <p className="text-gray-500 text-xs">Admin</p>
          </div>
          <ChevronDown size={16} className="text-gray-500" />
        </div>
      </div>
    </div>
  );
};

export default NavbarUser;

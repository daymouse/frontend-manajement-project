import { useEffect, useState } from "react";
import { Bell, ChevronDown, Menu } from "lucide-react";
import { apiFetch } from "./../Server";
import ProfileModal from "./ProfileModal";

const NavbarUser = ({ onMenuClick }) => {
  const [currentTime, setCurrentTime] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleUpdateUser = (field, value) => {
    // 🔥 PERBAIKAN: Update currentUser juga
    setCurrentUser(prev => ({ 
      ...prev, 
      [field]: value 
    }));
  };

  const toggleProfileModal = () => {
    setShowProfileModal(!showProfileModal);
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("id-ID", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };

    const fetchUser = async () => {
      try {
        const me = await apiFetch("/auth/auth/me");
        setCurrentUser(me);
      } catch (err) {
        console.error("❌ Gagal memuat user login:", err);
      }
    };

    updateTime();
    fetchUser();

    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-16 bg-white flex items-center justify-between px-6 shadow-sm font-poppins mb-8 rounded-4xl">
      {/* Left - Hamburger Menu */}
      <div className="md:hidden">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Title */}
      <div className="hidden md:block">
        <span className="font-poppins font-semibold">User</span>
      </div>

      {/* Time - Tampilkan di mobile */}
      <div className="md:hidden">
        <span className="font-poppins font-semibold text-sm"></span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-6">

       

        {/* Profile Desktop */}
        <div
          className="hidden md:flex items-center gap-3 cursor-pointer"
          onClick={toggleProfileModal}
        >
          <div className="w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold border">
            {currentUser?.full_name
              ? currentUser.full_name.charAt(0).toUpperCase()
              : "?"}
          </div>
          <div className="text-sm text-right">
            <p className="font-medium text-gray-800">
              {currentUser?.full_name || "Loading..."}
            </p>
            <p className="text-gray-500 text-xs">
              {currentUser?.is_admin ? "Admin" : "User"}
            </p>
          </div>
          <ChevronDown size={16} className="text-gray-500" />
        </div>

        {/* Profile Mobile - Avatar saja */}
        <div
          className="md:hidden flex items-center cursor-pointer"
          onClick={toggleProfileModal}
        >
          <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold border text-sm">
            {currentUser?.full_name
              ? currentUser.full_name.charAt(0).toUpperCase()
              : "?"}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showProfileModal && (
        <ProfileModal
          user={currentUser}
          open={showProfileModal}
          onClose={toggleProfileModal}
          onUpdateUser={handleUpdateUser}
        />
      )}
    </div>
  );
};

export default NavbarUser;
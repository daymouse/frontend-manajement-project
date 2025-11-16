import React from "react";
import { useAlert } from "./AlertContext";
import { CheckCircle, AlertCircle, Info } from "lucide-react";

export default function Alert() {
  const { alert, closeAlert } = useAlert();

  if (!alert.open) return null;

  const getAlertStyles = () => {
    const baseStyles = {
      success: {
        bg: "bg-green-50",
        border: "border-green-200",
        text: "text-green-800",
        button: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300",
        icon: <CheckCircle className="text-green-400" size={20} />
      },
      error: {
        bg: "bg-red-50", 
        border: "border-red-200",
        text: "text-red-800",
        button: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300",
        icon: <AlertCircle className="text-red-400" size={20} />
      },
      warning: {
        bg: "bg-yellow-50",
        border: "border-yellow-200", 
        text: "text-yellow-800",
        button: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300",
        icon: <AlertCircle className="text-yellow-400" size={20} />
      },
      info: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-800", 
        button: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300",
        icon: <Info className="text-blue-400" size={20} />
      }
    };

    return baseStyles[alert.type] || baseStyles.info;
  };

  const styles = getAlertStyles();

  return (
    <div
      className={`fixed top-6 left-1/2 transform -translate-x-1/2 min-w-[320px] max-w-md 
        ${styles.bg} ${styles.border} border rounded-2xl shadow-lg z-[9999] 
        backdrop-blur-sm bg-opacity-95 animate-in slide-in-from-top-5 duration-300`}
    >
      <div className="p-5">
        {/* Icon & Message */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 mt-0.5">
            {styles.icon}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${styles.text} leading-5`}>
              {alert.message}
            </p>
          </div>
        </div>

        {/* OK Button */}
        <div className="flex justify-end">
          <button
            onClick={closeAlert}
            className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 
              focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-gray-400 
              ${styles.button}`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
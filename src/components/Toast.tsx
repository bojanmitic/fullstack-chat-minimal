"use client";

import { useEffect } from "react";

export type ToastType = "error" | "success" | "warning" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

export const ToastItem = ({ toast, onRemove }: ToastProps) => {
  useEffect(() => {
    const duration = toast.duration || 5000; // Default 5 seconds
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const getToastStyles = () => {
    switch (toast.type) {
      case "error":
        return "bg-red-600 border-red-500 text-white";
      case "success":
        return "bg-green-600 border-green-500 text-white";
      case "warning":
        return "bg-yellow-600 border-yellow-500 text-white";
      case "info":
        return "bg-blue-600 border-blue-500 text-white";
      default:
        return "bg-gray-600 border-gray-500 text-white";
    }
  };

  return (
    <div
      className={`
        ${getToastStyles()}
        border-l-4 px-4 py-3 rounded shadow-lg mb-2
        flex items-center justify-between
        min-w-[300px] max-w-[500px]
        animate-in slide-in-from-right fade-in
      `}
      role="alert"
    >
      <p className="text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="ml-4 text-white hover:text-gray-200 transition-colors"
        aria-label="Close notification"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
};


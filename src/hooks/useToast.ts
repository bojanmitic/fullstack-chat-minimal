"use client";

import { useState, useCallback } from "react";
import { Toast, ToastType } from "@/components/Toast";

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration?: number) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      const newToast: Toast = {
        id,
        message,
        type,
        duration,
      };

      setToasts((prev) => [...prev, newToast]);
      return id;
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showError = useCallback(
    (message: string, duration?: number) => {
      return showToast(message, "error", duration);
    },
    [showToast]
  );

  const showSuccess = useCallback(
    (message: string, duration?: number) => {
      return showToast(message, "success", duration);
    },
    [showToast]
  );

  const showWarning = useCallback(
    (message: string, duration?: number) => {
      return showToast(message, "warning", duration);
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message: string, duration?: number) => {
      return showToast(message, "info", duration);
    },
    [showToast]
  );

  return {
    toasts,
    showToast,
    showError,
    showSuccess,
    showWarning,
    showInfo,
    removeToast,
  };
};

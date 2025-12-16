"use client";

import { useEffect, useState, useCallback } from "react";
import { usageApi, type UsageStats as UsageStatsType } from "@/lib/api";
import { useToast } from "@/hooks/useToast";

interface UsageStatsProps {
  refreshTrigger?: number;
}

export const UsageStats = ({ refreshTrigger }: UsageStatsProps) => {
  const [stats, setStats] = useState<UsageStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();

  const fetchUsage = useCallback(async () => {
    try {
      setLoading(true);
      const data = await usageApi.getUsage();
      setStats(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load usage statistics";
      console.error("Failed to fetch usage:", err);
      showError(errorMessage, 5000);
      // Keep previous stats if available, don't clear on error
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchUsage();
    
    // Refresh every 30 seconds (background sync)
    const interval = setInterval(() => {
      fetchUsage();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchUsage]);

  // Refresh when refresh trigger changes (immediate update)
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      // Small delay to debounce rapid updates
      const timer = setTimeout(() => {
        fetchUsage();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [refreshTrigger, fetchUsage]);

  if (loading && !stats) {
    return (
      <div className="bg-gray-800 rounded-lg p-3 text-sm text-gray-400">
        Loading usage...
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-gray-800 rounded-lg p-3 text-sm text-gray-400">
        No usage data
      </div>
    );
  }

  const formatCost = (cost: number): string => {
    if (cost < 0.01) {
      return `$${cost.toFixed(4)}`;
    }
    return `$${cost.toFixed(2)}`;
  };

  const getColorClass = (percentage: number): string => {
    if (percentage >= 90) return "bg-red-600";
    if (percentage >= 70) return "bg-yellow-600";
    return "bg-blue-600";
  };

  return (
    <div className="bg-gray-800 rounded-lg px-3 py-2 flex items-center gap-4">
      {/* Daily Usage */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 whitespace-nowrap">Today:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-16 bg-gray-700 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${getColorClass(
                stats.daily.percentage
              )}`}
              style={{ width: `${Math.min(stats.daily.percentage, 100)}%` }}
            />
          </div>
          <span className="text-xs text-gray-300 min-w-[3rem]">
            {stats.daily.percentage.toFixed(0)}%
          </span>
        </div>
        <span className="text-xs text-gray-400">
          {formatCost(stats.daily.remaining)} left
        </span>
      </div>

      {/* Monthly Usage */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 whitespace-nowrap">Month:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-16 bg-gray-700 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${getColorClass(
                stats.monthly.percentage
              )}`}
              style={{ width: `${Math.min(stats.monthly.percentage, 100)}%` }}
            />
          </div>
          <span className="text-xs text-gray-300 min-w-[3rem]">
            {stats.monthly.percentage.toFixed(0)}%
          </span>
        </div>
        <span className="text-xs text-gray-400">
          {formatCost(stats.monthly.remaining)} left
        </span>
      </div>
    </div>
  );
};

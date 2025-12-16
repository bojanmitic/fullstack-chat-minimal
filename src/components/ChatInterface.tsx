"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChatInterfaceProps, AuthStatus } from "@/types";
import { useChat } from "@/hooks/useChat";
import { useToast } from "@/hooks/useToast";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { TemplateSelector } from "./TemplateSelector";
import { ToastContainer } from "./ToastContainer";
import { Spinner } from "./Spinner";
import { UsageStats } from "./UsageStats";

// Props interface moved above component for better readability
interface ChatInterfaceComponentProps {
  className?: ChatInterfaceProps["className"];
}

export const ChatInterface = ({ className = "" }: ChatInterfaceComponentProps) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { 
    messages, 
    isLoading, 
    error, 
    sendMessage, 
    clearMessages, 
    selectedTemplateId, 
    updateTemplate 
  } = useChat();
  
  const { toasts, showError, removeToast } = useToast();
  const [showTemplates, setShowTemplates] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [refreshUsage, setRefreshUsage] = useState(0);
  const [previousIsLoading, setPreviousIsLoading] = useState(false);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  // Refresh usage stats when request starts (immediate feedback)
  useEffect(() => {
    if (isLoading && !previousIsLoading) {
      // Request just started - refresh immediately to show current state
      setRefreshUsage((prev) => prev + 1);
    }
    setPreviousIsLoading(isLoading);
  }, [isLoading, previousIsLoading]);

  // Refresh usage stats after request completes (with delay for cost tracking)
  useEffect(() => {
    if (!isLoading && previousIsLoading && messages.length > 0) {
      // Request just completed - wait a bit for cost tracking to finish
      const timer = setTimeout(() => {
        setRefreshUsage((prev) => prev + 1);
      }, 1500); // Slightly longer delay to ensure all cost tracking is done
      return () => clearTimeout(timer);
    }
  }, [isLoading, previousIsLoading, messages.length]);

  // Show toast notification when error occurs
  useEffect(() => {
    if (error) {
      showError(error, 7000); // Show error for 7 seconds
    }
  }, [error, showError]);

  // Redirect to login if not authenticated or if session is invalid
  useEffect(() => {
    if (status === AuthStatus.UNAUTHENTICATED || (status !== AuthStatus.LOADING && (!session || !session.user))) {
      router.replace("/login?callbackUrl=/");
    }
  }, [status, session, router]);

  // Show loading state while checking authentication
  if (status === AuthStatus.LOADING) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // If not authenticated, redirect immediately
  if (status === AuthStatus.UNAUTHENTICATED) {
    if (typeof window !== "undefined") {
      window.location.href = "/login?callbackUrl=/";
    }
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Only render if status is authenticated AND we have a valid session with user
  // If we don't have a valid session, redirect to login
  if (status !== AuthStatus.AUTHENTICATED || !session || !session.user) {
    // Force redirect immediately - don't wait
    if (typeof window !== "undefined") {
      window.location.replace("/login?callbackUrl=/");
      return null;
    }
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  
  // Final safety check - if we get here but still no valid session, redirect
  if (!session?.user?.email) {
    if (typeof window !== "undefined") {
      window.location.replace("/login?callbackUrl=/");
      return null;
    }
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className={`h-screen bg-gray-900 flex flex-col overflow-hidden ${className}`}>
        {/* Full-width Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-white">Chat App</h1>
          {selectedTemplateId && (
            <span className="text-sm bg-blue-600 text-white px-2 py-1 rounded">
              Template Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Usage Stats */}
          <UsageStats refreshTrigger={refreshUsage} />
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              {showTemplates ? "Hide" : "Show"} Templates
            </button>
            <button
              onClick={clearMessages}
              className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
              disabled={messages.length === 0}
            >
              Clear Chat
            </button>
          </div>
          
          {/* User Profile Menu */}
          <div className="relative ml-2">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
            >
              {session.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  width={28}
                  height={28}
                  className="rounded-full"
                  unoptimized
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                  {session.user?.name?.charAt(0).toUpperCase() || session.user?.email?.charAt(0).toUpperCase() || "U"}
                </div>
              )}
              <span className="text-sm text-gray-300 hidden sm:block">
                {session.user?.name || session.user?.email || "User"}
              </span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-20">
                  <div className="px-4 py-3 border-b border-gray-700">
                    <p className="text-sm font-medium text-white">
                      {session.user?.name || "User"}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {session.user?.email}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Template Selector */}
      {showTemplates && (
        <div className="bg-gray-800 border-b border-gray-700 p-4 flex-shrink-0">
          <TemplateSelector
            key={selectedTemplateId || "no-template"}
            onTemplateSelect={(templateId, variables) => updateTemplate(templateId, variables)}
            selectedTemplateId={selectedTemplateId}
            className="max-w-4xl mx-auto"
          />
        </div>
      )}

      {/* Centered Content Area */}
      <div className="flex-1 flex items-center justify-center p-4 pb-0 overflow-hidden">
        <div className="w-full max-w-4xl h-full bg-gray-900 rounded-xl overflow-hidden flex flex-col">
          {/* Messages area */}
          <MessageList messages={messages} isLoading={isLoading} />
        </div>
      </div>

      {/* Bottom Input Area */}
      <div className="flex justify-center p-4 pt-0 flex-shrink-0">
        <div className="w-full max-w-4xl">
          <ChatInput 
            onSendMessage={sendMessage} 
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
    </>
  );
};

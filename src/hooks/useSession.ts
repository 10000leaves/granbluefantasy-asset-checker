'use client';

import { useState, useEffect } from 'react';

interface SessionData {
  inputValues: Record<string, any>;
  selectedItems: string[];
}

interface UseSessionResult {
  loading: boolean;
  error: string | null;
  createSession: (inputValues: any, selectedItems: string[]) => Promise<string>;
  loadSession: (id: string) => Promise<SessionData>;
  shareUrl: string | null;
  setShareUrl: (url: string | null) => void;
  sessionData: SessionData | null;
  setSessionData: (data: SessionData | null) => void;
}

export function useSession(): UseSessionResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);

  // URLからセッションIDを取得して読み込む
  useEffect(() => {
    const loadSessionFromUrl = async () => {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session');
        
        if (sessionId) {
          try {
            const data = await loadSession(sessionId);
            setSessionData(data);
          } catch (err) {
            console.error('Failed to load session from URL:', err);
          }
        }
      }
    };

    loadSessionFromUrl();
  }, []);

  const createSession = async (inputValues: any, selectedItems: string[]) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputValues,
          selectedItems,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save session');
      }

      const { id } = await response.json();
      const url = `${window.location.origin}?session=${id}`;
      setShareUrl(url);
      
      // セッションデータを更新
      setSessionData({
        inputValues,
        selectedItems,
      });
      
      return id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const loadSession = async (id: string): Promise<SessionData> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/sessions?id=${id}`);
      if (!response.ok) {
        throw new Error('Failed to load session');
      }

      const data = await response.json();
      const sessionData = {
        inputValues: data.input_values || {},
        selectedItems: data.selected_items || [],
      };
      
      // セッションデータを更新
      setSessionData(sessionData);
      
      return sessionData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createSession,
    loadSession,
    shareUrl,
    setShareUrl,
    sessionData,
    setSessionData,
  };
}

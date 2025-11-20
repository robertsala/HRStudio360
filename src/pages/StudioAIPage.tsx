import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Bot, Sparkles, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { useLocation } from 'wouter';

interface StudioAIPageProps {
  context?: 'recruitment' | 'payroll';
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const StudioAIPage: React.FC<StudioAIPageProps> = ({ context = 'recruitment' }) => {
  const [, setLocation] = useLocation();

  // Define context-specific welcome messages
  const getWelcomeMessage = () => {
    if (context === 'payroll') {
      return "👋 Hi! I'm Studio AI, your payroll assistant. I can help you with:\n\n• Validating payroll calculations and detecting errors\n• Analyzing expense reports for compliance\n• Checking leave requests and approvals\n• Answering questions about payroll processing\n\nWhat would you like to know?";
    }
    // Default to recruitment
    return "👋 Hi! I'm Studio AI, your autonomous HR assistant. I can help you with:\n\n• Screening candidates automatically\n• Analyzing hiring pipelines\n• Generating insights about job applications\n• Answering questions about candidates\n\nWhat would you like to know?";
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: getWelcomeMessage(),
      timestamp: new Date()
    }
  ]);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset messages when context changes
  useEffect(() => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: getWelcomeMessage(),
        timestamp: new Date()
      }
    ]);
  }, [context]);

  // ESC key handler to go back to dashboard
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setLocation('/dashboard');
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [setLocation]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      // Use different endpoint based on context
      const endpoint = context === 'payroll' ? '/api/ai-payroll/chat' : '/api/ai-agent/chat';
      const response = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({ message })
      });
      return response;
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }]);
    }
  });

  const handleSendMessage = () => {
    const trimmedMessage = messageInput.trim();
    if (!trimmedMessage || chatMutation.isPending) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessageInput('');

    chatMutation.mutate(trimmedMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLocation('/dashboard')}
            className="text-white hover:text-gray-200 transition-colors flex items-center gap-2"
            data-testid="button-exit-dashboard"
          >
            <ArrowLeft className="w-6 h-6" />
            <span className="text-sm font-medium">Exit to Dashboard</span>
          </button>
          
          <div className="h-8 w-px bg-white/30 mx-2"></div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bot className="w-8 h-8 text-white" />
              <Sparkles className="w-4 h-4 text-yellow-300 absolute -top-1 -right-1" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white" data-testid="text-page-title">
                Studio AI Chat
              </h2>
              <p className="text-sm text-purple-100" data-testid="text-page-subtitle">
                Autonomous HR Assistant powered by GPT-4o
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6" data-testid="container-messages">
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              data-testid={`message-${message.role}-${message.id}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                      Studio AI
                    </span>
                  </div>
                )}
                <div className="whitespace-pre-wrap text-sm" data-testid={`text-message-content-${message.id}`}>
                  {message.content}
                </div>
                <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {chatMutation.isPending && (
            <div className="flex justify-start" data-testid="indicator-typing">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-spin" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Studio AI is thinking...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <textarea
            ref={textareaRef}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={context === 'payroll' ? "Ask Studio AI about payroll, expenses, or calculations..." : "Ask Studio AI about candidates, hiring, or HR processes..."}
            className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            rows={3}
            disabled={chatMutation.isPending}
            data-testid="input-message"
          />
          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || chatMutation.isPending}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            data-testid="button-send"
          >
            {chatMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudioAIPage;

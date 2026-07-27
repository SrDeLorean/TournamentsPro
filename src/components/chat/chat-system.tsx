'use client';

import React, { useState } from 'react';
import { initialConversations, Conversation, ChatMessage } from '@/lib/data-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, ShieldCheck, User, Trophy, CheckCheck, Sparkles, X, ChevronRight } from 'lucide-react';

interface ChatSystemProps {
  activeConvId?: string;
  initialTopic?: string;
  onClose?: () => void;
}

export function ChatSystem({ activeConvId, initialTopic, onClose }: ChatSystemProps) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedConvId, setSelectedConvId] = useState<string>(activeConvId || initialConversations[0]?.id || '');
  const [inputMessage, setInputMessage] = useState('');

  const activeConv = conversations.find((c) => c.id === selectedConvId) || conversations[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeConv) return;

    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      conversationId: activeConv.id,
      senderId: 'usr-current',
      senderName: 'Tú (Atleta)',
      senderRole: 'Jugador',
      text: inputMessage.trim(),
      timestamp: 'Ahora',
      isRead: true,
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConv.id) {
          return {
            ...c,
            lastMessage: newMsg.text,
            lastTimestamp: newMsg.timestamp,
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      })
    );

    setInputMessage('');
  };

  return (
    <div className="w-full h-[650px] glass-panel border border-[var(--border-card)] rounded-2xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-12">
      
      {/* 📁 LEFT SIDEBAR: Active Conversations List */}
      <div className="md:col-span-4 border-r border-[var(--border-card)] bg-[var(--bg-card)] flex flex-col justify-between">
        <div className="p-4 border-b border-[var(--border-card)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[var(--accent-cyan)]" />
            <h3 className="font-black text-sm uppercase text-[var(--text-heading)]">
              Mensajería eSports
            </h3>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)]">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-card)]">
          {conversations.map((conv) => {
            const isSelected = conv.id === selectedConvId;
            return (
              <button
                key={conv.id}
                onClick={() => setSelectedConvId(conv.id)}
                className={`w-full p-3.5 text-left flex items-start gap-3 transition-all ${
                  isSelected
                    ? 'bg-[var(--accent-cyan-bg)] border-l-4 border-[var(--accent-cyan)]'
                    : 'hover:bg-[var(--bg-card-hover)]'
                }`}
              >
                <Avatar fallback={conv.participantName} status="online" size="md" />

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-extrabold text-xs text-[var(--text-heading)] truncate">
                        {conv.participantName}
                      </span>
                      <Badge variant={conv.participantRole === 'Organizador' ? 'emerald' : 'cyan'} className="text-[9px] px-1.5 py-0">
                        {conv.participantRole}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">{conv.lastTimestamp}</span>
                  </div>

                  {conv.topic && (
                    <p className="text-[10px] font-bold text-[var(--accent-cyan)] truncate">
                      {conv.topic}
                    </p>
                  )}

                  <p className="text-xs text-[var(--text-secondary)] truncate font-medium">
                    {conv.lastMessage}
                  </p>
                </div>

                {conv.unreadCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[var(--accent-cyan)] text-slate-950 font-extrabold text-[10px] flex items-center justify-center">
                    {conv.unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-3 border-t border-[var(--border-card)] bg-[var(--bg-main)] text-[10px] text-[var(--text-muted)] font-medium text-center">
          Chat cifrado directo para fichajes y soporte técnico
        </div>
      </div>

      {/* 💬 RIGHT DISPLAY: Active Chat Conversation */}
      <div className="md:col-span-8 flex flex-col justify-between bg-[var(--bg-main)]">
        
        {/* Header of Active Contact */}
        {activeConv ? (
          <>
            <div className="p-4 border-b border-[var(--border-card)] bg-[var(--bg-card)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar fallback={activeConv.participantName} status="online" size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-sm text-[var(--text-heading)] uppercase">
                      {activeConv.participantName}
                    </h4>
                    <Badge variant={activeConv.participantRole === 'Organizador' ? 'emerald' : 'cyan'}>
                      {activeConv.participantRole}
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] font-medium">
                    {activeConv.topic || 'Canal de Mensajería Directa'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  En Línea
                </span>
              </div>
            </div>

            {/* Messages Display Box */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {activeConv.messages.map((msg) => {
                const isMe = msg.senderId === 'usr-current';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[80%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] text-[var(--text-muted)] font-bold">
                      <span>{msg.senderName}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <div
                      className={`p-3.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-md ${
                        isMe
                          ? 'bg-[var(--accent-cyan)] text-slate-950 rounded-br-none font-bold'
                          : 'bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-heading)] rounded-bl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Message Form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-[var(--border-card)] bg-[var(--bg-card)] flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={`Escribir mensaje a ${activeConv.participantName}...`}
                className="flex-1 px-4 py-2.5 rounded-xl input-theme border border-[var(--border-card)] text-xs font-semibold focus:outline-none focus:border-[var(--accent-cyan)]"
              />
              <Button type="submit" size="sm" className="font-bold text-xs bg-[var(--accent-cyan)] text-slate-950 hover:opacity-90">
                <Send className="w-3.5 h-3.5 mr-1" />
                Enviar
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[var(--text-muted)] space-y-3">
            <MessageSquare className="w-12 h-12 text-[var(--accent-cyan)] opacity-50" />
            <p className="text-sm font-bold">Selecciona una conversación para iniciar el chat</p>
          </div>
        )}
      </div>
    </div>
  );
}

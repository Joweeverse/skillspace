'use client'

import React, { useState, useEffect } from 'react'
import { DiscussionService } from '@/services/discussionService'
import { Discussion } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Send, MessageSquare, User, ShieldCheck } from 'lucide-react'

interface DiscussionSectionProps {
  lessonId: string;
  userId: string;
}

export const DiscussionSection = ({ lessonId, userId }: DiscussionSectionProps) => {
  const [messages, setMessages] = useState<Discussion[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function loadDiscussions() {
      try {
        const data = await DiscussionService.getDiscussions(lessonId)
        setMessages(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadDiscussions()
  }, [lessonId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const posted = await DiscussionService.postMessage(lessonId, userId, newMessage)
      setMessages([...messages, posted])
      setNewMessage('')
    } catch (err) {
      console.error(err)
      alert('Gagal mengirim pesan.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mt-12 shadow-xl shadow-gray-200/50">
      <div className="bg-gradient-to-b from-white to-gray-50/50 px-8 py-6 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <MessageSquare size={20} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Diskusi Materi</h3>
        </div>
        <p className="text-sm text-gray-500 ml-11">Tanyakan hal yang membingungkan atau berbagi insight dengan sesama pelajar.</p>
      </div>

      <div className="p-8 space-y-8 max-h-[600px] overflow-y-auto bg-gray-50/30 scroll-smooth">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">Memuat diskusi...</p>
          </div>
        ) : messages.length > 0 ? (
          messages.map((msg) => {
            const isMentor = msg.profiles?.role === 'mentor'
            const isSelf = msg.user_id === userId

            return (
              <div key={msg.id} className={`flex gap-4 group animate-in slide-in-from-bottom-2 duration-300`}>
                <div className="flex-shrink-0">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold shadow-sm transition-transform duration-300 group-hover:scale-110 ${
                    isMentor ? 'bg-gradient-to-br from-blue-600 to-indigo-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'
                  }`}>
                    {msg.profiles?.avatar_url ? (
                      <img src={msg.profiles.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
                    ) : (
                      msg.profiles?.full_name?.charAt(0).toUpperCase() || <User size={20} />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className={`inline-block max-w-full bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md hover:border-blue-100 relative ${
                    isMentor ? 'ring-1 ring-blue-50' : ''
                  }`}>
                    <div className="flex justify-between items-center mb-2 gap-8">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">{msg.profiles?.full_name}</span>
                        {isMentor && (
                          <span className="bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1 shadow-sm shadow-blue-500/20">
                            <ShieldCheck size={10} />
                            Mentor
                          </span>
                        )}
                        {isSelf && (
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Anda</span>
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-gray-400 tabular-nums">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center py-20 px-10">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <MessageSquare size={32} />
            </div>
            <h4 className="text-gray-900 font-bold mb-1">Belum ada diskusi</h4>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">Jadilah yang pertama untuk memulai diskusi materi ini!</p>
          </div>
        )}
      </div>

      <div className="p-8 border-t border-gray-100 bg-white">
        <form onSubmit={handleSubmit} className="flex gap-4">
          <div className="relative flex-1 group">
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Ketik pesan atau pertanyaan..."
              className="w-full p-4 pl-5 bg-gray-50 border border-gray-100 rounded-xl text-sm transition-all duration-300 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none placeholder:text-gray-400 group-hover:bg-gray-100/50 group-hover:border-gray-200"
            />
          </div>
          <Button 
            type="submit" 
            isLoading={isSubmitting}
            disabled={!newMessage.trim()}
            rightIcon={<Send size={18} />}
            className="px-8 shadow-blue-500/20"
          >
            Kirim
          </Button>
        </form>
      </div>
    </div>
  )
}

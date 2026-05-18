'use client'

import React, { useState, useEffect } from 'react'
import { DiscussionService } from '@/services/discussionService'
import { Discussion } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Send, MessageSquare, User, ShieldCheck, Lock, Globe } from 'lucide-react'
import { AuthService } from '@/services/authService'

interface DiscussionSectionProps {
  lessonId: string;
  userId: string;
  initialTab?: 'public' | 'private';
}

export const DiscussionSection = ({ lessonId, userId, initialTab = 'public' }: DiscussionSectionProps) => {
  const [activeTab, setActiveTab] = useState<'public' | 'private'>(initialTab)
  const [messages, setMessages] = useState<Discussion[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userRole, setUserRole] = useState<string>('student')
  const [recipientId, setRecipientId] = useState<string | undefined>(undefined)

  useEffect(() => {
    async function getRole() {
      try {
        const profile = await AuthService.getCurrentUserProfile()
        if (profile) setUserRole(profile.role)
      } catch (err) {
        console.error('Role fetch error:', err)
      }
    }
    getRole()
  }, [])

  useEffect(() => {
    // For mentors, if there are messages, default the recipient to the last student
    if (userRole === 'mentor' && activeTab === 'private' && messages.length > 0) {
      const lastStudentMsg = [...messages].reverse().find(m => m.profiles?.role === 'student')
      if (lastStudentMsg) setRecipientId(lastStudentMsg.user_id)
    }
  }, [messages, userRole, activeTab])

  useEffect(() => {
    async function loadDiscussions() {
      setLoading(true)
      setError(null)
      try {
        let data: Discussion[] = []
        if (activeTab === 'public') {
          data = await DiscussionService.getDiscussions(lessonId)
        } else {
          if (userRole === 'mentor') {
            data = await DiscussionService.getMentorPrivateDiscussions(lessonId)
          } else {
            data = await DiscussionService.getPrivateDiscussions(lessonId, userId)
          }
        }
        setMessages(data)
      } catch (err: any) {
        console.error('Discussion error object:', err)
        // Extract message from Supabase error or use fallback
        const msg = err.message || err.details || (typeof err === 'string' ? err : 'Terjadi kesalahan saat memuat diskusi.')
        setError(msg)
      } finally {
        setLoading(false)
      }
    }
    loadDiscussions()
  }, [lessonId, activeTab, userRole, userId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const isPrivate = activeTab === 'private'
      
      const posted = await DiscussionService.postMessage(
        lessonId, 
        userId, 
        newMessage, 
        isPrivate,
        isPrivate ? recipientId : undefined
      )
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Diskusi Pelajaran</h3>
              <p className="text-xs text-gray-500">Tanyakan hal yang membingungkan atau berbagi insight.</p>
            </div>
          </div>
          
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('public')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'public' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Globe size={16} />
              Publik
            </button>
            <button 
              onClick={() => setActiveTab('private')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'private' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Lock size={16} />
              Tanya Mentor
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8 max-h-[600px] overflow-y-auto bg-gray-50/30 scroll-smooth">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">Memuat diskusi...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 px-10">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
              <ShieldCheck size={32} />
            </div>
            <h4 className="text-red-900 font-bold mb-1">Terjadi Kesalahan</h4>
            <p className="text-sm text-red-500 max-w-xs mx-auto mb-4">{error}</p>
            <div className="bg-gray-100 p-4 rounded-xl text-left overflow-x-auto mb-4">
              <pre className="text-[10px] text-gray-600">
                {JSON.stringify({ activeTab, userRole, userId, lessonId }, null, 2)}
              </pre>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
            >
              Coba Lagi
            </Button>
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
                  } ${msg.is_private ? 'border-amber-100 bg-amber-50/10' : ''}`}>
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
                        {msg.is_private && (
                          <span className="bg-amber-100 text-amber-700 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1">
                            <Lock size={10} />
                            Privat
                          </span>
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
              {activeTab === 'public' ? <MessageSquare size={32} /> : <Lock size={32} />}
            </div>
            <h4 className="text-gray-900 font-bold mb-1">
              {activeTab === 'public' ? 'Belum ada diskusi' : 'Belum ada pesan privat'}
            </h4>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">
              {activeTab === 'public' 
                ? 'Jadilah yang pertama untuk memulai diskusi materi ini!' 
                : 'Punya pertanyaan khusus? Kirim pesan privat ke mentor.'}
            </p>
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
              placeholder={activeTab === 'public' ? "Ketik pesan atau pertanyaan publik..." : "Ketik pesan privat ke mentor..."}
              className={`w-full p-4 pl-5 bg-gray-50 border border-gray-100 rounded-xl text-sm transition-all duration-300 focus:bg-white focus:ring-2 focus:border-blue-500 outline-none placeholder:text-gray-400 group-hover:bg-gray-100/50 group-hover:border-gray-200 ${
                activeTab === 'private' ? 'focus:ring-amber-500/20' : 'focus:ring-blue-500/20'
              }`}
            />
          </div>
          <Button 
            type="submit" 
            isLoading={isSubmitting}
            disabled={!newMessage.trim()}
            rightIcon={<Send size={18} />}
            className={`px-8 ${activeTab === 'private' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20' : 'shadow-blue-500/20'}`}
          >
            Kirim
          </Button>
        </form>
      </div>
    </div>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { DiscussionService } from '@/services/discussionService'
import { Discussion } from '@/types/database'
import { Button } from '@/components/ui/Button'

interface DiscussionSectionProps {
  lessonId: string;
  userId: string;
}

export const DiscussionSection = ({ lessonId, userId }: DiscussionSectionProps) => {
  const [messages, setMessages] = useState<Discussion[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)

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
    if (!newMessage.trim()) return

    try {
      const posted = await DiscussionService.postMessage(lessonId, userId, newMessage)
      setMessages([...messages, posted])
      setNewMessage('')
    } catch (err) {
      console.error(err)
      alert('Gagal mengirim pesan.')
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mt-8 shadow-sm">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900">Diskusi Materi</h3>
        <p className="text-sm text-gray-500">Tanyakan hal yang membingungkan atau berbagi insight.</p>
      </div>

      <div className="p-6 space-y-6 max-h-[500px] overflow-y-auto bg-gray-50/50">
        {loading ? (
          <div className="text-center text-gray-500 py-10">Memuat diskusi...</div>
        ) : messages.length > 0 ? (
          messages.map((msg) => (
            <div key={msg.id} className="flex space-x-4">
              <div className="flex-shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${msg.profiles?.role === 'mentor' ? 'bg-blue-600' : 'bg-gray-400'}`}>
                  {msg.profiles?.full_name?.charAt(0) || 'U'}
                </div>
              </div>
              <div className="flex-1 bg-white p-4 rounded-lg border border-gray-200 shadow-sm relative">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-gray-900 text-sm">{msg.profiles?.full_name}</span>
                    {msg.profiles?.role === 'mentor' && (
                      <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Mentor</span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{msg.message}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-10 italic">Belum ada diskusi. Jadilah yang pertama bertanya!</div>
        )}
      </div>

      <div className="p-6 border-t border-gray-200 bg-white">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ketik pesan atau pertanyaan..."
            className="flex-1 p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <Button type="submit">Kirim</Button>
        </form>
      </div>
    </div>
  )
}

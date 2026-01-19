'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  MessageCircle, 
  Loader2,
  Send,
  Headphones
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function MessagingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeChat, setActiveChat] = useState<string>('support')
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (session?.user?.role !== 'INDIVIDUAL') {
      router.push('/dashboard')
      return
    }

    // Get chat type from URL params
    const chatParam = searchParams.get('chat')
    if (chatParam) {
      setActiveChat(chatParam)
    }
  }, [session, status, router, searchParams])

  const chatHeads = [
    {
      id: 'support',
      name: 'Support',
      description: 'General inquiries and assistance',
      icon: Headphones,
      color: 'bg-red-600'
    },
    // Future-ready for additional chat heads
    // {
    //   id: 'legal',
    //   name: 'Legal Team',
    //   description: 'Document and application questions',
    //   icon: FileText,
    //   color: 'bg-blue-600'
    // },
    // {
    //   id: 'reception',
    //   name: 'Reception',
    //   description: 'General information',
    //   icon: Phone,
    //   color: 'bg-green-600'
    // }
  ]

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    const messageToSend = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'user',
      timestamp: new Date(),
      chatType: activeChat
    }

    setMessages(prev => [...prev, messageToSend])
    setNewMessage('')
    setLoading(true)

    // Simulate API call - in production, this would call your messaging API
    setTimeout(() => {
      const response = {
        id: (Date.now() + 1).toString(),
        text: 'Thank you for your message. Our support team will respond shortly.',
        sender: 'support',
        timestamp: new Date(),
        chatType: activeChat
      }
      setMessages(prev => [...prev, response])
      setLoading(false)
      toast.success('Message sent successfully')
    }, 1000)
  }

  const activeChatHead = chatHeads.find(chat => chat.id === activeChat)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/individual')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center">
              <img 
                src="/logo.png" 
                alt="Docufieds Logo" 
                className="h-16 w-36 object-contain"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Heads Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Chats</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {chatHeads.map((chat) => {
                    const Icon = chat.icon
                    return (
                      <button
                        key={chat.id}
                        onClick={() => setActiveChat(chat.id)}
                        className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                          activeChat === chat.id ? 'bg-red-50 border-l-4 border-l-red-600' : ''
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full ${chat.color} flex items-center justify-center mr-3`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium ${activeChat === chat.id ? 'text-red-600' : 'text-gray-900'}`}>
                              {chat.name}
                            </p>
                            <p className="text-xs text-gray-500">{chat.description}</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Window */}
          <div className="lg:col-span-3">
            <Card className="flex flex-col h-[600px]">
              <CardHeader className="border-b">
                <div className="flex items-center">
                  {activeChatHead && (
                    <>
                      <div className={`w-10 h-10 rounded-full ${activeChatHead.color} flex items-center justify-center mr-3`}>
                        <activeChatHead.icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{activeChatHead.name}</CardTitle>
                        <p className="text-sm text-gray-500">{activeChatHead.description}</p>
                      </div>
                    </>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No messages yet</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Start a conversation with {activeChatHead?.name || 'support'}
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.sender === 'user'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.sender === 'user'
                              ? 'text-red-100'
                              : 'text-gray-500'
                          }`}
                        >
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                    </div>
                  </div>
                )}
              </CardContent>

              <div className="border-t p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || loading}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

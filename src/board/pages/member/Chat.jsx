import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../../../Server";
import { socket } from "../../../socket";

export default function ChatBox({ user }) {
  const { board_id } = useParams();
  const [chats, setChats] = useState([]);
  const [message, setMessage] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [mentionUsers, setMentionUsers] = useState([]);
  const [projectUsers, setProjectUsers] = useState([]);
  const [showMembers, setShowMembers] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Auto Scroll To Bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [chats]);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const me = await apiFetch("/auth/auth/me");
        setCurrentUser(me);
      } catch (err) {
        console.error("❌ Gagal memuat user login:", err);
      }
    };
    fetchCurrentUser();
  }, []);

  // Connect socket + join room
  useEffect(() => {
    if (!board_id) return;

    socket.emit("join_board", board_id);
    console.log("📡 [SOCKET] join_board:", board_id);

    const handleNewMessage = (msg) => {
      console.log("📩 [SOCKET] new_chat_message:", msg);
      setChats((prev) => [...prev, msg]);
    };

    const handleChatDeleted = ({ chat_id }) => {
      console.log("🗑 [SOCKET] chat_deleted:", chat_id);
      setChats((prev) =>
        prev.map((c) =>
          c.chat_id === chat_id ? { ...c, is_deleted: true, message: "[deleted]" } : c
        )
      );
    };

    socket.on("new_chat_message", handleNewMessage);
    socket.on("chat_deleted", handleChatDeleted);

    return () => {
      console.log("📡 [SOCKET] leave_board:", board_id);
      socket.emit("leave_board", board_id);
      socket.off("new_chat_message", handleNewMessage);
      socket.off("chat_deleted", handleChatDeleted);
    };
  }, [board_id]);

  // Fetch initial chat data
  const fetchChats = async () => {
    if (!board_id) return;
    
    try {
      const res = await apiFetch(`/chat/board/${board_id}`, "GET");
      console.log("📥 Data chats dari backend:", res);
      if (res.chats) setChats(res.chats);
    } catch (err) {
      console.error("❌ Gagal fetch chat:", err);
    }
  };

  // Fetch project member list for mention dropdown
  const fetchProjectUsers = async () => {
    if (!board_id) return;
    
    try {
      const res = await apiFetch(`/chat/member/${board_id}`, "GET");
      console.log("📥 Data members dari backend:", res);
      
      if (res.members) {
        const transformedMembers = res.members.map(member => ({
          user_id: member.user_id,
          role: member.role,
          username: member.users?.username || 'Unknown',
          full_name: member.users?.full_name || 'Unknown User',
          email: member.users?.email || ''
        }));
        
        console.log("🔄 Members setelah transformasi:", transformedMembers);
        setProjectUsers(transformedMembers);
      }
    } catch (err) {
      console.error("❌ Gagal ambil member:", err);
    }
  };

  useEffect(() => {
    if (board_id) {
      fetchChats();
      fetchProjectUsers();
    }
  }, [board_id]);

  // Handle Send Message dengan loading state
  const sendMessage = async () => {
    console.log("Mengirim pesan:", message);
    if (!message.trim() || !board_id || isSending) return;

    const mentionIds = mentionUsers.map((u) => u.user_id);

    const body = {
      message,
      reply_to: replyTo?.chat_id || null,
      mentions: mentionIds,
    };

    setIsSending(true);

    try {
      console.log("📡 [FRONTEND] POST /chat/board/" + board_id, body);
      await apiFetch(`/chat/board/${board_id}`, {
        method: "POST",
        body: JSON.stringify(body),
      });

      setMessage("");
      setReplyTo(null);
      setMentionUsers([]);
    } catch (err) {
      console.error("❌ Gagal kirim chat:", err);
    } finally {
      setIsSending(false);
    }
  };

  // Handle delete chat
  const deleteMessage = async (chat_id) => {
    try {
      await apiFetch(`/chat/${chat_id}`, {
        method: "DELETE",
      });
      console.log("✅ Pesan berhasil dihapus:", chat_id);
    } catch (err) {
      console.error("❌ Gagal delete chat:", err);
    }
  };

  // Detect mention typing - IMPROVED: Show dropdown immediately when @ is typed
  const handleInputChange = (e) => {
    const text = e.target.value;
    setMessage(text);

    // Cek apakah ada @ di akhir kata
    const mentionMatch = text.match(/@(\w*)$/);
    if (mentionMatch) {
      const keyword = mentionMatch[1].toLowerCase();
      
      // Jika hanya @ saja (tanpa karakter), tampilkan semua user
      if (keyword === '') {
        setMentionUsers(projectUsers);
      } else {
        // Jika ada keyword, filter user
        const filtered = projectUsers.filter((u) => 
          u.username.toLowerCase().includes(keyword) ||
          u.full_name.toLowerCase().includes(keyword)
        );
        setMentionUsers(filtered);
      }
    } else {
      setMentionUsers([]);
    }
  };

  // Insert mention into message
  const selectMention = (user) => {
    // Replace only the last @mention pattern
    const replaced = message.replace(/@\w*$/, `@${user.username} `);
    setMessage(replaced);
    setMentionUsers([]);
    inputRef.current?.focus();
  };

  // Handle Enter key untuk send message
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isSending) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Safe chat user display
  const getChatUserName = (chat) => {
    return chat.users?.full_name || "Unknown User";
  };

  // Get replied message text
  const getRepliedMessage = (chat) => {
    if (!chat.reply_to) return null;
    
    // Cari pesan yang dibalas di dalam chats
    const repliedChat = chats.find(c => c.chat_id === chat.reply_to);
    return repliedChat ? repliedChat.message : "Pesan yang dihapus";
  };

  // Check if user can delete message
  const canDeleteMessage = (chat) => {
    if (!currentUser?.user_id) return false;
    return chat.user_id === currentUser.user_id || currentUser.role === "admin";
  };

  // Check if message is from current user
  const isCurrentUserMessage = (chat) => {
    return currentUser?.user_id && chat.user_id === currentUser.user_id;
  };

  // Check if current user is mentioned in the message
  const isCurrentUserMentioned = (chat) => {
    if (!currentUser?.user_id || !chat.mention_users) return false;
    return chat.mention_users.some(user => user.user_id === currentUser.user_id);
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'member': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get user avatar color based on user_id
  const getAvatarColor = (userId) => {
    const colors = [
      'bg-gradient-to-r from-blue-500 to-blue-600',
      'bg-gradient-to-r from-green-500 to-green-600',
      'bg-gradient-to-r from-purple-500 to-purple-600',
      'bg-gradient-to-r from-orange-500 to-orange-600',
      'bg-gradient-to-r from-pink-500 to-pink-600',
      'bg-gradient-to-r from-teal-500 to-teal-600',
    ];
    return colors[userId % colors.length];
  };

  // Highlight mentions in message dengan penanda khusus untuk current user
  const renderMessageWithMentions = (message, mentionUsers = []) => {
    if (!mentionUsers.length) return message;

    let result = message;
    mentionUsers.forEach(user => {
      const mentionPattern = new RegExp(`@${user.username}\\b`, 'g');
      const isCurrentUser = user.user_id === currentUser?.user_id;
      
      result = result.replace(
        mentionPattern, 
        isCurrentUser 
          ? `<span class="mention-highlight-current bg-yellow-100 text-yellow-800 border border-yellow-300 px-1 py-0.5 rounded mx-0.5 font-medium">@${user.username}</span>`
          : `<span class="mention-highlight bg-purple-100 text-purple-800 px-1 py-0.5 rounded mx-0.5">@${user.username}</span>`
      );
    });

    return <span dangerouslySetInnerHTML={{ __html: result }} />;
  };

  // Mobile sidebar toggle
  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  if (!board_id) {
    return (
      <div className="flex flex-col h-full bg-gray-50 rounded-lg">
        <div className="p-4 text-center text-gray-500">
          Board ID tidak ditemukan
        </div>
      </div>
    );
  }

  return (
    // Container utama dengan height fixed
    <div className="flex h-[calc(100vh-100px)] bg-white rounded-lg border border-gray-200">
      
      {/* Sidebar - Member List - Mobile: Hidden by default, Desktop: Always visible */}
      <div className={`
        ${isMobileSidebarOpen ? 'fixed inset-0 z-50 block' : 'hidden'} 
        lg:block lg:static lg:w-80 border-r border-gray-200 bg-gray-50 flex flex-col h-full
      `}>
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <h3 className="font-semibold text-gray-800">Team Members</h3>
          <button 
            onClick={toggleMobileSidebar}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* User Profile Section */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${getAvatarColor(currentUser?.user_id || 0)}`}>
              <span className="font-semibold text-lg">
                {currentUser?.full_name?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{currentUser?.full_name || 'User'}</h3>
              <p className="text-sm text-green-600">● available</p>
            </div>
          </div>
        </div>

        {/* Members List - Scrollable area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h4 className="font-semibold text-gray-700 mb-4">Team Members ({projectUsers.length})</h4>
            <div className="space-y-3">
              {projectUsers.map((member) => (
                <div 
                  key={member.user_id} 
                  className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${getAvatarColor(member.user_id)}`}>
                    <span className="font-semibold text-sm">
                      {member.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-800 truncate">
                        {member.full_name}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full border ${getRoleBadgeColor(member.role)}`}>
                        {member.role}
                      </span>
                      {member.user_id === currentUser?.user_id && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full border border-yellow-300">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 truncate">@{member.username}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full w-full">
        
        {/* Chat Header dengan Mobile Menu Button */}
        <div className="p-4 lg:p-6 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <button 
                onClick={toggleMobileSidebar}
                className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h2 className="text-lg lg:text-xl font-semibold text-gray-800">Group Chat</h2>
              </div>
            </div>
            {/* Mobile Members Count */}
            <div className="lg:hidden">
              <button 
                onClick={toggleMobileSidebar}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                {projectUsers.length} Members
              </button>
            </div>
          </div>
        </div>

        {/* Chat Messages - Scrollable area */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto bg-gray-50"
        >
          <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
            {chats.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[200px]">
                <div className="text-center text-gray-500">
                  <div className="text-4xl lg:text-6xl mb-4">💬</div>
                  <p className="text-base lg:text-lg font-medium">Belum ada pesan</p>
                  <p className="text-xs lg:text-sm mt-2">Mulai percakapan dengan tim Anda!</p>
                </div>
              </div>
            ) : (
              chats.map((chat) => (
                <div 
                  key={chat.chat_id} 
                  className={`flex space-x-3 lg:space-x-4 ${isCurrentUserMessage(chat) ? 'flex-row-reverse space-x-reverse' : ''} ${
                    isCurrentUserMentioned(chat) ? 'bg-yellow-50 border border-yellow-200 rounded-lg p-2' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-white ${getAvatarColor(chat.user_id)}`}>
                    <span className="font-semibold text-xs lg:text-sm">
                      {getChatUserName(chat)?.charAt(0) || 'U'}
                    </span>
                  </div>

                  {/* Message Content */}
                  <div className={`flex-1 max-w-2xl ${isCurrentUserMessage(chat) ? 'text-right' : ''}`}>
                    {/* Message Header */}
                    <div className={`flex items-center space-x-2 mb-1 ${isCurrentUserMessage(chat) ? 'justify-end' : ''}`}>
                      <span className="font-semibold text-gray-800 text-sm lg:text-base">
                        {getChatUserName(chat)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {chat.created_at ? new Date(chat.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        }) : ''}
                      </span>
                      {isCurrentUserMessage(chat) && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">You</span>
                      )}
                      {isCurrentUserMentioned(chat) && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full border border-yellow-300">
                          📌
                        </span>
                      )}
                    </div>

                    {/* Reply Preview */}
                    {chat.reply_to && !chat.is_deleted && (
                      <div className="mb-2 p-2 lg:p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400 text-left">
                        <p className="text-xs text-blue-600 font-medium mb-1">
                          Membalas {getChatUserName(chats.find(c => c.chat_id === chat.reply_to))}
                        </p>
                        <p className="text-xs lg:text-sm text-blue-800 truncate">
                          {getRepliedMessage(chat)}
                        </p>
                      </div>
                    )}

                    {/* Message Content */}
                    {chat.is_deleted ? (
                      <div className="italic text-gray-500 text-sm bg-gray-100 p-2 lg:p-3 rounded-2xl inline-block">
                        [pesan dihapus]
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className={`inline-block p-3 lg:p-4 rounded-2xl ${
                          isCurrentUserMessage(chat) 
                            ? 'bg-blue-500 text-white rounded-br-none' 
                            : 'bg-white border border-gray-200 rounded-bl-none'
                        }`}>
                          <p className="text-sm lg:text-base">
                            {renderMessageWithMentions(chat.message, chat.mention_users)}
                          </p>
                        </div>

                        {/* Additional Mention Badges */}
                        {chat.mention_users && chat.mention_users.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {chat.mention_users.map((user, index) => (
                              <span
                                key={index}
                                className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                                  user.user_id === currentUser?.user_id
                                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                                    : 'bg-purple-100 text-purple-800'
                                }`}
                              >
                                {user.user_id === currentUser?.user_id && '📍 '}@{user.username}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Message Actions */}
                    {!chat.is_deleted && (
                      <div className={`flex space-x-2 mt-2 ${isCurrentUserMessage(chat) ? 'justify-end' : ''}`}>
                        <button 
                          onClick={() => setReplyTo(chat)}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                        >
                          Balas
                        </button>
                        {canDeleteMessage(chat) && (
                          <button 
                            onClick={() => deleteMessage(chat.chat_id)}
                            className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Reply Preview */}
        {replyTo && (
          <div className="flex items-center justify-between p-3 lg:p-4 bg-blue-50 border-t border-blue-200 flex-shrink-0">
            <div className="flex-1">
              <p className="text-xs text-blue-600 font-medium">Membalas {getChatUserName(replyTo)}:</p>
              <p className="text-xs lg:text-sm text-blue-800 truncate">
                {replyTo.message && replyTo.message.length > 50 
                  ? `${replyTo.message.substring(0, 50)}...` 
                  : replyTo.message || 'Pesan'}
              </p>
            </div>
            <button 
              onClick={() => setReplyTo(null)}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 p-1 lg:p-2 rounded-full transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        {/* Input Area dengan Mention Dropdown di ATAS */}
        <div className="p-4 lg:p-6 border-t border-gray-200 bg-white relative flex-shrink-0">
          {/* Mention Dropdown - POSISI DI ATAS INPUT */}
          {mentionUsers.length > 0 && (
            <div className="absolute bottom-full left-4 lg:left-6 right-4 lg:right-6 mb-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-20">
              <div className="p-2 text-xs text-gray-500 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                Mention team members ({mentionUsers.length}):
              </div>
              {mentionUsers.map((u) => (
                <div 
                  key={u.user_id} 
                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                  onClick={() => selectMention(u)}
                >
                  <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-white ${getAvatarColor(u.user_id)}`}>
                    <span className="font-semibold text-xs">
                      {u.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-800 text-sm">@{u.username}</span>
                      {u.user_id === currentUser?.user_id && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600">{u.full_name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Input Field */}
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Write your message... Use @ to mention team members"
              className="w-full px-4 lg:px-6 py-3 lg:py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pr-20 lg:pr-24 text-sm lg:text-base"
              disabled={isSending}
            />
            <button 
              onClick={sendMessage}
              disabled={!message.trim() || isSending}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 px-4 lg:px-6 py-2 rounded-xl font-medium transition-all flex items-center space-x-2 ${
                message.trim() && !isSending
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="hidden lg:inline">Sending...</span>
                </>
              ) : (
                <span>Send</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleMobileSidebar}
        />
      )}
    </div>
  );
}
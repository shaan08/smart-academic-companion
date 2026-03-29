import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send } from "lucide-react";

interface Props {
  roomId: string;
  userId: string;
}

interface ChatMessage {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
}

interface ProfileCache {
  username: string;
  full_name: string | null;
  color: string;
}

const RoomChat = ({ roomId, userId }: Props) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileCache>>({});
  const [input, setInput] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    fetchMessages();
    fetchMemberProfiles();

    // Realtime messages
    const channel = supabase
      .channel(`room-chat-${roomId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "room_messages", filter: `room_id=eq.${roomId}` }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        setMessages((prev) => [...prev, newMsg]);
      })
      .subscribe();

    // Presence for typing
    const presenceChannel = supabase
      .channel(`typing-${roomId}`)
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const typing: string[] = [];
        for (const key of Object.keys(state)) {
          const presences = state[key] as any[];
          for (const p of presences) {
            if (p.typing && p.user_id !== userId) {
              typing.push(p.user_id);
            }
          }
        }
        setTypingUsers(typing);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(presenceChannel);
    };
  }, [roomId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMemberProfiles = async () => {
    const { data: members } = await supabase
      .from("room_members")
      .select("user_id, color")
      .eq("room_id", roomId);

    if (!members) return;
    const userIds = members.map((m) => m.user_id);
    const colorMap: Record<string, string> = {};
    members.forEach((m) => { colorMap[m.user_id] = m.color || "#888"; });

    const { data: profs } = await supabase
      .from("profiles")
      .select("id, username, full_name")
      .in("id", userIds);

    const map: Record<string, ProfileCache> = {};
    profs?.forEach((p) => {
      map[p.id] = { username: p.username, full_name: p.full_name, color: colorMap[p.id] || "#888" };
    });
    setProfiles(map);
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("room_messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })
      .limit(100);
    setMessages((data as ChatMessage[]) || []);
  };

  const handleTyping = () => {
    const channel = supabase.channel(`typing-${roomId}`);
    channel.track({ user_id: userId, typing: true });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      channel.track({ user_id: userId, typing: false });
    }, 2000);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const msg = input.trim();
    setInput("");
    // Stop typing indicator
    const channel = supabase.channel(`typing-${roomId}`);
    channel.track({ user_id: userId, typing: false });

    await supabase.from("room_messages").insert({
      room_id: roomId,
      user_id: userId,
      content: msg,
    });
  };

  const getName = (uid: string) => {
    const p = profiles[uid];
    return p?.full_name || p?.username || "User";
  };

  const getColor = (uid: string) => profiles[uid]?.color || "#888";

  const typingNames = typingUsers
    .map((uid) => getName(uid))
    .filter(Boolean);

  return (
    <div className="flex flex-col h-full">
      <ScrollArea ref={scrollRef} className="flex-1 p-3">
        <div className="space-y-3">
          {messages.map((msg, i) => {
            const isMe = msg.user_id === userId;
            const showName = !isMe && (i === 0 || messages[i - 1].user_id !== msg.user_id);
            return (
              <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                {!isMe && showName ? (
                  <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                    <AvatarFallback className="text-[10px] text-white" style={{ backgroundColor: getColor(msg.user_id) }}>
                      {getName(msg.user_id).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ) : !isMe ? <div className="w-6 shrink-0" /> : null}
                <div className={`max-w-[80%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                  {showName && !isMe && (
                    <span className="text-[10px] font-medium text-muted-foreground mb-0.5 ml-1">{getName(msg.user_id)}</span>
                  )}
                  <div className={`rounded-2xl px-3 py-1.5 text-xs ${isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm"}`}>
                    {msg.content}
                  </div>
                  <span className="text-[9px] text-muted-foreground mt-0.5 mx-1">
                    {new Date(msg.created_at || "").toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        {typingNames.length > 0 && (
          <div className="text-[10px] text-muted-foreground mt-2 ml-1 animate-pulse">
            {typingNames.join(", ")} {typingNames.length === 1 ? "is" : "are"} typing...
          </div>
        )}
      </ScrollArea>
      <div className="p-2 border-t border-border">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-1">
          <Input
            value={input}
            onChange={(e) => { setInput(e.target.value); handleTyping(); }}
            placeholder="Type a message..."
            className="h-8 text-xs rounded-full"
          />
          <Button type="submit" size="icon" className="h-8 w-8 shrink-0 rounded-full" disabled={!input.trim()}>
            <Send className="w-3 h-3" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default RoomChat;

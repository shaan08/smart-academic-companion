import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Copy, Check, Users } from "lucide-react";

interface Props {
  roomId: string;
  inviteCode?: string;
}

const RoomMembers = ({ roomId, inviteCode }: Props) => {
  const [members, setMembers] = useState<any[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchMembers();

    // Presence channel for online status
    const presenceChannel = supabase
      .channel(`presence-${roomId}`)
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const onlineIds = new Set<string>();
        for (const key of Object.keys(state)) {
          const presences = state[key] as any[];
          for (const p of presences) {
            if (p.user_id) onlineIds.add(p.user_id);
          }
        }
        setOnlineUserIds(onlineIds);
      })
      .subscribe();

    return () => { supabase.removeChannel(presenceChannel); };
  }, [roomId]);

  const fetchMembers = async () => {
    const { data } = await supabase
      .from("room_members")
      .select("*, profiles:user_id(username, full_name, avatar_url)")
      .eq("room_id", roomId);
    setMembers(data || []);
  };

  const copyCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      {inviteCode && (
        <div className="p-3 rounded-lg bg-muted/50 border border-border">
          <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">INVITE CODE</p>
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono font-bold text-primary flex-1">{inviteCode}</code>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={copyCode}>
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">Share this code so others can join</p>
        </div>
      )}

      <div>
        <h3 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1">
          <Users className="w-3 h-3" /> Members ({members.length})
        </h3>
        {members.map((m) => {
          const profile = m.profiles as any;
          const name = profile?.full_name || profile?.username || "User";
          const isOnline = onlineUserIds.has(m.user_id);
          return (
            <div key={m.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors">
              <div className="relative">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs text-white" style={{ backgroundColor: m.color || "#888" }}>
                    {name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card ${isOnline ? "bg-green-500" : "bg-muted-foreground/40"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{name}</p>
                <p className="text-[10px] text-muted-foreground">{isOnline ? "Online" : "Offline"}</p>
              </div>
              {m.role === "admin" && <Badge variant="secondary" className="text-[10px] h-4">Admin</Badge>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RoomMembers;

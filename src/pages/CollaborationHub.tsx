import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Code2, Plus, Users, Clock, LogIn, Loader2, Globe, Lock, Copy, Check, Search } from "lucide-react";

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "html", label: "HTML/CSS" },
  { value: "sql", label: "SQL" },
];

interface CodingRoom {
  id: string;
  name: string;
  project_title: string | null;
  language: string;
  tech_stack: string[];
  invite_code: string;
  created_by: string;
  last_active: string;
  created_at: string;
  is_active: boolean | null;
}

const CollaborationHub = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [myRooms, setMyRooms] = useState<CodingRoom[]>([]);
  const [publicRooms, setPublicRooms] = useState<CodingRoom[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [newRoom, setNewRoom] = useState({ name: "", project_title: "", language: "javascript" });
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [activeTab, setActiveTab] = useState("my-rooms");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchMyRooms();
      fetchPublicRooms();
    }
  }, [user]);

  const fetchMyRooms = async () => {
    setLoading(true);
    const { data: memberRooms } = await supabase
      .from("room_members")
      .select("room_id")
      .eq("user_id", user!.id);

    if (memberRooms && memberRooms.length > 0) {
      const roomIds = memberRooms.map((m) => m.room_id);
      const { data } = await supabase
        .from("coding_rooms")
        .select("*")
        .in("id", roomIds)
        .order("last_active", { ascending: false });
      setMyRooms((data as CodingRoom[]) || []);

      // Fetch member counts
      for (const id of roomIds) {
        const { count } = await supabase
          .from("room_members")
          .select("*", { count: "exact", head: true })
          .eq("room_id", id);
        setMemberCounts((prev) => ({ ...prev, [id]: count || 0 }));
      }
    } else {
      setMyRooms([]);
    }
    setLoading(false);
  };

  const fetchPublicRooms = async () => {
    const { data } = await supabase
      .from("coding_rooms")
      .select("*")
      .eq("is_active", true)
      .order("last_active", { ascending: false })
      .limit(50);

    const rooms = (data as CodingRoom[]) || [];
    setPublicRooms(rooms);

    // Fetch member counts for public rooms
    for (const room of rooms) {
      if (!memberCounts[room.id]) {
        const { count } = await supabase
          .from("room_members")
          .select("*", { count: "exact", head: true })
          .eq("room_id", room.id);
        setMemberCounts((prev) => ({ ...prev, [room.id]: count || 0 }));
      }
    }
  };

  const createRoom = async () => {
    if (!newRoom.name.trim()) return;
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("coding_rooms")
        .insert({
          name: newRoom.name,
          project_title: newRoom.project_title || null,
          language: newRoom.language,
          created_by: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      setCreateOpen(false);
      setNewRoom({ name: "", project_title: "", language: "javascript" });
      toast({ title: "Room created!", description: `Share code: ${data.invite_code}` });
      navigate(`/collaboration/${data.id}`);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const joinRoom = async (inviteCode?: string) => {
    const code = inviteCode || joinCode.trim();
    if (!code) return;
    setJoining(true);
    try {
      const { data: room, error: findError } = await supabase
        .from("coding_rooms")
        .select("id")
        .eq("invite_code", code)
        .single();

      if (findError || !room) {
        toast({ title: "Room not found", description: "Invalid invite code", variant: "destructive" });
        return;
      }

      await joinRoomById(room.id);
    } catch (error: any) {
      toast({ title: "Error joining room", description: error.message, variant: "destructive" });
    } finally {
      setJoining(false);
    }
  };

  const joinRoomById = async (roomId: string) => {
    try {
      const { data: existingMember } = await supabase
        .from("room_members")
        .select("id")
        .eq("room_id", roomId)
        .eq("user_id", user!.id)
        .maybeSingle();

      if (existingMember) {
        navigate(`/collaboration/${roomId}`);
        return;
      }

      const { error: joinError } = await supabase
        .from("room_members")
        .insert({ room_id: roomId, user_id: user!.id });

      if (joinError) throw joinError;

      toast({ title: "Joined!", description: "You've joined the coding room." });
      navigate(`/collaboration/${roomId}`);
    } catch (error: any) {
      toast({ title: "Error joining room", description: error.message, variant: "destructive" });
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredPublicRooms = publicRooms.filter((room) => {
    const q = searchQuery.toLowerCase();
    return !q || room.name.toLowerCase().includes(q) || room.project_title?.toLowerCase().includes(q) || room.language.toLowerCase().includes(q);
  });

  const isMyRoom = (roomId: string) => myRooms.some((r) => r.id === roomId);

  if (authLoading) return null;

  const RoomCard = ({ room, showJoin = false }: { room: CodingRoom; showJoin?: boolean }) => (
    <Card className="hover:shadow-md hover:border-primary/40 transition-all h-full group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{room.name}</CardTitle>
            {room.project_title && <CardDescription className="truncate">{room.project_title}</CardDescription>}
          </div>
          <Badge variant="secondary" className="text-[10px] shrink-0 ml-2">
            {LANGUAGES.find((l) => l.value === room.language)?.label || room.language}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {memberCounts[room.id] || 0} members
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(room.last_active || room.created_at).toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {showJoin && !isMyRoom(room.id) ? (
            <Button size="sm" className="flex-1 h-8 text-xs" onClick={() => joinRoomById(room.id)}>
              <LogIn className="w-3 h-3 mr-1" /> Join Room
            </Button>
          ) : (
            <Link to={`/collaboration/${room.id}`} className="flex-1">
              <Button size="sm" variant="default" className="w-full h-8 text-xs">
                <Code2 className="w-3 h-3 mr-1" /> Open
              </Button>
            </Link>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={(e) => { e.stopPropagation(); copyInviteCode(room.invite_code); }}
          >
            {copiedCode === room.invite_code ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-1 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Collaboration Hub
              </h1>
              <p className="text-muted-foreground text-sm">Create or join coding rooms — code together in real-time</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Invite code..."
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="w-36 h-9"
                  onKeyDown={(e) => e.key === "Enter" && joinRoom()}
                />
                <Button variant="outline" size="sm" className="h-9" onClick={() => joinRoom()} disabled={!joinCode.trim() || joining}>
                  {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LogIn className="w-4 h-4 mr-1" /> Join</>}
                </Button>
              </div>
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-9">
                    <Plus className="w-4 h-4 mr-1" /> Create Room
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Coding Room</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Room Name *</Label>
                      <Input value={newRoom.name} onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })} placeholder="e.g., Algorithm Practice" />
                    </div>
                    <div className="space-y-2">
                      <Label>Project Title</Label>
                      <Input value={newRoom.project_title} onChange={(e) => setNewRoom({ ...newRoom, project_title: e.target.value })} placeholder="e.g., Sorting Visualizer" />
                    </div>
                    <div className="space-y-2">
                      <Label>Language</Label>
                      <Select value={newRoom.language} onValueChange={(v) => setNewRoom({ ...newRoom, language: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map((l) => (
                            <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={createRoom} className="w-full" disabled={creating || !newRoom.name.trim()}>
                      {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create & Open Room"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Tabs: My Rooms + Browse */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="my-rooms" className="gap-1"><Lock className="w-3 h-3" /> My Rooms</TabsTrigger>
              <TabsTrigger value="browse" className="gap-1"><Globe className="w-3 h-3" /> Browse Public Rooms</TabsTrigger>
            </TabsList>

            <TabsContent value="my-rooms">
              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : myRooms.length === 0 ? (
                <Card className="text-center py-16">
                  <CardContent>
                    <Code2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No coding rooms yet</h3>
                    <p className="text-muted-foreground mb-6 text-sm">Create a new room or join one with an invite code to start coding together</p>
                    <div className="flex gap-3 justify-center">
                      <Button onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4 mr-1" /> Create Room</Button>
                      <Button variant="outline" onClick={() => setActiveTab("browse")}><Globe className="w-4 h-4 mr-1" /> Browse Rooms</Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myRooms.map((room) => <RoomCard key={room.id} room={room} />)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="browse">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search rooms by name, project, or language..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              {filteredPublicRooms.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">No public rooms found</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPublicRooms.map((room) => <RoomCard key={room.id} room={room} showJoin />)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default CollaborationHub;

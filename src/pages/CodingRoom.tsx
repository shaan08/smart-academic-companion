import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import CodeEditorPanel from "@/components/collaboration/CodeEditorPanel";
import RoomSidebar from "@/components/collaboration/RoomSidebar";
import RoomChat from "@/components/collaboration/RoomChat";
import RoomTasks from "@/components/collaboration/RoomTasks";
import RoomFiles from "@/components/collaboration/RoomFiles";
import RoomMembers from "@/components/collaboration/RoomMembers";
import AiCodeAssistant from "@/components/collaboration/AiCodeAssistant";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Play, Save, Loader2, Copy, Check, MessageSquare, Users, ListTodo, FolderOpen, Sparkles } from "lucide-react";

const LANGUAGES = [
  { value: "javascript", label: "JavaScript", monaco: "javascript" },
  { value: "typescript", label: "TypeScript", monaco: "typescript" },
  { value: "python", label: "Python", monaco: "python" },
  { value: "java", label: "Java", monaco: "java" },
  { value: "cpp", label: "C++", monaco: "cpp" },
  { value: "c", label: "C", monaco: "c" },
  { value: "html", label: "HTML/CSS", monaco: "html" },
  { value: "sql", label: "SQL", monaco: "sql" },
];

const CodingRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [room, setRoom] = useState<any>(null);
  const [currentFile, setCurrentFile] = useState<any>(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "saving">("saved");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [rightTab, setRightTab] = useState("chat");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Track presence
  useEffect(() => {
    if (!user || !roomId) return;
    const presenceChannel = supabase.channel(`presence-${roomId}`);
    presenceChannel
      .on("presence", { event: "sync" }, () => {})
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({ user_id: user.id, online_at: new Date().toISOString() });
        }
      });

    return () => { supabase.removeChannel(presenceChannel); };
  }, [user, roomId]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && roomId) {
      fetchRoom();
      fetchOrCreateDefaultFile();
    }
  }, [user, roomId]);

  useEffect(() => {
    if (currentFile && saveStatus === "unsaved") {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => saveCode(), 3000);
    }
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [code, saveStatus]);

  // Realtime file content sync
  useEffect(() => {
    if (!currentFile) return;
    const channel = supabase
      .channel(`file-${currentFile.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "room_files", filter: `id=eq.${currentFile.id}` }, (payload) => {
        if (payload.new && (payload.new as any).content !== code) {
          setCode((payload.new as any).content || "");
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentFile?.id]);

  const fetchRoom = async () => {
    const { data, error } = await supabase.from("coding_rooms").select("*").eq("id", roomId!).single();
    if (error || !data) { navigate("/collaboration"); return; }
    setRoom(data);
    setLanguage(data.language);
  };

  const fetchOrCreateDefaultFile = async () => {
    const { data: files } = await supabase
      .from("room_files")
      .select("*")
      .eq("room_id", roomId!)
      .order("created_at", { ascending: true });

    if (files && files.length > 0) {
      setCurrentFile(files[0]);
      setCode(files[0].content || "");
      setLanguage(files[0].language || "javascript");
    } else {
      const ext = language === "python" ? "py" : language === "java" ? "java" : language === "cpp" ? "cpp" : language === "c" ? "c" : language === "html" ? "html" : language === "sql" ? "sql" : "js";
      const { data: newFile } = await supabase
        .from("room_files")
        .insert({
          room_id: roomId!,
          file_name: `main.${ext}`,
          file_path: `src/main.${ext}`,
          content: getDefaultCode(language),
          language,
          created_by: user!.id,
        })
        .select()
        .single();
      if (newFile) {
        setCurrentFile(newFile);
        setCode(newFile.content || "");
      }
    }
  };

  const getDefaultCode = (lang: string) => {
    const templates: Record<string, string> = {
      javascript: '// Welcome to SAC Coding Room\nconsole.log("Hello, World!");',
      typescript: '// Welcome to SAC Coding Room\nconst greeting: string = "Hello, World!";\nconsole.log(greeting);',
      python: '# Welcome to SAC Coding Room\nprint("Hello, World!")',
      java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
      cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}',
      c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>SAC Project</title>\n</head>\n<body>\n  <h1>Hello, World!</h1>\n</body>\n</html>',
      sql: '-- Welcome to SAC Coding Room\nSELECT \'Hello, World!\' AS greeting;',
    };
    return templates[lang] || templates.javascript;
  };

  const handleCodeChange = useCallback((value: string | undefined) => {
    setCode(value || "");
    setSaveStatus("unsaved");
  }, []);

  const saveCode = async () => {
    if (!currentFile) return;
    setSaving(true);
    setSaveStatus("saving");
    try {
      await supabase.from("room_files").update({ content: code, updated_at: new Date().toISOString() }).eq("id", currentFile.id);
      await supabase.from("code_versions").insert({
        file_id: currentFile.id,
        content: code,
        saved_by: user!.id,
      });
      setSaveStatus("saved");
    } catch {
      setSaveStatus("unsaved");
    } finally {
      setSaving(false);
    }
  };

  const handleSelectFile = (file: any) => {
    setCurrentFile(file);
    setCode(file.content || "");
    setLanguage(file.language || "javascript");
    setSaveStatus("saved");
  };

  const copyInviteCode = () => {
    if (room?.invite_code) {
      navigator.clipboard.writeText(room.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRun = () => {
    setOutput("⚠️ Code execution requires an external runtime (Judge0 API). Coming soon!\n\nFor now, use the AI Assistant to analyze and debug your code.");
  };

  if (authLoading || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const monacoLang = LANGUAGES.find((l) => l.value === language)?.monaco || "javascript";

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0 bg-card">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/collaboration")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-sm font-semibold">{room.name}</h1>
            {room.project_title && <p className="text-xs text-muted-foreground">{room.project_title}</p>}
          </div>
          <Badge variant="outline" className="text-xs cursor-pointer" onClick={copyInviteCode}>
            {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
            {room.invite_code}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant={saveStatus === "saved" ? "secondary" : saveStatus === "saving" ? "outline" : "destructive"} className="text-xs">
            {saveStatus === "saved" ? "Saved" : saveStatus === "saving" ? "Saving..." : "Unsaved"}
          </Badge>
          <Button size="sm" variant="outline" onClick={saveCode} disabled={saving || saveStatus === "saved"}>
            <Save className="w-3 h-3 mr-1" /> Save
          </Button>
          <Button size="sm" onClick={handleRun}>
            <Play className="w-3 h-3 mr-1" /> Run
          </Button>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        <RoomSidebar roomId={roomId!} userId={user!.id} currentFileId={currentFile?.id} onSelectFile={handleSelectFile} language={language} />

        {/* Code editor */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 min-h-0">
            <CodeEditorPanel code={code} language={monacoLang} onChange={handleCodeChange} />
          </div>
          {output && (
            <div className="h-32 border-t border-border bg-card p-3 overflow-auto">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-muted-foreground">Output</span>
                <Button variant="ghost" size="sm" className="h-5 text-xs" onClick={() => setOutput("")}>Clear</Button>
              </div>
              <pre className="text-xs font-mono whitespace-pre-wrap text-foreground">{output}</pre>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="w-80 border-l border-border flex flex-col bg-card shrink-0">
          <Tabs value={rightTab} onValueChange={setRightTab} className="flex flex-col h-full">
            <TabsList className="grid grid-cols-5 m-2">
              <TabsTrigger value="chat" className="text-xs px-1"><MessageSquare className="w-3 h-3" /></TabsTrigger>
              <TabsTrigger value="members" className="text-xs px-1"><Users className="w-3 h-3" /></TabsTrigger>
              <TabsTrigger value="tasks" className="text-xs px-1"><ListTodo className="w-3 h-3" /></TabsTrigger>
              <TabsTrigger value="files" className="text-xs px-1"><FolderOpen className="w-3 h-3" /></TabsTrigger>
              <TabsTrigger value="ai" className="text-xs px-1"><Sparkles className="w-3 h-3" /></TabsTrigger>
            </TabsList>
            <div className="flex-1 overflow-hidden">
              <TabsContent value="chat" className="h-full m-0">
                <RoomChat roomId={roomId!} userId={user!.id} />
              </TabsContent>
              <TabsContent value="members" className="h-full m-0 p-3 overflow-auto">
                <RoomMembers roomId={roomId!} inviteCode={room.invite_code} />
              </TabsContent>
              <TabsContent value="tasks" className="h-full m-0 p-3 overflow-auto">
                <RoomTasks roomId={roomId!} userId={user!.id} />
              </TabsContent>
              <TabsContent value="files" className="h-full m-0 p-3 overflow-auto">
                <RoomFiles roomId={roomId!} userId={user!.id} onSelectFile={handleSelectFile} currentFileId={currentFile?.id} />
              </TabsContent>
              <TabsContent value="ai" className="h-full m-0">
                <AiCodeAssistant code={code} language={language} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CodingRoom;

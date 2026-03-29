import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { File, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  roomId: string;
  userId: string;
  onSelectFile: (file: any) => void;
  currentFileId?: string;
}

const RoomFiles = ({ roomId, userId, onSelectFile, currentFileId }: Props) => {
  const [files, setFiles] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => { fetchFiles(); }, [roomId]);

  const fetchFiles = async () => {
    const { data } = await supabase.from("room_files").select("*").eq("room_id", roomId).order("file_path");
    setFiles(data || []);
  };

  const addFile = async () => {
    if (!newName.trim()) return;
    const { data } = await supabase.from("room_files").insert({
      room_id: roomId,
      file_name: newName,
      file_path: `src/${newName}`,
      content: "",
      created_by: userId,
    }).select().single();
    if (data) {
      fetchFiles();
      onSelectFile(data);
    }
    setAdding(false);
    setNewName("");
  };

  const deleteFile = async (id: string) => {
    await supabase.from("room_files").delete().eq("id", id);
    fetchFiles();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground">Project Files</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAdding(true)}>
          <Plus className="w-3 h-3" />
        </Button>
      </div>
      {adding && (
        <Input className="h-7 text-xs" placeholder="filename.ext" value={newName} onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addFile(); if (e.key === "Escape") setAdding(false); }} autoFocus />
      )}
      {files.map((file) => (
        <div key={file.id}
          className={cn("flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer group", currentFileId === file.id && "bg-primary/10")}
          onClick={() => onSelectFile(file)}>
          <File className="w-3 h-3 shrink-0 text-muted-foreground" />
          <span className="text-xs flex-1 truncate">{file.file_path}</span>
          <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); deleteFile(file.id); }}>
            <Trash2 className="w-3 h-3 text-destructive" />
          </Button>
        </div>
      ))}
    </div>
  );
};

export default RoomFiles;

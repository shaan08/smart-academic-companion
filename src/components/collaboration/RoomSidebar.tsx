import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { File, Plus, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  roomId: string;
  userId: string;
  currentFileId?: string;
  onSelectFile: (file: any) => void;
  language: string;
}

const RoomSidebar = ({ roomId, userId, currentFileId, onSelectFile, language }: Props) => {
  const [files, setFiles] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  useEffect(() => {
    fetchFiles();
  }, [roomId]);

  const fetchFiles = async () => {
    const { data } = await supabase
      .from("room_files")
      .select("*")
      .eq("room_id", roomId)
      .order("file_path");
    setFiles(data || []);
  };

  const addFile = async () => {
    if (!newFileName.trim()) return;
    const { data } = await supabase
      .from("room_files")
      .insert({
        room_id: roomId,
        file_name: newFileName,
        file_path: `src/${newFileName}`,
        content: "",
        language,
        created_by: userId,
      })
      .select()
      .single();
    if (data) {
      setFiles((prev) => [...prev, data]);
      onSelectFile(data);
    }
    setAdding(false);
    setNewFileName("");
  };

  return (
    <div className="w-48 border-r border-border bg-card flex flex-col shrink-0">
      <div className="flex items-center justify-between p-2 border-b border-border">
        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
          <FolderOpen className="w-3 h-3" /> Files
        </span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAdding(true)}>
          <Plus className="w-3 h-3" />
        </Button>
      </div>
      {adding && (
        <div className="p-2 border-b border-border">
          <Input
            className="h-7 text-xs"
            placeholder="filename.js"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addFile(); if (e.key === "Escape") setAdding(false); }}
            autoFocus
          />
        </div>
      )}
      <div className="flex-1 overflow-auto py-1">
        {files.map((file) => (
          <button
            key={file.id}
            onClick={() => onSelectFile(file)}
            className={cn(
              "w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-muted transition-colors",
              currentFileId === file.id && "bg-primary/10 text-primary font-medium"
            )}
          >
            <File className="w-3 h-3 shrink-0" />
            <span className="truncate">{file.file_name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RoomSidebar;

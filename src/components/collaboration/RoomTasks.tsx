import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Check, Circle, Clock } from "lucide-react";

interface Props {
  roomId: string;
  userId: string;
}

const statusIcons: Record<string, React.ReactNode> = {
  todo: <Circle className="w-3 h-3 text-muted-foreground" />,
  "in-progress": <Clock className="w-3 h-3 text-primary" />,
  done: <Check className="w-3 h-3 text-secondary" />,
};

const priorityColors: Record<string, string> = {
  low: "secondary",
  medium: "outline",
  high: "destructive",
};

const RoomTasks = ({ roomId, userId }: Props) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("medium");

  useEffect(() => { fetchTasks(); }, [roomId]);

  const fetchTasks = async () => {
    const { data } = await supabase.from("room_tasks").select("*").eq("room_id", roomId).order("created_at", { ascending: false });
    setTasks(data || []);
  };

  const addTask = async () => {
    if (!newTitle.trim()) return;
    await supabase.from("room_tasks").insert({ room_id: roomId, title: newTitle, priority: newPriority, created_by: userId });
    setNewTitle("");
    setAdding(false);
    fetchTasks();
  };

  const updateStatus = async (taskId: string, status: string) => {
    await supabase.from("room_tasks").update({ status }).eq("id", taskId);
    fetchTasks();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground">Tasks</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAdding(true)}>
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      {adding && (
        <div className="space-y-2 p-2 border border-border rounded-lg">
          <Input className="h-7 text-xs" placeholder="Task title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} autoFocus />
          <div className="flex gap-2">
            <Select value={newPriority} onValueChange={setNewPriority}>
              <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" className="h-7 text-xs" onClick={addTask}>Add</Button>
          </div>
        </div>
      )}

      {["todo", "in-progress", "done"].map((status) => {
        const filtered = tasks.filter((t) => t.status === status);
        if (filtered.length === 0) return null;
        return (
          <div key={status}>
            <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">
              {status.replace("-", " ")} ({filtered.length})
            </p>
            {filtered.map((task) => (
              <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors mb-1">
                <button onClick={() => updateStatus(task.id, status === "todo" ? "in-progress" : status === "in-progress" ? "done" : "todo")}>
                  {statusIcons[status]}
                </button>
                <span className="text-xs flex-1 truncate">{task.title}</span>
                <Badge variant={priorityColors[task.priority] as any} className="text-[10px] h-4">{task.priority}</Badge>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default RoomTasks;


-- Coding rooms table
CREATE TABLE public.coding_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  project_title TEXT,
  tech_stack TEXT[] DEFAULT '{}',
  language TEXT NOT NULL DEFAULT 'javascript',
  created_by UUID NOT NULL,
  invite_code TEXT NOT NULL DEFAULT substr(md5(random()::text), 1, 8),
  is_active BOOLEAN DEFAULT true,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Room members
CREATE TABLE public.room_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.coding_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member',
  color TEXT DEFAULT '#' || substr(md5(random()::text), 1, 6),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Room files (code files in the room)
CREATE TABLE public.room_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.coding_rooms(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  content TEXT DEFAULT '',
  language TEXT DEFAULT 'javascript',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Code versions for history
CREATE TABLE public.code_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID NOT NULL REFERENCES public.room_files(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  saved_by UUID NOT NULL,
  version_number INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Room messages (chat inside rooms)
CREATE TABLE public.room_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.coding_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Room tasks (sprint board)
CREATE TABLE public.room_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.coding_rooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  assigned_to UUID,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.coding_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_tasks ENABLE ROW LEVEL SECURITY;

-- Helper function: check room membership
CREATE OR REPLACE FUNCTION public.is_room_member(_user_id UUID, _room_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.room_members
    WHERE user_id = _user_id AND room_id = _room_id
  )
$$;

-- Helper function: check room owner
CREATE OR REPLACE FUNCTION public.is_room_owner(_user_id UUID, _room_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coding_rooms
    WHERE id = _room_id AND created_by = _user_id
  )
$$;

-- RLS: coding_rooms
CREATE POLICY "Anyone can view active rooms" ON public.coding_rooms FOR SELECT USING (is_active = true);
CREATE POLICY "Auth users can create rooms" ON public.coding_rooms FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Room owners can update" ON public.coding_rooms FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Room owners can delete" ON public.coding_rooms FOR DELETE USING (auth.uid() = created_by);

-- RLS: room_members
CREATE POLICY "Members can view room members" ON public.room_members FOR SELECT USING (public.is_room_member(auth.uid(), room_id));
CREATE POLICY "Users can join rooms" ON public.room_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave rooms" ON public.room_members FOR DELETE USING (auth.uid() = user_id OR public.is_room_owner(auth.uid(), room_id));

-- RLS: room_files
CREATE POLICY "Members can view files" ON public.room_files FOR SELECT USING (public.is_room_member(auth.uid(), room_id));
CREATE POLICY "Members can create files" ON public.room_files FOR INSERT WITH CHECK (public.is_room_member(auth.uid(), room_id) AND auth.uid() = created_by);
CREATE POLICY "Members can update files" ON public.room_files FOR UPDATE USING (public.is_room_member(auth.uid(), room_id));
CREATE POLICY "File creators can delete" ON public.room_files FOR DELETE USING (auth.uid() = created_by OR public.is_room_owner(auth.uid(), room_id));

-- RLS: code_versions
CREATE POLICY "Members can view versions" ON public.code_versions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.room_files rf WHERE rf.id = file_id AND public.is_room_member(auth.uid(), rf.room_id))
);
CREATE POLICY "Members can create versions" ON public.code_versions FOR INSERT WITH CHECK (auth.uid() = saved_by);

-- RLS: room_messages
CREATE POLICY "Members can view messages" ON public.room_messages FOR SELECT USING (public.is_room_member(auth.uid(), room_id));
CREATE POLICY "Members can send messages" ON public.room_messages FOR INSERT WITH CHECK (public.is_room_member(auth.uid(), room_id) AND auth.uid() = user_id);

-- RLS: room_tasks
CREATE POLICY "Members can view tasks" ON public.room_tasks FOR SELECT USING (public.is_room_member(auth.uid(), room_id));
CREATE POLICY "Members can create tasks" ON public.room_tasks FOR INSERT WITH CHECK (public.is_room_member(auth.uid(), room_id) AND auth.uid() = created_by);
CREATE POLICY "Members can update tasks" ON public.room_tasks FOR UPDATE USING (public.is_room_member(auth.uid(), room_id));
CREATE POLICY "Task creators can delete" ON public.room_tasks FOR DELETE USING (auth.uid() = created_by OR public.is_room_owner(auth.uid(), room_id));

-- Trigger: auto-add room creator as admin member
CREATE OR REPLACE FUNCTION public.handle_new_coding_room()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.room_members (room_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_coding_room_created
AFTER INSERT ON public.coding_rooms
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_coding_room();

-- Enable realtime for messages and files
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_files;

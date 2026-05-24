-- Run this in Supabase SQL Editor AFTER projects_schema.sql

-- Add project key (e.g. "INNOV", "PROJ") to projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS key text;

-- Sprints
CREATE TABLE IF NOT EXISTS public.sprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  goal text,
  status text CHECK (status IN ('planning', 'active', 'completed')) DEFAULT 'planning' NOT NULL,
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sprints" ON public.sprints
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Epics
CREATE TABLE IF NOT EXISTS public.epics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#6366f1' NOT NULL,
  status text CHECK (status IN ('open', 'in-progress', 'done')) DEFAULT 'open' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.epics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own epics" ON public.epics
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Tickets (Story / Bug / Task with auto ticket_number per project)
CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  sprint_id uuid REFERENCES public.sprints(id) ON DELETE SET NULL,
  epic_id uuid REFERENCES public.epics(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ticket_number integer NOT NULL,
  title text NOT NULL,
  description text,
  type text CHECK (type IN ('story', 'bug', 'task')) DEFAULT 'task' NOT NULL,
  status text CHECK (status IN ('backlog', 'todo', 'in-progress', 'in-review', 'done')) DEFAULT 'backlog' NOT NULL,
  priority text CHECK (priority IN ('lowest', 'low', 'medium', 'high', 'highest')) DEFAULT 'medium' NOT NULL,
  story_points integer,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(project_id, ticket_number)
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tickets" ON public.tickets
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Auto-increment ticket_number per project
CREATE OR REPLACE FUNCTION assign_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(MAX(ticket_number), 0) + 1
  INTO NEW.ticket_number
  FROM public.tickets
  WHERE project_id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_ticket_number ON public.tickets;
CREATE TRIGGER set_ticket_number
  BEFORE INSERT ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION assign_ticket_number();

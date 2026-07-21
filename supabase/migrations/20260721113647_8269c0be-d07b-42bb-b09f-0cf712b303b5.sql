
-- Extend modules with description and credit_hours
ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS credit_hours integer;

-- Instructors table
CREATE TABLE IF NOT EXISTS public.instructors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  title text,
  module_id uuid REFERENCES public.modules(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT ON public.instructors TO authenticated;
GRANT ALL ON public.instructors TO service_role;
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view instructors" ON public.instructors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage instructors" ON public.instructors FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_instructors_updated_at BEFORE UPDATE ON public.instructors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Coursework table
CREATE TABLE IF NOT EXISTS public.coursework (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL,
  weight integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coursework TO authenticated;
GRANT ALL ON public.coursework TO service_role;
ALTER TABLE public.coursework ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view coursework" ON public.coursework FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage coursework" ON public.coursework FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_coursework_updated_at BEFORE UPDATE ON public.coursework FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Reactions table (helpful / not_helpful on feedback)
CREATE TABLE IF NOT EXISTS public.reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feedback_id uuid NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction text NOT NULL CHECK (reaction IN ('helpful','not_helpful')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (feedback_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reactions TO authenticated;
GRANT ALL ON public.reactions TO service_role;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view reactions" ON public.reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own reactions" ON public.reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reactions" ON public.reactions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own reactions" ON public.reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_reactions_updated_at BEFORE UPDATE ON public.reactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

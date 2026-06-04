
-- Fix 1: tighten profiles self-update policy to forbid credits change at RLS level
DROP POLICY IF EXISTS "Users can update their own profile non-credit" ON public.profiles;
CREATE POLICY "Users can update their own profile non-credit" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND credits = (SELECT p.credits FROM public.profiles p WHERE p.id = auth.uid())
  );

-- Fix 2: remove direct INSERT path on lock_operations; only perform_lock_operation (SECURITY DEFINER) may create rows
DROP POLICY IF EXISTS "Users insert their own operations" ON public.lock_operations;
REVOKE INSERT ON public.lock_operations FROM authenticated;

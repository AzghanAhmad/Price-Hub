-- Create a secure function to allow users to delete their own account from auth.users
create or replace function public.delete_user_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
begin
  -- Get the ID of the user calling the function
  current_user_id := auth.uid();
  
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Deleting from auth.users will automatically cascade delete the corresponding 
  -- row in public.profiles and any other tables with foreign keys on delete cascade.
  delete from auth.users where id = current_user_id;
end;
$$;

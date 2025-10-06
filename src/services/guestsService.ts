import { supabase } from '../lib/supabase';

export async function getGuests() {
  const { data, error } = await supabase.from('guests').select('*');
  if (error) throw error;
  return data;
}

export async function getMeetingRegisteredGuests() {
  const { data, error } = await supabase
    .from('guests')
    .select(`
      *,
      attendances (
        id,
        meeting_id,
        status,
        meetings (
          title,
          starts_at,
          location
        )
      )
    `)
    .neq('attendances.id', null);
    
  if (error) throw error;
  return data;
}

export async function addGuest(guest: { full_name: string; phone: string; email?: string; message?: string }) {
  const { data, error } = await supabase.from('guests').insert([guest]).select();
  if (error) throw error;
  return data?.[0];
}

export async function updateGuest(id: string, updates: Partial<{ full_name: string; phone: string; email?: string; message?: string }>) {
  const { data, error } = await supabase.from('guests').update(updates).eq('id', id).select();
  if (error) throw error;
  return data?.[0];
}

export async function deleteGuest(id: string) {
  const { error } = await supabase.from('guests').delete().eq('id', id);
  if (error) throw error;
  return true;
}
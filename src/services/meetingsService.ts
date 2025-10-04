import { supabase } from '../lib/supabase';

export async function getMeetings() {
  const { data, error } = await supabase.from('meetings').select('*');
  if (error) throw error;
  return data;
}

export async function addMeeting(meeting: { title: string; description?: string; location: string; starts_at: string; ends_at?: string; created_by?: string }) {
  const { data, error } = await supabase.from('meetings').insert([meeting]).select();
  if (error) throw error;
  return data?.[0];
}

export async function updateMeeting(id: string, updates: Partial<{ title: string; description?: string; location: string; starts_at: string; ends_at?: string }>) {
  const { data, error } = await supabase.from('meetings').update(updates).eq('id', id).select();
  if (error) throw error;
  return data?.[0];
}

export async function deleteMeeting(id: string) {
  const { error } = await supabase.from('meetings').delete().eq('id', id);
  if (error) throw error;
  return true;
}

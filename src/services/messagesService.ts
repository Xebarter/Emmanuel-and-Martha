import { supabase } from '../lib/supabase';

export async function getMessages() {
  const { data, error } = await supabase
    .from('guest_messages')
    .select('id, guest_id, message, is_approved, created_at, guests(full_name, phone)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function addMessage(message: { guest_id?: string; message: string; is_approved?: boolean }) {
  const { data, error } = await supabase.from('guest_messages').insert([message]).select();
  if (error) throw error;
  return data?.[0];
}

export async function updateMessage(id: string, updates: Partial<{ message: string; is_approved: boolean }>) {
  const { data, error } = await supabase.from('guest_messages').update(updates).eq('id', id).select();
  if (error) throw error;
  return data?.[0];
}

export async function deleteMessage(id: string) {
  const { error } = await supabase.from('guest_messages').delete().eq('id', id);
  if (error) throw error;
  return true;
}
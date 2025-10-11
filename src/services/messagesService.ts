import { supabase } from '../lib/supabase';

export interface GuestMessage {
  id: string;
  guest_id?: string | null;
  message: string;
  is_approved: boolean;
  created_at: string;
}

export interface NewGuestMessage {
  guest_id?: string | null;
  message: string;
  is_approved?: boolean;
}

export interface UpdateGuestMessage {
  guest_id?: string | null;
  message?: string;
  is_approved?: boolean;
}

export async function getMessages() {
  try {
    const { data, error } = await supabase
      .from('guest_messages')
      .select(`
        id, 
        guest_id, 
        message, 
        is_approved,
        created_at,
        guests (
          full_name,
          phone
        )
      `)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}

export async function getMessageById(id: string) {
  try {
    const { data, error } = await supabase
      .from('guest_messages')
      .select(`
        id, 
        guest_id, 
        message, 
        is_approved,
        created_at,
        guests (
          full_name,
          phone
        )
      `)
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching message ${id}:`, error);
    throw error;
  }
}

export async function addMessage(message: NewGuestMessage) {
  try {
    const { data, error } = await supabase
      .from('guest_messages')
      .insert([{
        guest_id: message.guest_id,
        message: message.message,
        is_approved: message.is_approved ?? false
      }])
      .select(`
        id, 
        guest_id, 
        message, 
        is_approved,
        created_at
      `);
      
    if (error) throw error;
    return data?.[0];
  } catch (error) {
    console.error('Error adding message:', error);
    throw error;
  }
}

export async function updateMessage(id: string, updates: UpdateGuestMessage) {
  try {
    const { data, error } = await supabase
      .from('guest_messages')
      .update(updates)
      .eq('id', id)
      .select(`
        id, 
        guest_id, 
        message, 
        is_approved,
        created_at
      `);
      
    if (error) throw error;
    return data?.[0];
  } catch (error) {
    console.error(`Error updating message ${id}:`, error);
    throw error;
  }
}

export async function deleteMessage(id: string) {
  try {
    const { error } = await supabase
      .from('guest_messages')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error deleting message ${id}:`, error);
    throw error;
  }
}

export async function bulkUpdateMessages(ids: string[], updates: UpdateGuestMessage) {
  try {
    const { data, error } = await supabase
      .from('guest_messages')
      .update(updates)
      .in('id', ids)
      .select();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error bulk updating messages:', error);
    throw error;
  }
}

export async function bulkDeleteMessages(ids: string[]) {
  try {
    const { error } = await supabase
      .from('guest_messages')
      .delete()
      .in('id', ids);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error bulk deleting messages:', error);
    throw error;
  }
}
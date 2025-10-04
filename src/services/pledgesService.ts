import { supabase } from '../lib/supabase';

export interface Pledge {
  id: string;
  guest_id: string | null;
  type: 'money' | 'item';
  item_description: string | null;
  amount: number | null;
  quantity: number | null;
  status: 'pending' | 'fulfilled' | 'cancelled';
  phone: string;
  email: string | null;
  notes: string | null;
  created_at: string;
  fulfilled_at: string | null;
  guest?: {
    full_name: string;
  } | null;
}

export async function getPledges() {
  const { data, error } = await supabase
    .from('pledges')
    .select(`
      *,
      guest:guests(full_name)
    `)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
}

export async function updatePledgeStatus(
  id: string, 
  status: 'pending' | 'fulfilled' | 'cancelled'
) {
  const { data, error } = await supabase
    .from('pledges')
    .update({ 
      status,
      fulfilled_at: status === 'fulfilled' ? new Date().toISOString() : null
    })
    .eq('id', id)
    .select();

  if (error) throw error;
  return data?.[0];
}

export async function deletePledge(id: string) {
  const { error } = await supabase
    .from('pledges')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
  return true;
}
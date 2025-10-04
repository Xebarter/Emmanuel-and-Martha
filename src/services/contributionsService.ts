import { supabase } from '../lib/supabase';

export async function getContributions() {
  const { data, error } = await supabase.from('contributions').select('*');
  if (error) throw error;
  return data;
}

export async function addContribution(contribution: { 
  guest_id?: string; 
  amount: number; 
  currency: string; 
  status: string; 
  metadata?: any;
  contributor_name?: string;
  contributor_email?: string;
  contributor_phone?: string;
  message?: string;
}) {
  const { data, error } = await supabase.from('contributions').insert([contribution]).select();
  if (error) throw error;
  return data?.[0];
}

export async function updateContribution(id: string, updates: Partial<{ 
  amount: number; 
  status: string; 
  metadata?: any;
  contributor_name?: string;
  contributor_email?: string;
  contributor_phone?: string;
  message?: string;
}>) {
  const { data, error } = await supabase.from('contributions').update(updates).eq('id', id).select();
  if (error) throw error;
  return data?.[0];
}

export async function deleteContribution(id: string) {
  const { error } = await supabase.from('contributions').delete().eq('id', id);
  if (error) throw error;
  return true;
}
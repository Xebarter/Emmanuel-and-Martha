import { supabase } from '../lib/supabase';

export async function getActivities() {
  const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function addActivity(activity: { type: string; user: string; message: string }) {
  const { data, error } = await supabase.from('audit_logs').insert([activity]).select();
  if (error) throw error;
  return data?.[0];
}

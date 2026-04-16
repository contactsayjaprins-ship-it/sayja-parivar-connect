import { supabase } from '@/integrations/supabase/client';
import { FamilyProfile, FamilyMember } from './store';

const BUCKET = 'family-photos';

export const uploadPhoto = async (file: File, prefix: string): Promise<string> => {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${prefix}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

export const uploadDataUrl = async (dataUrl: string, prefix: string): Promise<string> => {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const file = new File([blob], 'photo.jpg', { type: blob.type || 'image/jpeg' });
  return uploadPhoto(file, prefix);
};

const rowToProfile = (f: any, members: any[]): FamilyProfile => ({
  id: f.id,
  name: f.name || '',
  mobile: f.mobile,
  email: f.email || '',
  nativeVillage: f.native_village || '',
  currentVillage: f.current_village || '',
  occupation: f.occupation || '',
  education: f.education || '',
  totalMembers: f.total_members || 1,
  address: f.address || '',
  profilePhoto: f.profile_photo || '',
  createdAt: f.created_at,
  updatedAt: f.updated_at,
  members: (members || [])
    .sort((a, b) => (a.position || 0) - (b.position || 0))
    .map((m: any): FamilyMember => ({
      id: m.id,
      name: m.name || '',
      relation: m.relation || '',
      occupation: m.occupation || '',
      education: m.education || '',
      mobile: m.mobile || '',
      gender: (m.gender as 'પુરુષ' | 'સ્ત્રી') || 'પુરુષ',
      photo: m.photo || '',
    })),
});

export const loginByMobile = async (mobile: string): Promise<FamilyProfile> => {
  const { data: existing, error } = await supabase
    .from('families')
    .select('*, family_members(*)')
    .eq('mobile', mobile)
    .maybeSingle();
  if (error) throw error;
  if (existing) return rowToProfile(existing, (existing as any).family_members || []);

  const { data: created, error: insErr } = await supabase
    .from('families')
    .insert({ mobile, name: '', total_members: 1 })
    .select()
    .single();
  if (insErr) throw insErr;
  return rowToProfile(created, []);
};

export const saveProfile = async (profile: FamilyProfile): Promise<FamilyProfile> => {
  const { error: updErr } = await supabase
    .from('families')
    .update({
      name: profile.name,
      email: profile.email,
      native_village: profile.nativeVillage,
      current_village: profile.currentVillage,
      occupation: profile.occupation,
      education: profile.education,
      total_members: profile.totalMembers,
      address: profile.address,
      profile_photo: profile.profilePhoto || '',
    })
    .eq('id', profile.id);
  if (updErr) throw updErr;

  // Replace members
  await supabase.from('family_members').delete().eq('family_id', profile.id);
  if (profile.members.length) {
    const rows = profile.members.map((m, i) => ({
      family_id: profile.id,
      name: m.name,
      relation: m.relation,
      occupation: m.occupation,
      education: m.education,
      mobile: m.mobile,
      gender: m.gender,
      photo: m.photo || '',
      position: i,
    }));
    const { error: memErr } = await supabase.from('family_members').insert(rows);
    if (memErr) throw memErr;
  }

  const { data, error } = await supabase
    .from('families')
    .select('*, family_members(*)')
    .eq('id', profile.id)
    .single();
  if (error) throw error;
  return rowToProfile(data, (data as any).family_members || []);
};

export const fetchAllProfiles = async (): Promise<FamilyProfile[]> => {
  const { data, error } = await supabase
    .from('families')
    .select('*, family_members(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((f: any) => rowToProfile(f, f.family_members || []));
};

export const deleteProfileByMobile = async (mobile: string) => {
  const { error } = await supabase.from('families').delete().eq('mobile', mobile);
  if (error) throw error;
};

export const isAdminMobile = async (mobile: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('mobile')
    .eq('mobile', mobile)
    .eq('role', 'admin')
    .maybeSingle();
  if (error) return false;
  return !!data;
};

export const fetchAdmins = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('mobile')
    .eq('role', 'admin');
  if (error) throw error;
  return (data || []).map((r: any) => r.mobile);
};

export const promoteToAdmin = async (mobile: string) => {
  const cleaned = mobile.replace(/\D/g, '').slice(-10);
  if (cleaned.length !== 10) throw new Error('અમાન્ય મોબાઇલ નંબર');
  const { error } = await supabase
    .from('user_roles')
    .insert({ mobile: cleaned, role: 'admin' });
  if (error && !error.message.includes('duplicate')) throw error;
};

export const revokeAdmin = async (mobile: string) => {
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('mobile', mobile)
    .eq('role', 'admin');
  if (error) throw error;
};

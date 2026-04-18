import { supabase } from '@/integrations/supabase/client';
import { FamilyProfile, FamilyMember, DEFAULT_SURNAME } from './store';

const BUCKET = 'family-photos';

export const uploadPhoto = async (file: File, prefix: string): Promise<string> => {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${prefix}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

const rowToProfile = (f: any, members: any[]): FamilyProfile => ({
  id: f.id,
  name: f.name || '',
  surname: f.surname || DEFAULT_SURNAME,
  mobile: f.mobile,
  email: f.email || '',
  nativeVillage: f.native_village || '',
  currentVillage: f.current_village || '',
  occupation: f.occupation || '',
  govJob: (f.gov_job as 'Yes' | 'No') || 'No',
  govJobPlace: f.gov_job_place || '',
  education: f.education || '',
  totalMembers: f.total_members || 1,
  address: f.address || '',
  profilePhoto: f.profile_photo || '',
  formPhoto: f.form_photo || '',
  housePhoto: f.house_photo || '',
  lat: f.lat ?? null,
  lng: f.lng ?? null,
  createdAt: f.created_at,
  updatedAt: f.updated_at,
  members: (members || [])
    .sort((a, b) => (a.position || 0) - (b.position || 0))
    .map((m: any): FamilyMember => ({
      id: m.id,
      name: m.name || '',
      relation: m.relation || '',
      occupation: m.occupation || '',
      govJob: (m.gov_job as 'Yes' | 'No') || 'No',
      govJobPlace: m.gov_job_place || '',
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
      surname: profile.surname || DEFAULT_SURNAME,
      email: profile.email,
      native_village: profile.nativeVillage,
      current_village: profile.currentVillage,
      occupation: profile.occupation,
      gov_job: profile.govJob || 'No',
      gov_job_place: profile.govJobPlace || '',
      education: profile.education,
      total_members: profile.totalMembers,
      address: profile.address,
      profile_photo: profile.profilePhoto || '',
      form_photo: profile.formPhoto || '',
      house_photo: profile.housePhoto || '',
      lat: profile.lat ?? null,
      lng: profile.lng ?? null,
    } as any)
    .eq('id', profile.id);
  if (updErr) throw updErr;

  await supabase.from('family_members').delete().eq('family_id', profile.id);
  if (profile.members.length) {
    const rows = profile.members.map((m, i) => ({
      family_id: profile.id,
      name: m.name,
      relation: m.relation,
      occupation: m.occupation,
      gov_job: m.govJob || 'No',
      gov_job_place: m.govJobPlace || '',
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

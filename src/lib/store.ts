import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  occupation: string;
  education: string;
  mobile: string;
  gender: 'પુરુષ' | 'સ્ત્રી';
  photo?: string;
}

export interface FamilyProfile {
  id: string;
  name: string;
  mobile: string;
  email: string;
  nativeVillage: string;
  currentVillage: string;
  occupation: string;
  education: string;
  totalMembers: number;
  address: string;
  members: FamilyMember[];
  createdAt: string;
  updatedAt: string;
}

interface AppState {
  currentUser: FamilyProfile | null;
  isAdmin: boolean;
  allProfiles: FamilyProfile[];
  setCurrentUser: (user: FamilyProfile | null) => void;
  setIsAdmin: (val: boolean) => void;
  login: (mobile: string) => FamilyProfile;
  updateProfile: (profile: FamilyProfile) => void;
  deleteProfile: (mobile: string) => void;
  logout: () => void;
}

const ADMIN_MOBILE = '8140805960';

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAdmin: false,
      allProfiles: [],
      setCurrentUser: (user) => set({ currentUser: user }),
      setIsAdmin: (val) => set({ isAdmin: val }),
      login: (mobile: string) => {
        const cleaned = mobile.replace(/\D/g, '').slice(-10);
        const isAdmin = cleaned === ADMIN_MOBILE;
        const existing = get().allProfiles.find(p => p.mobile === cleaned);
        if (existing) {
          set({ currentUser: existing, isAdmin });
          return existing;
        }
        const newProfile: FamilyProfile = {
          id: crypto.randomUUID(),
          name: '',
          mobile: cleaned,
          email: '',
          nativeVillage: '',
          currentVillage: '',
          occupation: '',
          education: '',
          totalMembers: 1,
          address: '',
          members: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set(state => ({
          currentUser: newProfile,
          isAdmin,
          allProfiles: [...state.allProfiles, newProfile],
        }));
        return newProfile;
      },
      updateProfile: (profile) => {
        set(state => ({
          currentUser: profile,
          allProfiles: state.allProfiles.map(p =>
            p.mobile === profile.mobile ? { ...profile, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },
      deleteProfile: (mobile) => {
        set(state => ({
          allProfiles: state.allProfiles.filter(p => p.mobile !== mobile),
        }));
      },
      logout: () => set({ currentUser: null, isAdmin: false }),
    }),
    { name: 'sayja-parivar-store' }
  )
);

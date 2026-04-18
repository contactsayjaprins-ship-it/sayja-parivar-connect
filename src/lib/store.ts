import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  occupation: string;
  govJob: 'Yes' | 'No';
  govJobPlace: string;
  education: string;
  mobile: string;
  gender: 'પુરુષ' | 'સ્ત્રી';
  photo?: string;
}

export interface FamilyProfile {
  id: string;
  name: string;
  surname: string;
  mobile: string;
  email: string;
  nativeVillage: string;
  currentVillage: string;
  occupation: string;
  govJob: 'Yes' | 'No';
  govJobPlace: string;
  education: string;
  totalMembers: number;
  address: string;
  profilePhoto?: string;
  formPhoto?: string;
  housePhoto?: string;
  lat?: number | null;
  lng?: number | null;
  members: FamilyMember[];
  createdAt: string;
  updatedAt: string;
}

interface AppState {
  currentUser: FamilyProfile | null;
  isAdmin: boolean;
  setCurrentUser: (user: FamilyProfile | null) => void;
  setIsAdmin: (val: boolean) => void;
  logout: () => void;
}

export const ADMIN_MOBILE = '8140805960';
export const DEFAULT_SURNAME = 'સાયજા';

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentUser: null,
      isAdmin: false,
      setCurrentUser: (user) => set({ currentUser: user }),
      setIsAdmin: (val) => set({ isAdmin: val }),
      logout: () => set({ currentUser: null, isAdmin: false }),
    }),
    { name: 'sayja-parivar-session' }
  )
);

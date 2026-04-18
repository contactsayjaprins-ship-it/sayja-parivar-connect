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
  bloodGroup?: string;
}

export interface FamilyProfile {
  id: string;
  familyCode?: string;
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
  bloodGroup?: string;
  categoryTag?: string;
  gallery?: string[];
  members: FamilyMember[];
  createdAt: string;
  updatedAt: string;
}

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  eventType: 'marriage' | 'death' | 'function' | 'other';
  eventDate: string;
  village: string;
  familyId?: string | null;
  photo?: string;
  createdAt: string;
}

interface AppState {
  currentUser: FamilyProfile | null;
  isAdmin: boolean;
  favorites: string[]; // family ids
  setCurrentUser: (user: FamilyProfile | null) => void;
  setIsAdmin: (val: boolean) => void;
  toggleFavorite: (id: string) => void;
  logout: () => void;
}

export const ADMIN_MOBILE = '8140805960';
export const DEFAULT_SURNAME = 'સાયજા';

export const CATEGORY_TAGS = ['Govt Job', 'Business', 'Farmer', 'Student', 'Service', 'Other'] as const;
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAdmin: false,
      favorites: [],
      setCurrentUser: (user) => set({ currentUser: user }),
      setIsAdmin: (val) => set({ isAdmin: val }),
      toggleFavorite: (id) => {
        const cur = get().favorites;
        set({ favorites: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] });
      },
      logout: () => set({ currentUser: null, isAdmin: false }),
    }),
    { name: 'sayja-parivar-session' }
  )
);

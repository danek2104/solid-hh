import { create } from 'zustand';
import api from '../services/api'; // Import API

// Backend Job Interface match
export interface Job {
  id: number;
  title: string;
  description: string;
  salary_min: number;
  salary_max: number;
  currency: string;
  location: string;
  is_active: boolean;
  created_at: string;
  employer_id: number;
}

export interface LanguageSkill {
  name: string;
  level: 'beginner' | 'intermediate' | 'fluent';
}

export interface UserProfile {
  id?: number;
  firstName: string; 
  lastName: string;
  patronymic?: string;
  email?: string;
  phone?: string;
  passportSeries?: string;
  passportNumber?: string;
  citizenship?: string;
  languages: LanguageSkill[];
  first_name?: string;
  last_name?: string;
}

interface UserState {
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  user: UserProfile | null;
  skills: string[];
  appliedJobs: number[]; // Job IDs

  // Actions
  login: (user: any) => void; 
  logout: () => void;
  completeOnboarding: () => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  
  // Made async for API sync
  addSkill: (skill: string) => Promise<void>;
  removeSkill: (skill: string) => Promise<void>;
  applyToJob: (jobId: number) => void;
  
  reset: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  isAuthenticated: false,
  hasCompletedOnboarding: false,
  user: null,
  skills: [],
  appliedJobs: [],

  login: (backendUser) => {
      // Map backend response (snake_case) to frontend profile (camelCase)
      const userProfile: UserProfile = {
          id: backendUser.id,
          firstName: backendUser.first_name || '',
          lastName: backendUser.last_name || '',
          patronymic: backendUser.patronymic || '',
          email: backendUser.email,
          phone: backendUser.phone,
          citizenship: backendUser.citizenship || '',
          passportSeries: backendUser.passport_series || '',
          passportNumber: backendUser.passport_number || '',
          languages: backendUser.languages || [], 
          ...backendUser 
      };

      const isProfileFilled = !!(userProfile.firstName && userProfile.lastName && userProfile.firstName !== 'Test');

      set({ 
          isAuthenticated: true, 
          user: userProfile,
          hasCompletedOnboarding: isProfileFilled,
          skills: backendUser.skills || [] 
      });
  },

  logout: () => set({ isAuthenticated: false, user: null, skills: [] }),
  
  completeOnboarding: () => set({ hasCompletedOnboarding: true }),
  
  updateProfile: (data) => set((state) => ({ 
    user: state.user ? { ...state.user, ...data } : { ...data } as UserProfile 
  })),

  addSkill: async (skill) => {
      // Optimistic update
      const oldSkills = get().skills;
      if (oldSkills.includes(skill)) return;
      
      const newSkills = [...oldSkills, skill];
      set({ skills: newSkills });

      // Sync with backend
      const { user } = get();
      if (user?.id) {
          try {
              await api.put(`/users/${user.id}`, { skills: newSkills });
          } catch (error) {
              console.error("Failed to add skill", error);
              set({ skills: oldSkills }); // Revert on failure
              alert("Failed to save skill");
          }
      }
  },
  
  removeSkill: async (skill) => {
      // Optimistic update
      const oldSkills = get().skills;
      const newSkills = oldSkills.filter((s) => s !== skill);
      set({ skills: newSkills });

      // Sync with backend
      const { user } = get();
      if (user?.id) {
          try {
              await api.put(`/users/${user.id}`, { skills: newSkills });
          } catch (error) {
              console.error("Failed to remove skill", error);
              set({ skills: oldSkills }); // Revert on failure
               alert("Failed to remove skill");
          }
      }
  },

  applyToJob: (jobId) => set((state) => {
    if (state.appliedJobs.includes(jobId)) return state;
    return { appliedJobs: [...state.appliedJobs, jobId] };
  }),

  reset: () => set({ 
      isAuthenticated: false, 
      hasCompletedOnboarding: false, 
      user: null,
      skills: [],
      appliedJobs: [],
  }),
}));
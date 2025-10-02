export type UserType = 'athlete' | 'elderly' | 'general' | 'doctor';

export type Profile = {
  firstName: string;
  lastName: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  userType: UserType;
  onboarded: boolean;
};

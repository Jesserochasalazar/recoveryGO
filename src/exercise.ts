export type UserType = 'athlete' | 'elderly' | 'general' | 'doctor';


export type Exercise = {
  id: string;
  name: string;
  sets?: number;
  reps?: number;
  duration?: string; 
  rest: string;     
  isEditing?: boolean;
  category?: string; 
  bodyPart?: string; 
};


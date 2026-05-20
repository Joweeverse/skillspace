export type UserRole = 'student' | 'mentor' | 'admin';
export type EnrollmentStatus = 'enrolled' | 'completed' | 'dropped';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  is_verified: boolean;
  avatar_url?: string;
  bio?: string;
  points?: number;
  updated_at?: string;
}

export interface Portfolio {
  id: string;
  mentor_id: string;
  title: string;
  description?: string;
  url?: string;
  image_url?: string;
  created_at?: string;
}

export interface Course {
  id: string;
  title: string;
  mentor_id: string;
  category: string;
  created_at?: string;
  profiles?: {
    full_name: string;
  };
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content: string;
  youtube_url: string;
  pdf_url?: string;
  created_at?: string;
}

export interface Enrollment {
  student_id: string;
  course_id: string;
  status: EnrollmentStatus;
  completed_lessons: string[];
  enrolled_at?: string;
  courses?: Course;
}

export interface Quiz {
  id: string;
  lesson_id: string;
  title: string;
  created_at?: string;
}

export interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  options_json: string[];
  correct_answer: string;
  created_at?: string;
}

export interface Discussion {
  id: string;
  lesson_id: string;
  user_id: string;
  message: string;
  created_at: string;
  is_private?: boolean;
  recipient_id?: string;
  profiles?: {
    full_name: string;
    role: UserRole;
    is_verified: boolean;
    avatar_url?: string;
  };
}

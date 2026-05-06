export type UserRole = 'owner' | 'staff' | 'intern';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  title: string;
  initials: string;
  color: string;
}

export type TaskCategory = 'Admin' | 'Sermon' | 'Care' | 'Staff' | 'Sunday Service' | 'Personal';
export type TaskPriority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'Todo' | 'In Progress' | 'Waiting' | 'Completed';
export type Visibility = 'Private' | 'Organization';

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  dueDate?: string;
  notes?: string;
  status: TaskStatus;
  visibility: Visibility;
  createdBy: string;
  assignedTo?: string;
  claimedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type CareCategory =
  | 'New Visitor'
  | 'Hospital Visit'
  | 'Grieving'
  | 'Counseling'
  | 'Inactive Member'
  | 'Volunteer Leader'
  | 'General Follow-Up';

export type CareStatus = 'Needs Attention' | 'In Progress' | 'Stable' | 'Archived';

export interface Person {
  id: string;
  name: string;
  careCategory: CareCategory;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  notes?: string;
  status: CareStatus;
  visibility: Visibility;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type SermonStatus = 'Idea' | 'Researching' | 'Outlining' | 'Drafting' | 'Ready' | 'Preached';

export interface Sermon {
  id: string;
  title: string;
  scriptureText?: string;
  seriesName?: string;
  preachingDate?: string;
  status: SermonStatus;
  bigIdea?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type PrayerCategory =
  | 'Health'
  | 'Family'
  | 'Spiritual Growth'
  | 'Grief'
  | 'Work/Financial'
  | 'Church/Ministry'
  | 'Other';

export type PrayerStatus = 'Active' | 'Answered' | 'Archived';

export interface PrayerRequest {
  id: string;
  personName: string;
  request: string;
  category: PrayerCategory;
  dateAdded: string;
  followUpDate?: string;
  status: PrayerStatus;
  privateNotes?: string;
  visibility: Visibility;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface RhythmItem {
  id: string;
  title: string;
  description?: string;
  dayOfWeek?: string;
  isRecurring: boolean;
  completedDates: string[];
}

export interface WeeklyRhythm {
  weekOf: string;
  completedItems: string[];
}

export interface OrgSettings {
  organizationName: string;
  theme: 'light' | 'dark';
}

export interface AppState {
  tasks: Task[];
  people: Person[];
  sermons: Sermon[];
  prayerRequests: PrayerRequest[];
  rhythmItems: RhythmItem[];
  weeklyRhythm: WeeklyRhythm;
  currentUserId: string;
  orgViewEnabled: boolean;
  settings: OrgSettings;
}

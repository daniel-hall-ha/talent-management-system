export type Me = {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
};

export type Category = 'Livestream' | 'Highlight' | 'Short Video' | 'Others';
export const categoryOptions: Category[] = ['Livestream', 'Highlight', 'Short Video', 'Others'];

export type Talent = { id: string; name: string };
export type CdKeys = { giveaway: string[]; talents: Record<string, string[]> };

export type Event = {
  id: string;
  title: string;
  description: string;
  color: string;
  startDate: string;
  endDate: string;
  keyPoints: string[];
  categories: Category[];
  talentDeliverables: Record<string, Category[]>;
  talentSubmissionDates: Record<string, string>;
  talents: Talent[];
  details: string;
};

export type Role = {
  id: string;
  name: string;
  description?: string | null;
  permissions: string[];
  system: boolean;
  createAccount: boolean;
  _count: { users: number };
};

export type User = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  active: boolean;
  roleId: string;
  role: { name: string };
};

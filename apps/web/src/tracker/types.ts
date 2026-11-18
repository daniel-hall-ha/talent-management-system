export type TrackerRow = {
  id: string;
  eventId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  talentId: string;
  talent: string;
  deliverable: string;
  submissionDate: string;
  publishingDate: string;
  status: 'Pending' | 'Done';
  links: string[];
};

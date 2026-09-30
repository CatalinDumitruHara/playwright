export interface Incident {
  id: string;
  reference: string;
  room: string;
  category: string;
  description: string;
  status: string;
  priority: string;
  createdAt: Date;
}

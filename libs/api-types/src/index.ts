export interface SessionContext {
  user: {
    name: string;
    email: string;
  };
  permissions: string[];
}

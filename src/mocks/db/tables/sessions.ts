export interface SessionRow {
  // The opaque token issued by sign-in.
  id: string
  userId: string
  createdAt: string
}

// Starts empty; sign-in fills it and a reset keeps it (02 §5.5).
export const sessionsSeed: SessionRow[] = []

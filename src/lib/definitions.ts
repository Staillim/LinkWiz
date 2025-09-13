export type Link = {
  id: string;
  originalUrl: string;
  shortCode: string;
  clicks: number;
  createdAt: string;
  userId: string;
};

export type Click = {
  id: string;
  linkId: string;
  timestamp: any;
  ipAddress?: string;
  userAgent?: string;
  country?: string;
  city?: string;
};

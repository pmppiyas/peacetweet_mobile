export interface BloodRequestItem {
  id: string;
  requesterId: string;
  forMyself: boolean;
  patientName: string;
  patientAge?: number | null;
  problem?: string | null;
  bloodGroup: string;
  units: number;
  unitsFulfilled: number;
  hospitalName: string;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  location: string;
  contactNumber: string;
  alternateContact?: string | null;
  neededDate: string;
  status: 'POSTING' | 'PENDING' | 'PARTIALLY_ACCEPTED' | 'FULLY_ACCEPTED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  requester?: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string | null;
  };
  donations?: {
    id: string;
    donorId: string;
    status: string;
    donor?: {
      id: string;
      name: string;
      username: string;
      avatarUrl?: string | null;
      bloodGroup?: string | null;
      donationCount?: number;
    };
  }[];
}

export interface BloodDonorItem {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  bloodGroup?: string | null;
  location?: string | null;
  country?: string | null;
  city?: string | null;
  state?: string | null;
  bio?: string | null;
  isDonor: boolean;
  donationCount: number;
  badge?: string | null;
}

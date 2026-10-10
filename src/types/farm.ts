import { Pond } from './pond';

export interface Farm {
  id: string;
  ownerId: string;
  name: string;
  address?: string | null;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  ponds?: Pond[];
}

export interface CreateFarmRequest {
  name: string;
  address?: string;
  status?: 'active' | 'inactive';
}

export interface UpdateFarmRequest {
  name?: string;
  address?: string;
  status?: 'active' | 'inactive';
}

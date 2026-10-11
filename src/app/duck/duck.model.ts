export const COLORS = ['Red', 'Green', 'Yellow', 'Black'] as const;
export const SIZES = ['XLarge', 'Large', 'Medium', 'Small', 'XSmall'] as const;

export interface Duck {
  id: number;
  color: string;
  size: string;
  price: number;
  quantity: number;
}

export interface DuckInput {
  color: string;
  size: string;
  price: number;
  quantity: number;
}

export type SortDirection = 'asc' | 'desc';
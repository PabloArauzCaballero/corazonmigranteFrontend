export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type SelectOption = {
  label: string;
  value: string;
};

export type ApiValidationError = {
  field: string;
  message: string;
};

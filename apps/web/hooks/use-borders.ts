"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createBorder,
  deleteBorder,
  listBorders,
  updateBorder,
} from "@/services/borders-service";
import type { BorderInput, ListBordersParams } from "@/types/border";

const BORDERS_KEY = "borders";

export function useCreateBorder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BorderInput) => createBorder(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [BORDERS_KEY] });
    },
  });
}

export function useUpdateBorder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: BorderInput }) =>
      updateBorder(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [BORDERS_KEY] });
    },
  });
}

export function useBorders(params: ListBordersParams) {
  return useQuery({
    queryKey: [BORDERS_KEY, params],
    queryFn: () => listBorders(params),
    placeholderData: keepPreviousData,
  });
}

export function useDeleteBorder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteBorder(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [BORDERS_KEY] });
    },
  });
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/queryKeys";
import { addPosition } from "@/services/tradeService";

export function useCreatePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addPosition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.positions.all });
    },
  });
}

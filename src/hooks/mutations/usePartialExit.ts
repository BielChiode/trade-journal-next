import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/queryKeys";
import { executePartialExit } from "@/services/tradeService";

export function usePartialExit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      positionId,
      data,
    }: {
      positionId: number;
      data: { quantity: number; price: number; date: string };
    }) => executePartialExit(positionId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.positions.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.operations.byPosition(variables.positionId),
      });
    },
  });
}

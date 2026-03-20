import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/queryKeys";
import { deleteOperation } from "@/services/tradeService";

export function useDeleteOperation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      positionId,
      operationId,
    }: {
      positionId: string;
      operationId: string;
    }) => deleteOperation(positionId, operationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.positions.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.operations.byPosition(
          parseInt(variables.positionId)
        ),
      });
    },
  });
}

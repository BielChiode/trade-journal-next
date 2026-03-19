import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/queryKeys";
import { updatePosition } from "@/services/tradeService";

export function useUpdatePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      positionId,
      data,
    }: {
      positionId: number;
      data: Parameters<typeof updatePosition>[1];
    }) => updatePosition(positionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.positions.all });
    },
  });
}

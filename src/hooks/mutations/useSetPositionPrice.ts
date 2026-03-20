import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/queryKeys";
import { setPositionLastPrice } from "@/services/tradeService";

export function useSetPositionPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      positionId,
      price,
    }: {
      positionId: number;
      price: number;
    }) => setPositionLastPrice(positionId, price),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.positions.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.positionPrice.byPosition(variables.positionId),
      });
    },
  });
}

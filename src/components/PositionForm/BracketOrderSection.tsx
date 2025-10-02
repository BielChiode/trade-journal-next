import React from "react";
import { Input } from "../ui/Input";

interface BracketOrderSectionProps {
  isBracketOrder: boolean;
  onBracketOrderChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  stopGain: number | undefined;
  stopLoss: number | undefined;
  onFieldChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isEditRestricted?: boolean;
  allowStopsEdit?: boolean;
}

const BracketOrderSection: React.FC<BracketOrderSectionProps> = ({
  isBracketOrder,
  onBracketOrderChange,
  stopGain,
  stopLoss,
  onFieldChange,
  isEditRestricted = false,
  allowStopsEdit = false,
}) => {
  const stopsDisabled = isEditRestricted && !allowStopsEdit;
  return (
    <>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="bracketOrder"
          checked={isBracketOrder}
          onChange={onBracketOrderChange}
          disabled={stopsDisabled}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0"
        />
        <label htmlFor="bracketOrder" className="text-sm font-medium text-muted-foreground">
          Stop Gain/Loss
        </label>
      </div>

      {isBracketOrder && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Stop Gain *
            </label>
            <Input
              type="number"
              step="0.01"
              name="stop_gain"
              value={stopGain || ""}
              onChange={onFieldChange}
              placeholder="0.00"
              className="text-base sm:text-sm"
              required={isBracketOrder}
              disabled={stopsDisabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Stop Loss *
            </label>
            <Input
              type="number"
              step="0.01"
              name="stop_loss"
              value={stopLoss || ""}
              onChange={onFieldChange}
              placeholder="0.00"
              className="text-base sm:text-sm"
              required={isBracketOrder}
              disabled={stopsDisabled}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default BracketOrderSection; 
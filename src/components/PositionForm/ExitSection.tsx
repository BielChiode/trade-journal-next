import React from "react";
import { Input } from "../ui/Input";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface ExitSectionProps {
  isClosedPosition: boolean;
  onClosedPositionChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  exitPrice: number | undefined;
  exitDate: string | undefined;
  onFieldChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDateChange: (value: Value, isExitDate: boolean) => void;
  showExitCalendar: boolean;
  onShowExitCalendar: (show: boolean) => void;
  exitCalendarRef: React.RefObject<HTMLDivElement | null>;
  isEditRestricted?: boolean;
}

const ExitSection: React.FC<ExitSectionProps> = ({
  isClosedPosition,
  onClosedPositionChange,
  exitPrice,
  exitDate,
  onFieldChange,
  onDateChange,
  showExitCalendar,
  onShowExitCalendar,
  exitCalendarRef,
  isEditRestricted = false,
}) => {
  return (
    <>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="closedPosition"
          checked={isClosedPosition}
          onChange={onClosedPositionChange}
          disabled={isEditRestricted}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0"
        />
        <label htmlFor="closedPosition" className="text-sm font-medium text-muted-foreground">
          Registrar Saída
        </label>
      </div>

      {isClosedPosition && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Preço de Saída *
            </label>
            <Input
              type="number"
              step="0.01"
              name="exit_price"
              value={exitPrice || ""}
              onChange={onFieldChange}
              placeholder="0.00"
              className="text-base sm:text-sm"
              required={isClosedPosition}
              disabled={isEditRestricted}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Data de Saída *
            </label>
            <div className="relative">
              <Input
                type="text"
                name="exit_date"
                value={exitDate || ""}
                onFocus={() => !isEditRestricted && onShowExitCalendar(true)}
                readOnly
                className="cursor-pointer text-base sm:text-sm"
                required={isClosedPosition}
                disabled={isEditRestricted}
                placeholder="Selecione a data"
              />
              {showExitCalendar && (
                <div ref={exitCalendarRef} className="absolute z-10 mt-1">
                  <Calendar
                    onChange={(value) => onDateChange(value, true)}
                    value={exitDate ? new Date(exitDate) : null}
                    locale="pt-BR"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExitSection; 
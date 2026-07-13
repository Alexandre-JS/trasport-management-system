"use client";

import { MapPin } from "lucide-react";
import { useState } from "react";
import { cn } from "@/src/shared/utils/cn";
import { isKnownPlace, searchPlaces } from "@/src/shared/data/places";

type PlaceComboboxProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function PlaceCombobox({
  id,
  value,
  onChange,
  placeholder,
}: PlaceComboboxProps) {
  const [open, setOpen] = useState(false);
  const suggestions = searchPlaces(value);
  const invalid = value.trim().length > 0 && !isKnownPlace(value);
  const listboxId = id ? `${id}-suggestions` : undefined;

  return (
    <div className="relative">
      <input
        id={id}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        className={cn(
          "h-9 w-full rounded-md border bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 dark:bg-slate-900 dark:text-slate-100",
          invalid
            ? "border-amber-400 dark:border-amber-500"
            : "border-slate-200 dark:border-slate-700",
        )}
      />

      {open && suggestions.length > 0 ? (
        <ul
          id={listboxId}
          className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          {suggestions.map((place) => (
            <li key={place.name}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(place.name);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <MapPin className="size-3.5 shrink-0 text-slate-400" aria-hidden />
                <span className="flex-1">{place.name}</span>
                <span className="text-xs text-slate-400">{place.country}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {invalid ? (
        <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">
          Selecione um local da lista (necessário para o rastreio).
        </p>
      ) : null}
    </div>
  );
}

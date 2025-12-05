import React from 'react';

export default function QuickChips({ chips, onSelect }) {
  if (!chips || chips.length === 0) return null;

  return (
    <div className="overflow-x-auto pb-2 scrollbar-hide">
      <div className="flex gap-2 px-4">
        {chips.map((chip, index) => (
          <button
            key={index}
            onClick={() => onSelect(chip)}
            className="flex-shrink-0 px-4 py-2 bg-primary-50 hover:bg-primary-100 active:bg-primary-200 active:scale-95 text-primary-700 text-sm md:text-base rounded-full border border-primary-200 transition-all duration-100 min-h-[44px] whitespace-nowrap font-medium"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}

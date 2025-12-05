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
            className="flex-shrink-0 px-4 py-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 active:scale-95 text-gray-700 text-sm md:text-base rounded-full border border-gray-300 transition-all duration-100 min-h-[44px] whitespace-nowrap font-medium"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}

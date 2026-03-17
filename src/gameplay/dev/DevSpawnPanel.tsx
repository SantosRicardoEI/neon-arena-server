import { DEV_SPAWN_CATEGORIES, getDevSpawnOptionsByCategory } from '@/gameplay/dev/spawn-catalog';
import type { DevSpawnCategory, DevSpawnOptionId } from '@/gameplay/dev/types';
import * as C from '@/game/constants';

interface DevSpawnPanelProps {
  selectedCategory: DevSpawnCategory;
  selectedOptionId: DevSpawnOptionId | null;
  onSelectCategory: (category: DevSpawnCategory) => void;
  onSelectOption: (category: DevSpawnCategory, optionId: DevSpawnOptionId) => void;
  onClear: () => void;
}

const DevSpawnPanel = ({
  selectedCategory,
  selectedOptionId,
  onSelectCategory,
  onSelectOption,
  onClear,
}: DevSpawnPanelProps) => {
  const options = getDevSpawnOptionsByCategory(selectedCategory);

  return (
      <div
        className="absolute z-20 bg-black/75 border border-white/15 p-3 text-white text-xs space-y-3"
        style={{
          top: C.UI_DEV_PANEL_TOP,
          left: C.UI_DEV_PANEL_LEFT,
          width: C.UI_DEV_PANEL_WIDTH,
        }}
      >      
      <div className="font-bold tracking-wider uppercase">Dev Spawn Panel</div>

      <div className="space-y-2">
        <div className="text-white/70 uppercase text-[10px]">Categories</div>
        <div className="grid grid-cols-2 gap-2">
          {DEV_SPAWN_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`px-2 py-1 border text-left ${
                selectedCategory === category.id
                  ? 'border-cyan-400 bg-cyan-400/10'
                  : 'border-white/15 bg-white/5'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-white/70 uppercase text-[10px]">Options</div>
        <div className="max-h-56 overflow-auto space-y-1">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => onSelectOption(option.category, option.id)}
              className={`block w-full px-2 py-1 border text-left ${
                selectedOptionId === option.id
                  ? 'border-green-400 bg-green-400/10'
                  : 'border-white/15 bg-white/5'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="text-[11px] text-white/70">
        Selected: {selectedOptionId ?? 'none'}
      </div>

      <div className="text-[11px] text-white/70">
        Click on the map to spawn the selected entity.
      </div>

      <button
        onClick={onClear}
        className="w-full px-2 py-2 border border-red-400 bg-red-400/10 text-red-200"
      >
        Clear All
      </button>
    </div>
  );
};

export default DevSpawnPanel;
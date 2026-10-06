import { CATEGORIES, CategoryValue } from '../config';

interface CategoryChipProps {
  category: string;
}

export function CategoryChip({ category }: CategoryChipProps) {
  const cat = CATEGORIES.find(c => c.value === category as CategoryValue);
  const label = cat ? cat.label : category;
  
  return (
    <span className="inline-flex items-center rounded-full bg-brand-100 dark:bg-brand-900/30 px-2.5 py-0.5 text-xs font-semibold text-brand-800 dark:text-brand-300">
      {label}
    </span>
  );
}

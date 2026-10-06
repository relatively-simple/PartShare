export const APP_NAME = 'PartShare';
export const POST_EXPIRY_DAYS = 60;
export const POSTS_PER_PAGE = 20;
export const MAX_REVEALS_PER_DAY = 60;
export const MAX_OPEN_POSTS = 30;

export const CATEGORIES = [
  { value: 'motors_actuators', label: 'Motors & Actuators' },
  { value: 'boards_controllers', label: 'Boards & Controllers' },
  { value: 'sensors', label: 'Sensors' },
  { value: 'drivers_modules', label: 'Drivers & Modules' },
  { value: 'power_batteries', label: 'Power & Batteries' },
  { value: 'mechanical', label: 'Mechanical' },
  { value: 'wheels_gears_chassis', label: 'Wheels, Gears & Chassis' },
  { value: 'cables_connectors', label: 'Cables & Connectors' },
  { value: 'tools_equipment', label: 'Tools & Equipment' },
  { value: 'other', label: 'Other' },
] as const;

export const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'used_working', label: 'Used (Working)' },
  { value: 'untested', label: 'Untested' },
  { value: 'for_parts', label: 'For Parts' },
] as const;

export const SHARE_MODES = [
  { value: 'give', label: 'Give away' },
  { value: 'lend', label: 'Lend' },
  { value: 'swap', label: 'Swap' },
] as const;

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'deadline', label: 'Soonest deadline' },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]['value'];
export type ConditionValue = (typeof CONDITIONS)[number]['value'];
export type ShareModeValue = (typeof SHARE_MODES)[number]['value'];

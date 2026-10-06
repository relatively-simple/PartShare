export type PostType = 'offer' | 'request';
export type PostStatus = 'open' | 'done' | 'hidden';
export type Category = 'motors_actuators' | 'boards_controllers' | 'sensors' | 'drivers_modules' | 'power_batteries' | 'mechanical' | 'wheels_gears_chassis' | 'cables_connectors' | 'tools_equipment' | 'other';
export type ItemCondition = 'new' | 'like_new' | 'used_working' | 'untested' | 'for_parts';
export type ShareMode = 'give' | 'lend' | 'swap';

export interface Profile {
  id: string;
  display_name: string;
  whatsapp: string;
  location: string;
  consent_at: string;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  type: PostType;
  title: string;
  category: Category;
  model_number: string | null;
  model_key: string | null;
  quantity: number;
  condition: ItemCondition | null;
  details: string | null;
  share_modes: ShareMode[];
  location: string;
  needed_by: string | null;
  status: PostStatus;
  report_count: number;
  author_name: string;
  created_at: string;
  expires_at: string;
}

export interface PostStats {
  post_id: string;
  contact_taps: number;
  match_count: number;
}

export interface PublicStats {
  open_offers: number;
  open_wanted: number;
  done: number;
}

export interface RevealedContact {
  name: string;
  whatsapp: string;
}

export interface MatchPost extends Pick<Post, 'id' | 'type' | 'title' | 'category' | 'model_number' | 'model_key' | 'quantity' | 'location' | 'author_name' | 'created_at' | 'share_modes' | 'condition' | 'needed_by'> {
  similarity: number;
}

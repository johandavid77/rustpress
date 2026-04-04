export interface Slider {
  id: string;
  title: string;
  subtitle: string | null;
  button_text: string | null;
  button_url: string | null;
  image_url: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSliderDto {
  title: string;
  subtitle?: string;
  button_text?: string;
  button_url?: string;
  image_url: string;
  order_index?: number;
  is_active?: boolean;
}

export interface UpdateSliderDto extends Partial<CreateSliderDto> {
  is_active?: boolean;
}

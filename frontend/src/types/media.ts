export interface MediaFile {
  id: string; filename: string; original_name: string; mime_type: string;
  size_bytes: number; url: string; thumbnail_url: string | null;
  alt_text: string | null; uploaded_by: string | null; created_at: string;
}

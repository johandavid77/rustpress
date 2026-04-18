export interface User {
  id: string; username: string; email: string;
  role_id: string | null; role_name: string | null; is_active: boolean; created_at: string;
}
export interface LoginDto { email: string; password: string; }
export interface RegisterDto { username: string; email: string; password: string; }
export interface AuthResponse { user: User; token: string; }

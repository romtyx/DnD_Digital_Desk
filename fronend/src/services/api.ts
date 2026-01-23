// Get API URL from environment variables (supports both Vite and Bun)
const getApiBaseUrl = (): string => {
  try {
    // Try Vite's import.meta.env first
    const viteEnv = (import.meta as any)?.env
    if (viteEnv?.VITE_API_URL) {
      return viteEnv.VITE_API_URL
    }
  } catch {
    // Ignore if import.meta is not available
  }

  try {
    // Try Bun's process.env
    const processEnv = (globalThis as any).process?.env
    if (processEnv?.VITE_API_URL) {
      return processEnv.VITE_API_URL
    }
  } catch {
    // Ignore if process is not available
  }

  try {
    // Try Bun.env directly
    const bunEnv = (globalThis as any).Bun?.env
    if (bunEnv?.VITE_API_URL) {
      return bunEnv.VITE_API_URL
    }
  } catch {
    // Ignore if Bun is not available
  }

  // Default fallback
  return 'http://localhost:8000/api'
}

const API_BASE_URL = getApiBaseUrl()

export interface RegisterData {
  username: string
  email: string
  password: string
  password2: string
}

export interface LoginData {
  username: string
  password: string
}

export interface AuthResponse {
  user: {
    id: number
    username: string
    email: string
  }
  tokens: {
    access: string
    refresh: string
  }
  message: string
}

export interface ApiError {
  error?: string
  [key: string]: string | string[] | undefined
}

class ApiService {
  private getAuthToken(): string | null {
    return localStorage.getItem('access_token')
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = this.getAuthToken()

    // Build headers object
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Merge existing headers if they're a plain object
    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers[key] = value
        })
      } else if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, value]) => {
          headers[key] = value
        })
      } else {
        Object.assign(headers, options.headers)
      }
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        (data as ApiError).error ||
          data.detail ||
          Object.values(data).flat().join(', ') ||
          'An error occurred',
      )
    }

    return data as T
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/accounts/register/', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    // Store tokens
    if (response.tokens) {
      localStorage.setItem('access_token', response.tokens.access)
      localStorage.setItem('refresh_token', response.tokens.refresh)
    }

    return response
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/accounts/login/', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    // Store tokens
    if (response.tokens) {
      localStorage.setItem('access_token', response.tokens.access)
      localStorage.setItem('refresh_token', response.tokens.refresh)
    }

    return response
  }

  logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken()
  }
}

export const apiService = new ApiService()

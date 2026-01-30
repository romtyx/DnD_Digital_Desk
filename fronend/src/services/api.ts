// Get API URL from environment variables (supports both Vite and Bun)
const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return '/api'
  }

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

export interface UserProfile {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  date_joined: string
}

export interface Campaign {
  id: number
  name: string
  description: string
  world_story: string
  characters?: number[]
  characters_detail?: {
    id: number
    name: string
    character_class_name: string
    level: number
  }[]
}

export interface SessionItem {
  id: number
  number: number
  date: string
  description: string
  campaign: number
}

export interface DMNote {
  id: number
  text: string
  session: number
}

export interface CharacterClass {
  id: number
  name: string
  hit_die: number | null
}

export interface CharacterSheet {
  id: number
  name: string
  character_class: number
  character_class_name?: string
  level: number
  race: string
  background: string
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
  max_hit_points: number
  current_hit_points: number
  armor_class: number
  speed: number
  inspiration: boolean
  skills: string
  equipment: string
  spells: string
}

export interface CampaignNote {
  id: number
  text: string
  campaign: number
  created_at: string
}

export interface Storyline {
  id: number
  title: string
  summary: string
  order: number
  campaign: number
}

export interface StoryOutcome {
  id: number
  title: string
  condition: string
  description: string
  order: number
  storyline: number
}

export interface ChatMessage {
  id: number
  text: string
  campaign: number
  user: number
  user_name: string
  created_at: string
}

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
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

    const contentType = response.headers.get('content-type') || ''
    const hasJson = contentType.includes('application/json')
    const data = hasJson ? await response.json() : null

    if (!response.ok) {
      const fallback = hasJson
        ? (data as ApiError).error ||
          (data as any).detail ||
          Object.values(data as Record<string, string | string[] | undefined>)
            .flat()
            .join(', ')
        : null
      throw new Error(fallback || 'An error occurred')
    }

    if (response.status === 204) {
      return undefined as T
    }

    return (data ?? {}) as T
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

  async getMe(): Promise<UserProfile> {
    return this.request<UserProfile>('/accounts/me/')
  }

  async listCampaigns(): Promise<Campaign[]> {
    const response = await this.request<Paginated<Campaign>>('/accounts/campaigns/')
    return response?.results ?? []
  }

  async createCampaign(data: Omit<Campaign, 'id'>): Promise<Campaign> {
    return this.request<Campaign>('/accounts/campaigns/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCampaign(id: number, data: Partial<Omit<Campaign, 'id'>>): Promise<Campaign> {
    return this.request<Campaign>(`/accounts/campaigns/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteCampaign(id: number): Promise<void> {
    await this.request<void>(`/accounts/campaigns/${id}/`, {
      method: 'DELETE',
    })
  }

  async getCampaign(id: number): Promise<Campaign> {
    return this.request<Campaign>(`/accounts/campaigns/${id}/`)
  }

  async listSessions(campaignId?: number): Promise<SessionItem[]> {
    const query = campaignId ? `?campaign=${campaignId}` : ''
    const response = await this.request<Paginated<SessionItem>>(`/accounts/sessions/${query}`)
    return response?.results ?? []
  }

  async createSession(data: Omit<SessionItem, 'id'>): Promise<SessionItem> {
    return this.request<SessionItem>('/accounts/sessions/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateSession(id: number, data: Partial<Omit<SessionItem, 'id'>>): Promise<SessionItem> {
    return this.request<SessionItem>(`/accounts/sessions/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteSession(id: number): Promise<void> {
    await this.request<void>(`/accounts/sessions/${id}/`, {
      method: 'DELETE',
    })
  }

  async listNotes(sessionId?: number): Promise<DMNote[]> {
    const query = sessionId ? `?session=${sessionId}` : ''
    const response = await this.request<Paginated<DMNote>>(`/accounts/dm-notes/${query}`)
    return response?.results ?? []
  }

  async createNote(data: Omit<DMNote, 'id'>): Promise<DMNote> {
    return this.request<DMNote>('/accounts/dm-notes/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateNote(id: number, data: Partial<Omit<DMNote, 'id'>>): Promise<DMNote> {
    return this.request<DMNote>(`/accounts/dm-notes/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteNote(id: number): Promise<void> {
    await this.request<void>(`/accounts/dm-notes/${id}/`, {
      method: 'DELETE',
    })
  }

  async listClasses(): Promise<CharacterClass[]> {
    const response = await this.request<Paginated<CharacterClass>>('/accounts/classes/')
    return response?.results ?? []
  }

  async listCharacters(): Promise<CharacterSheet[]> {
    const response = await this.request<Paginated<CharacterSheet>>('/accounts/characters/')
    return response?.results ?? []
  }

  async createCharacter(data: Partial<CharacterSheet>): Promise<CharacterSheet> {
    return this.request<CharacterSheet>('/accounts/characters/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCharacter(id: number, data: Partial<CharacterSheet>): Promise<CharacterSheet> {
    return this.request<CharacterSheet>(`/accounts/characters/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteCharacter(id: number): Promise<void> {
    await this.request<void>(`/accounts/characters/${id}/`, {
      method: 'DELETE',
    })
  }

  async listCampaignNotes(campaignId: number): Promise<CampaignNote[]> {
    const response = await this.request<Paginated<CampaignNote>>(
      `/accounts/campaign-notes/?campaign=${campaignId}`,
    )
    return response?.results ?? []
  }

  async createCampaignNote(data: Omit<CampaignNote, 'id' | 'created_at'>): Promise<CampaignNote> {
    return this.request<CampaignNote>('/accounts/campaign-notes/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async deleteCampaignNote(id: number): Promise<void> {
    await this.request<void>(`/accounts/campaign-notes/${id}/`, {
      method: 'DELETE',
    })
  }

  async listStorylines(campaignId: number): Promise<Storyline[]> {
    const response = await this.request<Paginated<Storyline>>(
      `/accounts/storylines/?campaign=${campaignId}`,
    )
    return response?.results ?? []
  }

  async createStoryline(data: Omit<Storyline, 'id'>): Promise<Storyline> {
    return this.request<Storyline>('/accounts/storylines/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async deleteStoryline(id: number): Promise<void> {
    await this.request<void>(`/accounts/storylines/${id}/`, {
      method: 'DELETE',
    })
  }

  async listStoryOutcomes(storylineId: number): Promise<StoryOutcome[]> {
    const response = await this.request<Paginated<StoryOutcome>>(
      `/accounts/story-outcomes/?storyline=${storylineId}`,
    )
    return response?.results ?? []
  }

  async createStoryOutcome(data: Omit<StoryOutcome, 'id'>): Promise<StoryOutcome> {
    return this.request<StoryOutcome>('/accounts/story-outcomes/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async deleteStoryOutcome(id: number): Promise<void> {
    await this.request<void>(`/accounts/story-outcomes/${id}/`, {
      method: 'DELETE',
    })
  }

  async listChatMessages(campaignId: number): Promise<ChatMessage[]> {
    const response = await this.request<Paginated<ChatMessage>>(
      `/accounts/chat-messages/?campaign=${campaignId}`,
    )
    return response?.results ?? []
  }

  async sendChatMessage(data: Omit<ChatMessage, 'id' | 'user' | 'user_name' | 'created_at'>): Promise<ChatMessage> {
    return this.request<ChatMessage>('/accounts/chat-messages/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

export const apiService = new ApiService()

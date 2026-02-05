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
  is_public: boolean
  max_players: number
  join_code?: string | null
  is_archived: boolean
  owner: number | null
  owner_name?: string
  is_owner?: boolean
  players?: {
    id: number
    username: string
    character_id: number
    character_name: string
    character_class_name: string
    level: number
  }[]
  players_count?: number
  pending_requests_count?: number
  my_request_status?: string | null
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
  owner?: number | null
  name: string
  player_name: string
  character_class: number
  character_class_name?: string
  level: number
  race: string
  background: string
  alignment: string
  experience_points: number
  strength: number
  strength_mod: number
  dexterity: number
  dexterity_mod: number
  constitution: number
  constitution_mod: number
  intelligence: number
  intelligence_mod: number
  wisdom: number
  wisdom_mod: number
  charisma: number
  charisma_mod: number
  saving_throw_strength: number
  saving_throw_strength_prof: boolean
  saving_throw_dexterity: number
  saving_throw_dexterity_prof: boolean
  saving_throw_constitution: number
  saving_throw_constitution_prof: boolean
  saving_throw_intelligence: number
  saving_throw_intelligence_prof: boolean
  saving_throw_wisdom: number
  saving_throw_wisdom_prof: boolean
  saving_throw_charisma: number
  saving_throw_charisma_prof: boolean
  skill_acrobatics: number
  skill_acrobatics_prof: boolean
  skill_animal_handling: number
  skill_animal_handling_prof: boolean
  skill_arcana: number
  skill_arcana_prof: boolean
  skill_athletics: number
  skill_athletics_prof: boolean
  skill_deception: number
  skill_deception_prof: boolean
  skill_history: number
  skill_history_prof: boolean
  skill_insight: number
  skill_insight_prof: boolean
  skill_intimidation: number
  skill_intimidation_prof: boolean
  skill_investigation: number
  skill_investigation_prof: boolean
  skill_medicine: number
  skill_medicine_prof: boolean
  skill_nature: number
  skill_nature_prof: boolean
  skill_perception: number
  skill_perception_prof: boolean
  skill_performance: number
  skill_performance_prof: boolean
  skill_persuasion: number
  skill_persuasion_prof: boolean
  skill_religion: number
  skill_religion_prof: boolean
  skill_sleight_of_hand: number
  skill_sleight_of_hand_prof: boolean
  skill_stealth: number
  skill_stealth_prof: boolean
  skill_survival: number
  skill_survival_prof: boolean
  max_hit_points: number
  current_hit_points: number
  temporary_hit_points: number
  armor_class: number
  initiative: number
  speed: number
  inspiration: boolean
  proficiency_bonus: number
  passive_perception: number
  hit_dice_total: number
  hit_dice_used: number
  hit_dice_type: string
  death_save_successes: number
  death_save_failures: number
  skills?: string
  equipment: string
  spells?: string
  treasure: string
  attacks: string
  attacks_and_spells: string
  other_proficiencies: string
  personality_traits: string
  ideals: string
  bonds: string
  flaws: string
  features_traits: string
  age: string
  height: string
  weight: string
  eyes: string
  skin: string
  hair: string
  appearance: string
  appearance_image?: string | null
  symbol_image?: string | null
  backstory: string
  allies_organizations: string
  additional_features: string
  spellcasting_class: string
  spellcasting_ability: string
  spell_save_dc: number
  spell_attack_bonus: number
  spells_cantrips: string
  spell_slots_1_total: number
  spell_slots_1_used: number
  spells_level_1: string
  spell_slots_2_total: number
  spell_slots_2_used: number
  spells_level_2: string
  spell_slots_3_total: number
  spell_slots_3_used: number
  spells_level_3: string
  spell_slots_4_total: number
  spell_slots_4_used: number
  spells_level_4: string
  spell_slots_5_total: number
  spell_slots_5_used: number
  spells_level_5: string
  spell_slots_6_total: number
  spell_slots_6_used: number
  spells_level_6: string
  spell_slots_7_total: number
  spell_slots_7_used: number
  spells_level_7: string
  spell_slots_8_total: number
  spell_slots_8_used: number
  spells_level_8: string
  spell_slots_9_total: number
  spell_slots_9_used: number
  spells_level_9: string
}

export interface CampaignJoinRequest {
  id: number
  campaign: number
  campaign_name?: string
  campaign_owner_name?: string
  user: number
  user_name?: string
  character: number
  character_name?: string
  character_class_name?: string
  status: string
  created_at: string
  decided_at?: string | null
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
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData

    // Build headers object
    const headers: Record<string, string> = {
    }
    if (!isFormData) {
      headers['Content-Type'] = 'application/json'
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

  async listPublicCampaigns(query?: string): Promise<Campaign[]> {
    const suffix = query ? `?q=${encodeURIComponent(query)}` : ''
    const response = await this.request<Paginated<Campaign>>(`/accounts/campaigns/public/${suffix}`)
    return response?.results ?? []
  }

  async createCampaign(data: Partial<Omit<Campaign, 'id'>>): Promise<Campaign> {
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

  async listCampaignRequests(options?: {
    scope?: 'incoming' | 'outgoing'
    campaignId?: number
    status?: string
  }): Promise<CampaignJoinRequest[]> {
    const params = new URLSearchParams()
    if (options?.scope) params.set('scope', options.scope)
    if (options?.campaignId) params.set('campaign', String(options.campaignId))
    if (options?.status) params.set('status', options.status)
    const suffix = params.toString() ? `?${params.toString()}` : ''
    const response = await this.request<Paginated<CampaignJoinRequest>>(
      `/accounts/campaign-requests/${suffix}`,
    )
    return response?.results ?? []
  }

  async createCampaignRequest(data: { campaign?: number; code?: string; character: number }): Promise<CampaignJoinRequest> {
    return this.request<CampaignJoinRequest>('/accounts/campaign-requests/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async approveCampaignRequest(id: number): Promise<CampaignJoinRequest> {
    return this.request<CampaignJoinRequest>(`/accounts/campaign-requests/${id}/approve/`, {
      method: 'POST',
    })
  }

  async rejectCampaignRequest(id: number): Promise<CampaignJoinRequest> {
    return this.request<CampaignJoinRequest>(`/accounts/campaign-requests/${id}/reject/`, {
      method: 'POST',
    })
  }

  async createCharacter(data: Partial<CharacterSheet> | FormData): Promise<CharacterSheet> {
    return this.request<CharacterSheet>('/accounts/characters/', {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    })
  }

  async updateCharacter(id: number, data: Partial<CharacterSheet> | FormData): Promise<CharacterSheet> {
    return this.request<CharacterSheet>(`/accounts/characters/${id}/`, {
      method: 'PATCH',
      body: data instanceof FormData ? data : JSON.stringify(data),
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

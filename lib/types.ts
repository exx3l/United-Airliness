export interface Flight {
  id: string
  number: string
  route: string
  date: string
  time: string
  gate: string
  interested: number
  isActive: boolean
  gameLink?: string | null
  createdAt: string
}

export interface ASAUser {
  id: string
  username: string
  password?: string // Password might be optional for some operations like finding a user
  role: "owner" | "hr" | "personnel"
  createdBy: string
  createdAt: string
}

export interface ActionLog {
  id: string
  timestamp: string
  staffUsername: string
  action: "kick" | "warn" | "ban" | "other"
  targetUser: string
  reason: string
}

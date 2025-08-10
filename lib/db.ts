import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Define interfaces for your data
export interface Flight {
  id: string
  number: string
  route: string
  date: string
  time: string
  gate: string
  interested: number
  isActive: boolean
  gameLink?: string // Added gameLink field
}

export interface ASAUser {
  id: string
  username: string
  password: string // In a real app, hash this!
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

// Function to ensure tables exist and seed initial data
async function ensureTablesExist() {
  await sql`
    CREATE TABLE IF NOT EXISTS flights (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      number VARCHAR(255) UNIQUE NOT NULL,
      route VARCHAR(255) NOT NULL,
      date VARCHAR(255) NOT NULL,
      time VARCHAR(255) NOT NULL,
      gate VARCHAR(255) NOT NULL,
      interested INTEGER DEFAULT 0
    );
  `
  // Add the new is_active column if it doesn't exist
  await sql`ALTER TABLE flights ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;`
  // Add the new game_link column if it doesn't exist
  await sql`ALTER TABLE flights ADD COLUMN IF NOT EXISTS game_link TEXT;`

  await sql`
    CREATE TABLE IF NOT EXISTS asa_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL,
      created_by VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `

  await sql`
    CREATE TABLE IF NOT EXISTS action_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      staff_username VARCHAR(255) NOT NULL,
      action VARCHAR(50) NOT NULL,
      target_user VARCHAR(255) NOT NULL,
      reason TEXT
    );
  `

  // Seed initial owner user if not exists with 'rex' and '887719'
  const ownerExists = await sql`SELECT 1 FROM asa_users WHERE username = 'rex' AND role = 'owner';`
  if (ownerExists.length === 0) {
    await sql`
      INSERT INTO asa_users (username, password, role, created_by)
      VALUES ('rex', '887719', 'owner', 'system');
    `
  }
}

// Call ensureTablesExist at the start of each public function
// This ensures tables are created on first access if they don't exist
// and handles potential cold starts or environment resets.

// Flight Operations
export async function getFlights(): Promise<Flight[]> {
  await ensureTablesExist()
  const flights = await sql`SELECT * FROM flights ORDER BY date, time;`
  return flights.map((f: any) => ({
    id: f.id,
    number: f.number,
    route: f.route,
    date: f.date,
    time: f.time,
    gate: f.gate,
    interested: f.interested,
    isActive: f.is_active,
    gameLink: f.game_link, // Map the new column
  }))
}

export async function addFlight(newFlightData: Omit<Flight, "id" | "interested" | "isActive">): Promise<Flight> {
  await ensureTablesExist()
  const [flight] = await sql`
    INSERT INTO flights (number, route, date, time, gate, is_active, game_link)
    VALUES (${newFlightData.number}, ${newFlightData.route}, ${newFlightData.date}, ${newFlightData.time}, ${newFlightData.gate}, FALSE, ${newFlightData.gameLink || null})
    RETURNING *;
  `
  return {
    id: flight.id,
    number: flight.number,
    route: flight.route,
    date: flight.date,
    time: flight.time,
    gate: flight.gate,
    interested: flight.interested,
    isActive: flight.is_active,
    gameLink: flight.game_link,
  }
}

export async function deleteFlight(flightId: string): Promise<void> {
  await ensureTablesExist()
  await sql`DELETE FROM flights WHERE id = ${flightId};`
}

export async function updateFlightInterest(flightNumber: string): Promise<number> {
  await ensureTablesExist()
  const [updatedFlight] = await sql`
    UPDATE flights
    SET interested = interested + 1
    WHERE number = ${flightNumber}
    RETURNING interested;
  `
  return updatedFlight.interested
}

// New function to update flight active status
export async function updateFlightStatus(flightId: string, isActive: boolean): Promise<Flight | undefined> {
  await ensureTablesExist()
  const [updatedFlight] = await sql`
    UPDATE flights
    SET is_active = ${isActive}
    WHERE id = ${flightId}
    RETURNING *;
  `
  if (updatedFlight) {
    return {
      id: updatedFlight.id,
      number: updatedFlight.number,
      route: updatedFlight.route,
      date: updatedFlight.date,
      time: updatedFlight.time,
      gate: updatedFlight.gate,
      interested: updatedFlight.interested,
      isActive: updatedFlight.is_active,
      gameLink: updatedFlight.game_link,
    }
  }
  return undefined
}

// User Operations
export async function getUsers(): Promise<ASAUser[]> {
  await ensureTablesExist()
  const users = await sql`SELECT * FROM asa_users ORDER BY created_at DESC;`
  return users.map((u: any) => ({
    id: u.id,
    username: u.username,
    password: u.password,
    role: u.role,
    createdBy: u.created_by,
    createdAt: u.created_at,
  }))
}

export async function addUser(
  newUserData: Omit<ASAUser, "id" | "createdBy" | "createdAt">,
  createdBy: string,
): Promise<ASAUser> {
  await ensureTablesExist()
  const [user] = await sql`
    INSERT INTO asa_users (username, password, role, created_by)
    VALUES (${newUserData.username}, ${newUserData.password}, ${newUserData.role}, ${createdBy})
    RETURNING *;
  `
  return {
    id: user.id,
    username: user.username,
    password: user.password,
    role: user.role,
    createdBy: user.created_by,
    createdAt: user.created_at,
  }
}

export async function deleteUser(userId: string): Promise<void> {
  await ensureTablesExist()
  await sql`DELETE FROM asa_users WHERE id = ${userId};`
}

export async function findUser(username: string, password?: string): Promise<ASAUser | undefined> {
  await ensureTablesExist()
  let query = sql`SELECT * FROM asa_users WHERE username = ${username}`
  if (password) {
    query = sql`SELECT * FROM asa_users WHERE username = ${username} AND password = ${password}`
  }
  const [user] = await query
  if (user) {
    return {
      id: user.id,
      username: user.username,
      password: user.password,
      role: user.role,
      createdBy: user.created_by,
      createdAt: user.created_at,
    }
  }
  return undefined
}

export async function updateUser(
  userId: string,
  updatedData: Partial<Omit<ASAUser, "id" | "createdBy" | "createdAt">>,
): Promise<ASAUser | undefined> {
  await ensureTablesExist()
  const updates: string[] = []
  const values: any[] = []

  if (updatedData.username !== undefined) {
    updates.push("username = $" + (updates.length + 1))
    values.push(updatedData.username)
  }
  if (updatedData.password !== undefined) {
    updates.push("password = $" + (updates.length + 1))
    values.push(updatedData.password)
  }
  if (updatedData.role !== undefined) {
    updates.push("role = $" + (updates.length + 1))
    values.push(updatedData.role)
  }

  if (updates.length === 0) {
    return undefined // No updates to perform
  }

  values.push(userId) // Add userId as the last parameter

  const [updatedUser] = await sql`
    UPDATE asa_users
    SET ${sql.join(updates, sql`, `)}
    WHERE id = ${sql.literal(userId)}
    RETURNING *;
  `
  if (updatedUser) {
    return {
      id: updatedUser.id,
      username: updatedUser.username,
      password: updatedUser.password,
      role: updatedUser.role,
      createdBy: updatedUser.created_by,
      createdAt: updatedUser.created_at,
    }
  }
  return undefined
}

// Action Log Operations
export async function getActionLogs(): Promise<ActionLog[]> {
  await ensureTablesExist()
  const logs = await sql`SELECT * FROM action_logs ORDER BY timestamp DESC;`
  return logs.map((log: any) => ({
    id: log.id,
    timestamp: log.timestamp,
    staffUsername: log.staff_username,
    action: log.action,
    targetUser: log.target_user,
    reason: log.reason,
  }))
}

export async function addActionLog(
  newLogData: Omit<ActionLog, "id" | "timestamp">,
  staffUsername: string,
): Promise<ActionLog> {
  await ensureTablesExist()
  const [log] = await sql`
    INSERT INTO action_logs (staff_username, action, target_user, reason)
    VALUES (${staffUsername}, ${newLogData.action}, ${newLogData.targetUser}, ${newLogData.reason})
    RETURNING *;
  `
  return {
    id: log.id,
    timestamp: log.timestamp,
    staffUsername: log.staff_username,
    action: log.action,
    targetUser: log.target_user,
    reason: log.reason,
  }
}

export async function deleteActionLog(logId: string): Promise<void> {
  await ensureTablesExist()
  await sql`DELETE FROM action_logs WHERE id = ${logId};`
}

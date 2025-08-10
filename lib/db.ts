import { neon } from "@neondatabase/serverless"
import type { Flight, ASAUser, ActionLog } from "./types" // Import types from new file

const sql = neon(process.env.DATABASE_URL!)

// Helper to convert snake_case to camelCase for database results
function toCamelCase<T>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map((v) => toCamelCase(v)) as T
  }
  if (obj !== null && typeof obj === "object") {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, char) => char.toUpperCase())
      acc[camelKey as keyof T] = toCamelCase(obj[key])
      return acc
    }, {} as T)
  }
  return obj
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
      interested INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT FALSE,
      game_link TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- Added created_at
    );
  `

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
export async function getFlightsAction(): Promise<Flight[]> {
  await ensureTablesExist()
  const flights = await sql`SELECT * FROM flights ORDER BY date, time;`
  return toCamelCase<Flight[]>(flights)
}

export async function addFlightAction(
  newFlightData: Omit<Flight, "id" | "interested" | "isActive" | "createdAt">,
): Promise<Flight> {
  await ensureTablesExist()
  const [flight] = await sql`
    INSERT INTO flights (number, route, date, time, gate, is_active, game_link)
    VALUES (${newFlightData.number}, ${newFlightData.route}, ${newFlightData.date}, ${newFlightData.time}, ${newFlightData.gate}, FALSE, ${newFlightData.gameLink || null})
    RETURNING *;
  `
  return toCamelCase<Flight>(flight)
}

export async function deleteFlightAction(flightId: string): Promise<void> {
  await ensureTablesExist()
  await sql`DELETE FROM flights WHERE id = ${flightId};`
}

export async function updateFlightInterestAction(flightNumber: string): Promise<number> {
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
export async function updateFlightStatusAction(flightId: string, isActive: boolean): Promise<Flight | undefined> {
  await ensureTablesExist()
  const [updatedFlight] = await sql`
    UPDATE flights
    SET is_active = ${isActive}
    WHERE id = ${flightId}
    RETURNING *;
  `
  if (updatedFlight) {
    return toCamelCase<Flight>(updatedFlight)
  }
  return undefined
}

// User Operations
export async function getUsersAction(): Promise<ASAUser[]> {
  await ensureTablesExist()
  const users = await sql`SELECT * FROM asa_users ORDER BY created_at DESC;`
  return toCamelCase<ASAUser[]>(users)
}

export async function addUserAction(
  newUserData: Omit<ASAUser, "id" | "createdBy" | "createdAt">,
  createdBy: string,
): Promise<ASAUser> {
  await ensureTablesExist()
  const [user] = await sql`
    INSERT INTO asa_users (username, password, role, created_by)
    VALUES (${newUserData.username}, ${newUserData.password}, ${newUserData.role}, ${createdBy})
    RETURNING *;
  `
  return toCamelCase<ASAUser>(user)
}

export async function deleteUserAction(userId: string): Promise<void> {
  await ensureTablesExist()
  await sql`DELETE FROM asa_users WHERE id = ${userId};`
}

export async function findUserAction(username: string, password?: string): Promise<ASAUser | undefined> {
  await ensureTablesExist()
  let query = sql`SELECT * FROM asa_users WHERE username = ${username}`
  if (password) {
    query = sql`SELECT * FROM asa_users WHERE username = ${username} AND password = ${password}`
  }
  const [user] = await query
  if (user) {
    return toCamelCase<ASAUser>(user)
  }
  return undefined
}

export async function updateUserAction(
  userId: string,
  updatedData: Partial<Omit<ASAUser, "id" | "createdBy" | "createdAt">>,
): Promise<ASAUser | undefined> {
  await ensureTablesExist()
  const setClauses: any[] = []

  if (updatedData.username !== undefined) {
    setClauses.push(sql`username = ${updatedData.username}`)
  }
  if (updatedData.password !== undefined) {
    setClauses.push(sql`password = ${updatedData.password}`)
  }
  if (updatedData.role !== undefined) {
    setClauses.push(sql`role = ${updatedData.role}`)
  }

  if (setClauses.length === 0) {
    return undefined // No updates to perform
  }

  const [updatedUser] = await sql`
    UPDATE asa_users
    SET ${sql.join(setClauses, sql`, `)}
    WHERE id = ${userId}
    RETURNING *;
  `
  if (updatedUser) {
    return toCamelCase<ASAUser>(updatedUser)
  }
  return undefined
}

// Action Log Operations
export async function getActionLogsAction(): Promise<ActionLog[]> {
  await ensureTablesExist()
  const logs = await sql`SELECT * FROM action_logs ORDER BY timestamp DESC;`
  return toCamelCase<ActionLog[]>(logs)
}

export async function addActionLogAction(
  newLogData: Omit<ActionLog, "id" | "timestamp">,
  staffUsername: string,
): Promise<ActionLog> {
  await ensureTablesExist()
  const [log] = await sql`
    INSERT INTO action_logs (staff_username, action, target_user, reason)
    VALUES (${staffUsername}, ${newLogData.action}, ${newLogData.targetUser}, ${newLogData.reason})
    RETURNING *;
  `
  return toCamelCase<ActionLog>(log)
}

export async function deleteActionLogAction(logId: string): Promise<void> {
  await ensureTablesExist()
  await sql`DELETE FROM action_logs WHERE id = ${logId};`
}

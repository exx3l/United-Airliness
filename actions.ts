"use server"

import {
  getFlights,
  addFlight,
  deleteFlight,
  updateFlightInterest,
  updateFlightStatus,
  getUsers,
  addUser,
  deleteUser,
  findUser,
  updateUser,
  getActionLogs,
  addActionLog,
  deleteActionLog,
} from "@/lib/db"
import type { Flight, ASAUser, ActionLog } from "@/lib/db"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

// Flight Actions
export async function getFlightsAction(): Promise<Flight[]> {
  return await getFlights()
}

export async function addFlightAction(newFlightData: Omit<Flight, "id" | "interested" | "isActive">): Promise<Flight> {
  try {
    const newFlight = await addFlight(newFlightData)
    return newFlight
  } catch (error: any) {
    if (error.message.includes("duplicate key value violates unique constraint")) {
      throw new Error("Flight number already exists. Please use a unique number.")
    }
    console.error("Error adding flight:", error)
    throw new Error("Failed to add flight. Please try again.")
  }
}

export async function deleteFlightAction(flightId: string): Promise<void> {
  await deleteFlight(flightId)
}

export async function updateFlightInterestAction(flightNumber: string): Promise<number> {
  return await updateFlightInterest(flightNumber)
}

// New Server Action to update flight status
export async function updateFlightStatusAction(flightId: string, isActive: boolean): Promise<Flight | undefined> {
  return await updateFlightStatus(flightId, isActive)
}

// User Actions
export async function getUsersAction(): Promise<ASAUser[]> {
  return await getUsers()
}

export async function addUserAction(
  newUserData: Omit<ASAUser, "id" | "createdBy" | "createdAt">,
  createdBy: string,
): Promise<ASAUser> {
  try {
    const newUser = await addUser(newUserData, createdBy)
    return newUser
  } catch (error: any) {
    if (error.message.includes("duplicate key value violates unique constraint")) {
      throw new Error("Username already exists. Please choose a different username.")
    }
    console.error("Error adding user:", error)
    throw new Error("Failed to add user. Please try again.")
  }
}

export async function deleteUserAction(userId: string): Promise<void> {
  await deleteUser(userId)
}

export async function findUserAction(username: string, password?: string): Promise<ASAUser | undefined> {
  return await findUser(username, password)
}

export async function updateUserAction(
  userId: string,
  updatedData: Partial<Omit<ASAUser, "id" | "createdBy" | "createdAt">>,
): Promise<ASAUser | undefined> {
  try {
    const updatedUser = await updateUser(userId, updatedData)
    return updatedUser
  } catch (error: any) {
    if (error.message.includes("duplicate key value violates unique constraint")) {
      throw new Error("Username already exists. Please choose a different username.")
    }
    console.error("Error updating user:", error)
    throw new Error("Failed to update user. Please try again.")
  }
}

// Authentication Actions
export async function loginAction(prevState: any, formData: FormData) {
  const username = formData.get("username") as string
  const password = formData.get("password") as string

  if (!username || !password) {
    return { message: "Username and password are required." }
  }

  try {
    const user = await findUser(username, password)
    if (user) {
      cookies().set("username", user.username, { httpOnly: true, secure: true, sameSite: "strict" })
      cookies().set("role", user.role, { httpOnly: true, secure: true, sameSite: "strict" })
      redirect("/dashboard")
    } else {
      return { message: "Invalid username or password." }
    }
  } catch (error) {
    console.error("Login error:", error)
    return { message: "An unexpected error occurred during login." }
  }
}

export async function logoutAction() {
  cookies().delete("username")
  cookies().delete("role")
  redirect("/")
}

export async function getSession() {
  const username = cookies().get("username")?.value
  const role = cookies().get("role")?.value
  return { username, role }
}

// Action Log Actions
export async function getActionLogsAction(): Promise<ActionLog[]> {
  return await getActionLogs()
}

export async function addActionLogAction(
  newLogData: Omit<ActionLog, "id" | "timestamp">,
  staffUsername: string,
): Promise<ActionLog> {
  try {
    const newLog = await addActionLog(newLogData, staffUsername)
    return newLog
  } catch (error) {
    console.error("Error adding action log:", error)
    throw new Error("Failed to log action. Please try again.")
  }
}

export async function deleteActionLogAction(logId: string): Promise<void> {
  await deleteActionLog(logId)
}

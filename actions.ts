"use server"

import {
  getFlightsAction,
  addFlightAction,
  deleteFlightAction,
  updateFlightInterestAction,
  updateFlightStatusAction,
  getUsersAction,
  addUserAction,
  deleteUserAction,
  findUserAction,
  updateUserAction,
  getActionLogsAction,
  addActionLogAction,
  deleteActionLogAction,
} from "@/lib/db"
import type { Flight, ASAUser, ActionLog } from "@/lib/types"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

// Flight Actions
export async function getFlights(): Promise<Flight[]> {
  return await getFlightsAction()
}

export async function addFlight(newFlightData: Omit<Flight, "id" | "interested" | "isActive">): Promise<Flight> {
  try {
    const newFlight = await addFlightAction(newFlightData)
    return newFlight
  } catch (error: any) {
    if (error.message.includes("duplicate key value violates unique constraint")) {
      throw new Error("Flight number already exists. Please use a unique number.")
    }
    console.error("Error adding flight:", error)
    throw new Error("Failed to add flight. Please try again.")
  }
}

export async function deleteFlight(flightId: string): Promise<void> {
  await deleteFlightAction(flightId)
}

export async function updateFlightInterest(flightNumber: string): Promise<number> {
  return await updateFlightInterestAction(flightNumber)
}

// New Server Action to update flight status
export async function updateFlightStatus(flightId: string, isActive: boolean): Promise<Flight | undefined> {
  return await updateFlightStatusAction(flightId, isActive)
}

// User Actions
export async function getUsers(): Promise<ASAUser[]> {
  return await getUsersAction()
}

export async function addUser(
  newUserData: Omit<ASAUser, "id" | "createdBy" | "createdAt">,
  createdBy: string,
): Promise<ASAUser> {
  try {
    const newUser = await addUserAction(newUserData, createdBy)
    return newUser
  } catch (error: any) {
    if (error.message.includes("duplicate key value violates unique constraint")) {
      throw new Error("Username already exists. Please choose a different username.")
    }
    console.error("Error adding user:", error)
    throw new Error("Failed to add user. Please try again.")
  }
}

export async function deleteUser(userId: string): Promise<void> {
  await deleteUserAction(userId)
}

export async function findUser(username: string, password?: string): Promise<ASAUser | undefined> {
  return await findUserAction(username, password)
}

export async function updateUser(
  userId: string,
  updatedData: Partial<Omit<ASAUser, "id" | "createdBy" | "createdAt">>,
): Promise<ASAUser | undefined> {
  try {
    const updatedUser = await updateUserAction(userId, updatedData)
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
    const user = await findUserAction(username, password)
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
export async function getActionLogs(): Promise<ActionLog[]> {
  return await getActionLogsAction()
}

export async function addActionLog(
  newLogData: Omit<ActionLog, "id" | "timestamp">,
  staffUsername: string,
): Promise<ActionLog> {
  try {
    const newLog = await addActionLogAction(newLogData, staffUsername)
    return newLog
  } catch (error) {
    console.error("Error adding action log:", error)
    throw new Error("Failed to log action. Please try again.")
  }
}

export async function deleteActionLog(logId: string): Promise<void> {
  await deleteActionLogAction(logId)
}

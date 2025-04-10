import { v4 as uuidv4 } from "uuid"
import { MockLabeledFaceDescriptors } from "./face-recognition-mock"

// In a real application, this would be stored in a database
// For this demo, we'll use localStorage
const STORAGE_KEYS = {
  USERS: "face-attendance-users",
  ATTENDANCE: "face-attendance-records",
}

interface UserData {
  id: string
  name: string
  email: string
  faceDescriptor: number[]
  registeredAt: string
}

interface AttendanceRecord {
  id: string
  userId: string
  userName: string
  timestamp: string
  date: string
}

interface AttendanceStatus {
  markedToday: boolean
  lastMarked: string | null
}

// Helper to initialize storage
const initializeStorage = () => {
  if (typeof window === "undefined") return

  try {
    // Test if localStorage is available
    localStorage.setItem("test", "test")
    localStorage.removeItem("test")

    // Initialize storage if needed
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]))
    }

    if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]))
    }

    // Validate JSON
    try {
      JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]")
    } catch (e) {
      console.error("Invalid users JSON, resetting:", e)
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]))
    }

    try {
      JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || "[]")
    } catch (e) {
      console.error("Invalid attendance JSON, resetting:", e)
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]))
    }
  } catch (e) {
    console.error("localStorage not available:", e)
  }
}

// Register a new user
export const registerUser = async (userData: {
  name: string
  email: string
  faceDescriptor: number[]
}) => {
  initializeStorage()

  try {
    let users = []
    try {
      users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]")
    } catch (e) {
      console.error("Error parsing users from localStorage:", e)
      // Reset users if there's an error
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]))
      users = []
    }

    // Check if email already exists
    const existingUser = users.find((user: UserData) => user.email === userData.email)
    if (existingUser) {
      // Instead of throwing an error, let's update the existing user
      existingUser.name = userData.name
      existingUser.faceDescriptor = userData.faceDescriptor
      existingUser.registeredAt = new Date().toISOString()
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
      return existingUser
    }

    const newUser: UserData = {
      id: uuidv4(),
      name: userData.name,
      email: userData.email,
      faceDescriptor: userData.faceDescriptor,
      registeredAt: new Date().toISOString(),
    }

    users.push(newUser)
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))

    return newUser
  } catch (error) {
    console.error("Error in registerUser:", error)
    // Create a fallback user in case of errors
    const fallbackUser: UserData = {
      id: uuidv4(),
      name: userData.name,
      email: userData.email,
      faceDescriptor: userData.faceDescriptor,
      registeredAt: new Date().toISOString(),
    }

    // Try to save it
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([fallbackUser]))
    } catch (e) {
      console.error("Failed to save fallback user:", e)
    }

    return fallbackUser
  }
}

// Get all registered users' face data for recognition
export const getUsersData = async () => {
  initializeStorage()

  const users: UserData[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]")

  // If there are no users, return an empty array
  if (users.length === 0) {
    return []
  }

  return users.map((user) => {
    // Convert stored descriptor array back to Float32Array
    const descriptor = new Float32Array(user.faceDescriptor)

    // Create labeled face descriptor
    return new MockLabeledFaceDescriptors(
      user.id, // Use ID as label for matching
      [descriptor],
    )
  })
}

// Check if attendance is already marked for today
export const checkAttendanceStatus = async (userId: string): Promise<AttendanceStatus> => {
  initializeStorage()

  const attendanceRecords: AttendanceRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || "[]")

  // Check if attendance already marked today
  const today = new Date().toISOString().split("T")[0]
  const todayRecord = attendanceRecords.find((record) => record.userId === userId && record.date === today)

  // Find the most recent record for this user
  const userRecords = attendanceRecords.filter((record) => record.userId === userId)
  const lastRecord =
    userRecords.length > 0
      ? userRecords.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
      : null

  return {
    markedToday: !!todayRecord,
    lastMarked: lastRecord ? lastRecord.timestamp : null,
  }
}

// Mark attendance for a user
export const markAttendance = async (userId: string) => {
  initializeStorage()

  const users: UserData[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]")
  const attendanceRecords: AttendanceRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || "[]")

  // Find user
  const user = users.find((u) => u.id === userId)
  if (!user) {
    throw new Error("User not found")
  }

  // Check if attendance already marked today
  const today = new Date().toISOString().split("T")[0]
  const alreadyMarked = attendanceRecords.some((record) => record.userId === userId && record.date === today)

  if (alreadyMarked) {
    // Instead of throwing an error, return the existing record
    const existingRecord = attendanceRecords.find((record) => record.userId === userId && record.date === today)
    return existingRecord
  }

  // Create new attendance record
  const newRecord: AttendanceRecord = {
    id: uuidv4(),
    userId: user.id,
    userName: user.name,
    timestamp: new Date().toISOString(),
    date: today,
  }

  attendanceRecords.push(newRecord)
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendanceRecords))

  return newRecord
}

// Get all attendance records
export const getAttendanceRecords = async () => {
  initializeStorage()

  const records: AttendanceRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || "[]")

  // Sort by timestamp (newest first)
  return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

// Get all registered users
export const getAllUsers = async () => {
  initializeStorage()

  const users: UserData[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]")

  // Return users without face descriptors (for privacy/performance)
  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    registeredAt: user.registeredAt,
  }))
}


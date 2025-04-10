"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Camera, UserPlus, Users } from "lucide-react"
import AttendanceMarking from "@/components/attendance-marking"
import UserRegistration from "@/components/user-registration"
import AdminDashboard from "@/components/admin-dashboard"

export default function Home() {
  const [activeTab, setActiveTab] = useState("mark-attendance")

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 bg-gray-50">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl md:text-3xl">Face Recognition Attendance System</CardTitle>
          <CardDescription>Register your face once, then get automatically recognized on future visits</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="mark-attendance" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="mark-attendance" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                <span className="hidden sm:inline">Mark Attendance</span>
              </TabsTrigger>
              <TabsTrigger value="register" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Register</span>
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="mark-attendance">
              <AttendanceMarking onNewUser={() => setActiveTab("register")} />
            </TabsContent>

            <TabsContent value="register">
              <UserRegistration onRegistrationComplete={() => setActiveTab("mark-attendance")} />
            </TabsContent>

            <TabsContent value="admin">
              <AdminDashboard />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  )
}


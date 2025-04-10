"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, Download, Search, UserX } from "lucide-react"
import { getAttendanceRecords, getAllUsers } from "@/lib/attendance-service"

interface User {
  id: string
  name: string
  email: string
  registeredAt: string
}

interface AttendanceRecord {
  id: string
  userId: string
  userName: string
  timestamp: string
  date: string
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch users and attendance records
        const [usersData, recordsData] = await Promise.all([getAllUsers(), getAttendanceRecords()])

        setUsers(usersData)
        setAttendanceRecords(recordsData)
        setFilteredRecords(recordsData)
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching data:", error)
        setError("Failed to load dashboard data. Please try again.")
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter attendance records based on search term and date
  useEffect(() => {
    let filtered = attendanceRecords

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter((record) => record.userName.toLowerCase().includes(term))
    }

    if (dateFilter) {
      filtered = filtered.filter((record) => record.date === dateFilter)
    }

    setFilteredRecords(filtered)
  }, [searchTerm, dateFilter, attendanceRecords])

  const handleExportCSV = () => {
    // Create CSV content
    const headers = ["Name", "Date", "Time"]
    const rows = filteredRecords.map((record) => [
      record.userName,
      record.date,
      new Date(record.timestamp).toLocaleTimeString(),
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `attendance-report-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <p>Loading dashboard data...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="attendance">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="attendance">Attendance Records</TabsTrigger>
          <TabsTrigger value="users">Registered Users</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <Label htmlFor="search" className="sr-only">
                    Search
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by name..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex-1">
                  <Label htmlFor="date-filter" className="sr-only">
                    Filter by date
                  </Label>
                  <Input
                    id="date-filter"
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                </div>

                <Button variant="outline" className="shrink-0" onClick={handleExportCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>

              {filteredRecords.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.userName}</TableCell>
                          <TableCell>{record.date}</TableCell>
                          <TableCell>{new Date(record.timestamp).toLocaleTimeString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <UserX className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No attendance records found</p>
                  {searchTerm || dateFilter ? (
                    <p className="text-sm">Try adjusting your search filters</p>
                  ) : (
                    <p className="text-sm">Start marking attendance to see records here</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              {users.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Registered On</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{new Date(user.registeredAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <UserX className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No users registered yet</p>
                  <p className="text-sm">Users will appear here once they register</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


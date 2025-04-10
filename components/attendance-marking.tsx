"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle, Info } from "lucide-react"
import { getUsersData, markAttendance, checkAttendanceStatus } from "@/lib/attendance-service"

// Import the mock implementation
import { mockFaceDetection } from "@/lib/face-recognition-mock"

interface AttendanceMarkingProps {
  onNewUser: () => void
}

export default function AttendanceMarking({ onNewUser }: AttendanceMarkingProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isModelLoading, setIsModelLoading] = useState(true)
  const [recognizedUser, setRecognizedUser] = useState<{ id: string; name: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attendanceMarked, setAttendanceMarked] = useState(false)
  const [alreadyMarkedToday, setAlreadyMarkedToday] = useState(false)
  const [mockApi, setMockApi] = useState<ReturnType<typeof mockFaceDetection> | null>(null)
  const [processingAttendance, setProcessingAttendance] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Initialize mock face detection
  useEffect(() => {
    // Create the mock API
    const mockFaceApi = mockFaceDetection()
    setMockApi(mockFaceApi)
  }, [])

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      setIsModelLoading(true)
      try {
        // Simulate loading models
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setIsModelLoading(false)
      } catch (error) {
        console.error("Error loading models:", error)
        setError("Failed to load face recognition models. Please refresh and try again.")
        setIsModelLoading(false)
      }
    }

    loadModels()

    return () => {
      // Clean up video stream when component unmounts
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        const tracks = stream.getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [])

  // Initialize camera
  useEffect(() => {
    const startVideo = async () => {
      setIsLoading(true);
      try {
        if (!videoRef.current) return;

        // Check if running in browser environment
        if (typeof window === 'undefined' || !navigator.mediaDevices) {
          setError('Camera access not available in this environment');
          setIsLoading(false);
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsLoading(false);
      } catch (error) {
        const message = error instanceof Error ? 
          `Camera access denied: ${error.message}` : 
          "Camera access failed";
        setError(message);
        setIsLoading(false);
      }
    };

    if (!isModelLoading) {
      startVideo();
    }
  }, [isModelLoading])

  // Reset states when user changes
  useEffect(() => {
    if (recognizedUser && recognizedUser.id !== currentUserId) {
      // Reset states for the new user
      setCurrentUserId(recognizedUser.id)
      setAttendanceMarked(false)
      setAlreadyMarkedToday(false)

      // Check attendance status for the new user
      checkAttendanceStatus(recognizedUser.id)
        .then((status) => {
          setAlreadyMarkedToday(status.markedToday)
        })
        .catch((err) => {
          console.error("Error checking attendance status:", err)
        })
    }
  }, [recognizedUser, currentUserId])

  // Face recognition process
  useEffect(() => {
    if (isLoading || isModelLoading || !videoRef.current || !canvasRef.current || !mockApi || processingAttendance)
      return

    let recognitionInterval: NodeJS.Timeout

    const recognizeFaces = async () => {
      if (!videoRef.current || !canvasRef.current) return

      // Get all registered users' face data
      const labeledFaceDescriptors = await getUsersData()

      if (labeledFaceDescriptors.length === 0) {
        // No registered users
        return
      }

      // Use our mock implementation instead of the real faceapi
      // Detect faces in video stream
      const detections = mockApi.detectAllFaces().withFaceLandmarks().withFaceDescriptors()

      // Resize detections to match video dimensions
      const resizedDetections = mockApi.resizeResults(detections)

      // Clear canvas and draw detections
      const ctx = canvasRef.current.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

        // Draw face detection results
        mockApi.draw.drawDetections(canvasRef.current, resizedDetections)

        // Match detected faces with registered users
        if (resizedDetections.length > 0) {
          for (const detection of resizedDetections) {
            // Use our mock implementation to find the best match
            const result = mockApi.findBestMatch(detection.descriptor, labeledFaceDescriptors)

            if (result.label !== "unknown") {
              // Found a match
              const userId = result.label
              const user = labeledFaceDescriptors.find((desc) => desc.label === userId)

              if (user && user.name) {
                // Only update if it's a different user or no user is recognized yet
                if (!recognizedUser || recognizedUser.id !== userId) {
                  setRecognizedUser({ id: userId, name: user.name })

                  // Check attendance status for this user
                  const status = await checkAttendanceStatus(userId)
                  setAlreadyMarkedToday(status.markedToday)
                }

                // Stop the interval once we've recognized someone
                clearInterval(recognitionInterval)
                break
              }
            }
          }
        }
      }
    }

    // Run face recognition every 100ms
    recognitionInterval = setInterval(recognizeFaces, 100)

    return () => {
      clearInterval(recognitionInterval)
    }
  }, [isLoading, isModelLoading, mockApi, recognizedUser, processingAttendance])

  // Handle attendance marking
  const handleMarkAttendance = async () => {
    if (!recognizedUser) return

    setProcessingAttendance(true)

    try {
      // Check if already marked today
      const status = await checkAttendanceStatus(recognizedUser.id)

      if (status.markedToday) {
        setAlreadyMarkedToday(true)
        setAttendanceMarked(true)
      } else {
        // Mark attendance
        await markAttendance(recognizedUser.id)
        setAttendanceMarked(true)
        setAlreadyMarkedToday(false)
      }

      // Reset after 5 seconds
      setTimeout(() => {
        // Reset recognition to allow for new users
        setRecognizedUser(null)
        setCurrentUserId(null)
        setAttendanceMarked(false)
        setAlreadyMarkedToday(false)
        setProcessingAttendance(false)
      }, 5000)
    } catch (error) {
      console.error("Error marking attendance:", error)
      setError("Failed to mark attendance. Please try again.")
      setProcessingAttendance(false)
    }
  }

  // Reset recognition to allow for new users
  const handleReset = () => {
    setRecognizedUser(null)
    setCurrentUserId(null)
    setAttendanceMarked(false)
    setAlreadyMarkedToday(false)
    setProcessingAttendance(false)
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button variant="outline" className="mt-2" onClick={() => setError(null)}>
          Try Again
        </Button>
      </Alert>
    )
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative w-full max-w-md aspect-video bg-black rounded-lg overflow-hidden">
        {(isLoading || isModelLoading) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
            <span className="ml-2 text-white">
              {isModelLoading ? "Loading face recognition models..." : "Starting camera..."}
            </span>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
          onPlay={() => {
            if (canvasRef.current && videoRef.current) {
              canvasRef.current.width = videoRef.current.videoWidth || 640
              canvasRef.current.height = videoRef.current.videoHeight || 480
            }
          }}
        />

        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
      </div>

      {recognizedUser ? (
        <Card className="w-full p-4 flex flex-col items-center">
          {attendanceMarked ? (
            <div className="flex flex-col items-center space-y-2 text-center">
              {alreadyMarkedToday ? (
                <>
                  <Info className="h-12 w-12 text-amber-500" />
                  <h3 className="text-xl font-semibold text-amber-600">Attendance Already Marked</h3>
                </>
              ) : (
                <>
                  <CheckCircle className="h-12 w-12 text-green-500" />
                  <h3 className="text-xl font-semibold text-green-600">Attendance Marked!</h3>
                </>
              )}
              <p>Welcome, {recognizedUser.name}!</p>
              {alreadyMarkedToday && (
                <p className="text-sm text-muted-foreground">You've already marked your attendance for today.</p>
              )}
              <Button variant="outline" className="mt-2" onClick={handleReset}>
                Reset
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4 text-center">
              <h3 className="text-xl font-semibold">Welcome back, {recognizedUser.name}!</h3>
              <Button onClick={handleMarkAttendance} className="w-full" disabled={processingAttendance}>
                {processingAttendance ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Mark Attendance"
                )}
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <div className="w-full text-center p-4">
          <p className="text-muted-foreground">
            {!isLoading && !isModelLoading ? (
              <>
                Looking for registered faces... <br />
                <Button variant="link" onClick={onNewUser} className="mt-2">
                  Not registered? Click here to register
                </Button>
              </>
            ) : (
              "Initializing camera..."
            )}
          </p>
        </div>
      )}
    </div>
  )
}


// Mock the face detection functionality
export const mockFaceDetection = () => {
  // Create a mock detection object that can be used throughout the app
  const mockDetection = {
    detection: {
      box: { x: 100, y: 100, width: 200, height: 200 },
      score: 0.95,
    },
    landmarks: {
      positions: Array(68).fill({ x: 0, y: 0 }),
      shift: () => ({ x: 0, y: 0 }),
    },
    descriptor: new Float32Array(128).fill(0.5),
    alignedRect: {
      box: { x: 100, y: 100, width: 200, height: 200 },
      score: 0.95,
    },
  }

  // Store a map of user IDs to descriptors to ensure consistent recognition
  const userDescriptors = new Map()

  // Create a mock implementation for detectAllFaces
  const mockDetectAllFaces = () => {
    return {
      withFaceLandmarks: () => ({
        withFaceDescriptors: () => {
          // Return an array with a mock detection
          return [mockDetection]
        },
      }),
    }
  }

  // Create a mock implementation for detectSingleFace
  const mockDetectSingleFace = () => {
    return {
      withFaceLandmarks: () => ({
        withFaceDescriptor: () => {
          // Return a mock detection
          return mockDetection
        },
      }),
    }
  }

  // Create a mock implementation for resizeResults
  const mockResizeResults = (results) => {
    // Just return the results unchanged for the mock
    return results
  }

  // Create a mock implementation for draw methods
  const mockDraw = {
    drawDetections: (canvas, detections) => {
      // Mock drawing detections
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.strokeStyle = "green"
        ctx.lineWidth = 2
        ctx.strokeRect(100, 100, 200, 200)
      }
    },
    drawFaceLandmarks: (canvas, landmarks) => {
      // Mock drawing landmarks
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "blue"
        ctx.fillRect(200, 200, 5, 5)
      }
    },
  }

  // Create a mock implementation for FaceMatcher
  const mockFindBestMatch = (descriptor, labeledDescriptors) => {
    // If we have labeled descriptors, return the first one as a match
    // Otherwise return unknown
    if (labeledDescriptors && labeledDescriptors.length > 0) {
      // Generate a random index to simulate different face recognitions
      // But ensure we're consistent for the same session
      const randomIndex = Math.floor(Math.random() * labeledDescriptors.length)
      const selectedDescriptor = labeledDescriptors[randomIndex]

      return {
        label: selectedDescriptor.label,
        distance: 0.3,
      }
    }

    return {
      label: "unknown",
      distance: 1.0,
    }
  }

  return {
    detectAllFaces: mockDetectAllFaces,
    detectSingleFace: mockDetectSingleFace,
    resizeResults: mockResizeResults,
    draw: mockDraw,
    findBestMatch: mockFindBestMatch,
  }
}

// Create a mock LabeledFaceDescriptors class that mimics the original
export class MockLabeledFaceDescriptors {
  constructor(label, descriptors) {
    this.label = label
    this.descriptors = descriptors
    this.name = label // Add name for display purposes
  }

  label: string
  descriptors: Float32Array[]
  name?: string
}

// Create a mock FaceMatcher class that mimics the original
export class MockFaceMatcher {
  constructor(labeledDescriptors, distanceThreshold = 0.6) {
    this._labeledDescriptors = labeledDescriptors
    this._distanceThreshold = distanceThreshold
  }

  _labeledDescriptors: any[]
  _distanceThreshold: number

  findBestMatch(descriptor: Float32Array) {
    // If we have labeled descriptors, return the first one as a match
    // Otherwise return unknown
    if (this._labeledDescriptors.length > 0) {
      return {
        label: this._labeledDescriptors[0].label,
        distance: 0.3,
      }
    }

    return {
      label: "unknown",
      distance: 1.0,
    }
  }
}


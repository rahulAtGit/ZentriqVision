// Test configuration for ZentriqVision mobile app

export const TEST_CONFIG = {
  // Test user credentials (for development only)
  testUser: {
    email: "test@zentriqvision.com",
    password: "TestPass123!",
    givenName: "Test User",
    phoneNumber: "+1234567890",
  },

  // Test video data
  testVideo: {
    fileName: "test-video.mp4",
    fileType: "video/mp4",
    duration: "00:02:30",
    size: "15.2 MB",
  },

  // Test detection data
  testDetections: [
    {
      personId: "person1",
      videoId: "test-video-1",
      timestamp: new Date().toISOString(),
      confidence: 0.95,
      attributes: {
        ageBucket: "25-34",
        gender: "male",
        emotion: "neutral",
        mask: false,
        hairColor: "black",
        upperColor: "blue",
        lowerColor: "black",
      },
    },
    {
      personId: "person2",
      videoId: "test-video-1",
      timestamp: new Date().toISOString(),
      confidence: 0.88,
      attributes: {
        ageBucket: "18-24",
        gender: "female",
        emotion: "happy",
        mask: false,
        hairColor: "brown",
        upperColor: "red",
        lowerColor: "blue",
      },
    },
  ],

  // API endpoints for testing
  apiEndpoints: {
    upload: "/upload",
    search: "/search",
    videos: "/videos",
    playback: "/playback",
  },

  // Test environment settings
  environment: {
    isDevelopment: true,
    isTesting: true,
    mockApi: true, // Use mock API for testing
  },
};

export default TEST_CONFIG;

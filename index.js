const NodeWebcam = require('node-webcam');
const fs = require('fs');
const path = require('path');
const Motion = require('motion');

// Set up the camera options
const cameraOptions = {
  width: 1280,
  height: 720,
  quality: 100,
  delay: 0,
  saveShots: true, // Save the images to disk
  output: 'jpeg',
  device: false, // Set to the camera device index if you have multiple cameras (e.g., 0, 1)
  callbackReturn: 'location',
};

// Create an instance of the camera
const Webcam = NodeWebcam.create(cameraOptions);

// Variables for motion detection
let previousFrame = null;

// Create a directory for the captured images
const capturesFolder = path.join(__dirname, 'captures'+ "/" + getDateString());
fs.mkdirSync(capturesFolder, { recursive: true });



// Function to get the current date as a string (YYYY-MM-DD)
function getDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const timestamp = new Date().toISOString().replace(/:/g, '-');
const imageFilename = `${timestamp}.jpg`;
const imagePath = path.join(capturesFolder, imageFilename);
// Function to send a Discord embed message with an image and a separate message
// Function to perform motion detection
function performMotionDetection() {
  // Capture an image from the camera
  Webcam.capture('current_frame', (err, data) => {
    if (err) {
      console.error('Failed to capture image:', err);
      return;
    }

    // Read the captured image
    fs.readFile(data, (err, frameData) => {
      if (err) {
        console.error('Failed to read captured image:', err);
        return;
      }

      // Check if motion is detected
      if (previousFrame) {
        const motionDetected = detectMotion(previousFrame, frameData);

        // If motion is detected
        if (motionDetected) {
          // Save the image
          fs.copyFile(data, imagePath, (err) => {
            if (err) {
              console.error('Failed to save image:', err);
            } else {
              console.log(`Motion detected! Image captured and saved as ${imagePath}`);
            }
          });
        }
      }

      // Set the current frame as the previous frame for the next iteration
      previousFrame = frameData;
    });
  });
}

// Function to detect motion by comparing two frames
function detectMotion(previousFrame, currentFrame) {
  // Convert the frame data to arrays of pixel values
  const previousPixels = Array.from(previousFrame);
  const currentPixels = Array.from(currentFrame);

  // Calculate the difference between the pixel values
  const pixelDifference = currentPixels.map((currentPixel, index) => {
    const previousPixel = previousPixels[index];
    return Math.abs(currentPixel - previousPixel);
  });

  // Calculate the total difference
  const totalDifference = pixelDifference.reduce((sum, difference) => sum + difference, 0);

  // Determine if motion is detected based on the total difference
  // You can adjust the threshold value as needed
  const threshold = 10000;
  return totalDifference > threshold;
}

// Start the motion detection loop
setInterval(performMotionDetection, 1500);

// Wait for a key press and then exit
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on('data', () => {
  process.exit();
});

import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

let poseLandmarker: PoseLandmarker | null = null;
let lastVideoTime = -1;

export const initializePoseDetection = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );
  
  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numPoses: 1
  });
  
  return poseLandmarker;
};

export interface PoseAnalysis {
  isCorrect: boolean;
  confidence: number;
  feedback: string;
}

// Simple pose validation based on key landmarks
export const analyzePose = (landmarks: any[]): PoseAnalysis => {
  if (!landmarks || landmarks.length === 0) {
    return {
      isCorrect: false,
      confidence: 0,
      feedback: "No pose detected"
    };
  }

  const pose = landmarks[0];
  
  // Check shoulder alignment (landmarks 11 and 12)
  const leftShoulder = pose[11];
  const rightShoulder = pose[12];
  
  if (!leftShoulder || !rightShoulder) {
    return {
      isCorrect: false,
      confidence: 0,
      feedback: "Pose incomplete"
    };
  }

  // Calculate shoulder alignment
  const shoulderDiff = Math.abs(leftShoulder.y - rightShoulder.y);
  const isAligned = shoulderDiff < 0.1; // Threshold for alignment
  
  // Check hip alignment (landmarks 23 and 24)
  const leftHip = pose[23];
  const rightHip = pose[24];
  const hipDiff = Math.abs(leftHip.y - rightHip.y);
  const hipsAligned = hipDiff < 0.1;
  
  const confidence = (isAligned && hipsAligned) ? 0.85 : 0.3;
  const isCorrect = confidence > 0.6;
  
  let feedback = "Great posture!";
  if (!isAligned) {
    feedback = "Align your shoulders";
  } else if (!hipsAligned) {
    feedback = "Align your hips";
  }
  
  return {
    isCorrect,
    confidence,
    feedback
  };
};

export const detectPoseFromVideo = async (
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
) => {
  if (!poseLandmarker) {
    await initializePoseDetection();
  }
  
  if (!poseLandmarker) return null;

  // Check if video is ready and playing
  if (video.readyState < 2 || video.paused) {
    return null;
  }

  const currentTime = performance.now();
  
  try {
    const results = poseLandmarker.detectForVideo(video, currentTime);
    
    // Always draw video frame and landmarks on canvas
    const canvasCtx = canvas.getContext('2d');
    if (canvasCtx) {
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      
      // ALWAYS draw the video frame to the canvas first
      canvasCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Then draw the pose landmarks on top if available
      if (results.landmarks && results.landmarks.length > 0) {
        const drawingUtils = new DrawingUtils(canvasCtx);
        for (const landmark of results.landmarks) {
          drawingUtils.drawLandmarks(landmark, {
            radius: 4,
            fillColor: '#2DD4BF',
            lineWidth: 2
          });
          drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS, {
            color: '#A78BFA',
            lineWidth: 3
          });
        }
      }
      canvasCtx.restore();
    }
    
    return results.landmarks;
  } catch (error) {
    console.error('Error detecting pose:', error);
    // Still try to draw the video even if detection fails
    const canvasCtx = canvas.getContext('2d');
    if (canvasCtx && video.readyState >= 2) {
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      canvasCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
    return null;
  }
};
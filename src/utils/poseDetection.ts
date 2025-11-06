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
  bodyPartFeedback: {
    part: string;
    message: string;
    position: { x: number; y: number };
    severity: 'error' | 'warning' | 'success';
  }[];
}

// Simple pose validation based on key landmarks
export const analyzePose = (landmarks: any[]): PoseAnalysis => {
  if (!landmarks || landmarks.length === 0) {
    return {
      isCorrect: false,
      confidence: 0,
      feedback: "No pose detected",
      bodyPartFeedback: []
    };
  }

  const pose = landmarks[0];
  const bodyPartFeedback: PoseAnalysis['bodyPartFeedback'] = [];
  
  // Check shoulder alignment (landmarks 11 and 12)
  const leftShoulder = pose[11];
  const rightShoulder = pose[12];
  
  if (!leftShoulder || !rightShoulder) {
    return {
      isCorrect: false,
      confidence: 0,
      feedback: "Pose incomplete",
      bodyPartFeedback: []
    };
  }

  // Calculate shoulder alignment - MORE LENIENT
  const shoulderDiff = Math.abs(leftShoulder.y - rightShoulder.y);
  const isAligned = shoulderDiff < 0.15; // Increased from 0.1
  
  if (!isAligned && shoulderDiff > 0.2) { // Only show feedback if really misaligned
    const shoulderMidpoint = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2
    };
    bodyPartFeedback.push({
      part: 'shoulders',
      message: leftShoulder.y > rightShoulder.y ? 'Raise left shoulder' : 'Raise right shoulder',
      position: shoulderMidpoint,
      severity: 'warning'
    });
  }
  
  // Check hip alignment - MORE LENIENT
  const leftHip = pose[23];
  const rightHip = pose[24];
  const hipDiff = Math.abs(leftHip.y - rightHip.y);
  const hipsAligned = hipDiff < 0.15; // Increased from 0.1
  
  if (!hipsAligned && hipDiff > 0.2) { // Only show feedback if really misaligned
    const hipMidpoint = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2
    };
    bodyPartFeedback.push({
      part: 'hips',
      message: leftHip.y > rightHip.y ? 'Raise left hip' : 'Raise right hip',
      position: hipMidpoint,
      severity: 'warning'
    });
  }
  
  // Check arm extension - LESS STRICT
  const leftElbow = pose[13];
  const leftWrist = pose[15];
  if (leftShoulder && leftElbow && leftWrist) {
    const armAngle = Math.atan2(leftWrist.y - leftElbow.y, leftWrist.x - leftElbow.x);
    const shoulderElbowAngle = Math.atan2(leftElbow.y - leftShoulder.y, leftElbow.x - leftShoulder.x);
    const totalAngle = Math.abs(armAngle - shoulderElbowAngle);
    
    if (totalAngle < 2.0) { // More lenient - was 2.5
      bodyPartFeedback.push({
        part: 'left_arm',
        message: 'Extend left arm more',
        position: leftElbow,
        severity: 'warning'
      });
    }
  }
  
  // Check right arm extension - LESS STRICT
  const rightElbow = pose[14];
  const rightWrist = pose[16];
  if (rightShoulder && rightElbow && rightWrist) {
    const armAngle = Math.atan2(rightWrist.y - rightElbow.y, rightWrist.x - rightElbow.x);
    const shoulderElbowAngle = Math.atan2(rightElbow.y - rightShoulder.y, rightElbow.x - rightShoulder.x);
    const totalAngle = Math.abs(armAngle - shoulderElbowAngle);
    
    if (totalAngle < 2.0) { // More lenient
      bodyPartFeedback.push({
        part: 'right_arm',
        message: 'Extend right arm more',
        position: rightElbow,
        severity: 'warning'
      });
    }
  }
  
  // MUCH MORE GENEROUS SCORING
  const confidence = (isAligned && hipsAligned && bodyPartFeedback.length === 0) ? 0.95 : 
                     (isAligned && hipsAligned) ? 0.85 :
                     (isAligned || hipsAligned) ? 0.70 : 0.55;
  const isCorrect = confidence > 0.5; // Lowered from 0.6
  
  let feedback = "Great posture!";
  if (bodyPartFeedback.length > 0) {
    feedback = `Adjust ${bodyPartFeedback.length} area${bodyPartFeedback.length > 1 ? 's' : ''}`;
  }
  
  return {
    isCorrect,
    confidence,
    feedback,
    bodyPartFeedback
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

  const canvasCtx = canvas.getContext('2d');
  if (!canvasCtx) return null;

  // ALWAYS draw the video frame first, regardless of readyState
  try {
    if (video.readyState >= 2 && !video.paused) {
      // Set canvas dimensions to match video
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
      }

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw the video frame
      canvasCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Try pose detection
      const currentTime = performance.now();
      const results = poseLandmarker.detectForVideo(video, currentTime);
      
      // Draw pose landmarks if available
      if (results.landmarks && results.landmarks.length > 0) {
        const drawingUtils = new DrawingUtils(canvasCtx);
        for (const landmark of results.landmarks) {
          drawingUtils.drawLandmarks(landmark, {
            radius: 3,
            fillColor: 'rgba(34, 197, 94, 0.7)',
            lineWidth: 1
          });
          drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS, {
            color: 'rgba(34, 197, 94, 0.4)',
            lineWidth: 2
          });
        }
        
        canvasCtx.restore();
        return { landmarks: results.landmarks, worldLandmarks: results.worldLandmarks };
      }
      
      canvasCtx.restore();
    }
  } catch (error) {
    console.error('Error detecting pose:', error);
  }
  
  return null;
};
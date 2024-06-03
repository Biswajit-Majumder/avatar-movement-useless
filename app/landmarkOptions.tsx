let runningMode: "IMAGE" | "VIDEO" = "IMAGE";
export const faceLandMarkerOptions = {
  baseOptions: {
    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
    delegate: "GPU",
  },
  numFaces: 1,
  runningMode,
  minTrackingConfidence: 0.5,
  outputFaceBlendshapes: true,
  minFacePresenceConfidence: 0.5,
  minFaceDetectionConfidence: 0.5,
  outputFacialTransformationMatrixes: true,
};

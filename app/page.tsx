"use client";
import Image from "next/image";
import styles from "./page.module.css";
import { Suspense, use, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useGraph } from "@react-three/fiber";
import { useGLTF, OrbitControls, Facemesh } from "@react-three/drei";
import { Color, Euler, Matrix4, Object3D, Object3DEventMap } from "three";
import {
  FaceLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";
import { avatarObject } from "./avatarStack";
// import Avatar from "./avatar";

// import {faceLandMarkerOptions }from "./landmarkOptions";
// import PermissionNotGiven from "./takepermission";
// link
// https://models.readyplayer.me/66538aeb51f645a816bc6676.glb

/**
 *  female character
 *  https://models.readyplayer.me/665a18a7dd37bca36d9b8e6e.glb
 *
 *
 *
 *
 *
 *
 */

/*
what are facial blend shaped score (values) ?


*/

let faceLandmarker: FaceLandmarker;
let lastVideoTime = 0;
let blendshapes: any[] = [];
// let headMesh: Object3D<Object3DEventMap>[] = [];
let headMesh: any[] = [];
let rotation: Euler;

function Avatar() {
  const { scene } = useGLTF(avatarObject[1].url);
  // const nothing = useGLTF(avatarObject[3].url);
  const something = useGLTF(avatarObject[0].url);
  console.log("scene", scene);
  console.log("something", something);
  const { nodes } = useGraph(scene);

  useEffect(() => {
    if (nodes.Wolf3D_Head) headMesh.push(nodes.Wolf3D_Head);
    if (nodes.Wolf3D_Teeth) headMesh.push(nodes.Wolf3D_Teeth);
    if (nodes.Wolf3D_Beard) headMesh.push(nodes.Wolf3D_Beard);
    if (nodes.Wolf3D_Avatar) headMesh.push(nodes.Wolf3D_Avatar);
    if (nodes.Wolf3D_Head_Custom) headMesh.push(nodes.Wolf3D_Head_Custom);
  }, []);

  useFrame(() => {
    if (blendshapes.length > 0) {
      blendshapes.forEach(
        (element: { categoryName: string | number; score: any }) => {
          headMesh.forEach((mesh) => {
            let index = mesh.morphTargetDictionary[element.categoryName];
            if (index >= 0) {
              mesh.morphTargetInfluences[index] = element.score;
            }
          });
        }
      );

      nodes.Head.rotation.set(rotation.x, rotation.y, rotation.z);
      nodes.Neck.rotation.set(
        rotation.x / 5 + 0.3,
        rotation.y / 5,
        rotation.z / 5
      );
      nodes.Spine2.rotation.set(
        rotation.x / 10,
        rotation.y / 10,
        rotation.z / 10
      );
    }
  });

  return <primitive object={scene} position={[0, -1.63, 0]} />;
}

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(undefined!);
  const canvasElementRef = useRef<HTMLCanvasElement>();
  let [isPermissionGranted, setIsPermissionGranted] = useState(false);
  let canvasCtx;
  if (canvasElementRef.current) {
    canvasCtx = canvasElementRef.current.getContext(
      // "WebGL2RenderingContext"
      "2d"
    );
  }
  // const drawingUtils = new DrawingUtils(canvasCtx);

  // setting up the video configarations
  async function videoSetup() {
    const filesetResolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );
    faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
        delegate: "GPU",
      },
      numFaces: 1,
      runningMode: "VIDEO",
      minTrackingConfidence: 0.5,
      outputFaceBlendshapes: true,
      minFacePresenceConfidence: 0.5,
      minFaceDetectionConfidence: 0.5,
      outputFacialTransformationMatrixes: true,
    });
    navigator.mediaDevices
      .getUserMedia({
        video: { width: 1280, height: 720 },
        audio: false,
      })
      .then((stream) => {
        if (videoRef != null || undefined) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener("loadeddata", predict);
        }
      })
      .catch((DOMException) => {
        // isPermissionGranted = true;
        console.log("The user haven't allowed to access webcam");
      })
      .catch((error) => {
        console.log("The error is this", error);
      });
  }

  /*

      here I'm facing the any problem --- right now not that important 
      will check it later I think have to give faceLandmarker proper type

      sun 2 June 2024 - 04:07 fixed it.

    */
  async function predict() {
    let currentTime = Date.now();
    if (lastVideoTime !== videoRef.current.currentTime) {
      lastVideoTime = videoRef.current.currentTime;
      const faceLandmarkerResult = faceLandmarker.detectForVideo(
        videoRef.current,
        currentTime
      );

      if (
        faceLandmarkerResult.faceBlendshapes &&
        faceLandmarkerResult.faceBlendshapes.length > 0 &&
        faceLandmarkerResult.faceBlendshapes[0].categories
      ) {
        blendshapes = faceLandmarkerResult.faceBlendshapes[0].categories;

        const matrix = new Matrix4().fromArray(
          faceLandmarkerResult.facialTransformationMatrixes![0].data
        );
        rotation = new Euler().setFromRotationMatrix(matrix);
      }
    }

    window.requestAnimationFrame(predict);
  }

  useEffect(() => {
    videoSetup();
  }, []);
  return (
    <div style={{ width: "100%", height: "100vh" }}>
      {/* I don't what the thing is this doing I have to check it later */}
      <div>
        <video ref={videoRef} autoPlay className="video-tag" />
        {/* <canvas ref={canvasElementRef} className="special-canvas"></canvas> */}
      </div>
      {/* <Stats showPanel={0} className="stats" /> */}

      <Canvas id="canvas" camera={{ fov: 15, position: [0, 0, 1.7] }} shadows>
        <OrbitControls
          enableDamping={true}
          target={[0, 0, 0]}
          position={[0, 1, 0]}
          enablePan={false}
          enableZoom={false}
          maxPolarAngle={Math.PI / 2}
        />
        <ambientLight intensity={1.1} />
        <pointLight
          position={[10, 10, 10]}
          color={new Color(1, 1, 0)}
          intensity={0.5}
          castShadow
        />
        <pointLight
          position={[-10, 0, 10]}
          color={new Color(1, 0, 0)}
          intensity={1}
          castShadow
        />
        <pointLight position={[0, 0.65, 0]} intensity={1} />
        <pointLight position={[0, 0, 10]} intensity={0.5} castShadow />
        <Suspense fallback={"Loading"}>
          <Avatar />
        </Suspense>
      </Canvas>
    </div>
  );
}

// what does await do ?

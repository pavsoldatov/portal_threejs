import "./style.css";
import * as dat from "lil-gui";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

import firefliesVertex from "./shaders/fireflies/vertex.glsl";
import firefliesFragment from "./shaders/fireflies/fragment.glsl";

import portalVertex from "./shaders/portal/vertex.glsl";
import portalFragment from "./shaders/portal/fragment.glsl";

/**
 * Base
 */
// Debug
const debugObject = {};
const gui = new dat.GUI({
  width: 400,
});

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader();

// Draco loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("draco/");

// GLTF loader
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

/**
 * Textures
 */
const bakedTexture = textureLoader.load("/baked.jpg");
bakedTexture.flipY = false;
bakedTexture.encoding = THREE.sRGBEncoding;

/**
 * Materials
 */
// Baked material
const bakedMaterial = new THREE.MeshBasicMaterial({
  map: bakedTexture,
});
// Pole light material
const poleLightMaterial = new THREE.MeshBasicMaterial({ color: "#FFE692" });

debugObject.portalColorStart = "#ffc5d9";
debugObject.portalColorEnd = "#ffffff";

gui.addColor(debugObject, "portalColorStart").onChange(() => {
  portalMaterial.uniforms.uColorStart.value.set(debugObject.portalColorStart);
});
gui.addColor(debugObject, "portalColorEnd").onChange(() => {
  portalMaterial.uniforms.uColorEnd.value.set(debugObject.portalColorEnd);
});

const portalMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uColorStart: { value: new THREE.Color(0xffc5d9) },
    uColorEnd: { value: new THREE.Color(0xffffff) },
  },
  vertexShader: portalVertex,
  fragmentShader: portalFragment,
});

/**
 * Model
 */
gltfLoader.load("portal.glb", (gltf) => {
  const bakedMesh = gltf.scene.children.find((child) => {
    return child.name === "Merged";
  });
  const poleLightA = gltf.scene.children.find((child) => {
    return child.name === "PoleLightA";
  });
  const poleLightB = gltf.scene.children.find((child) => {
    return child.name === "PoleLightB";
  });
  const portalLight = gltf.scene.children.find((child) => {
    return child.name === "PortalLight";
  });

  bakedMesh.material = bakedMaterial;
  poleLightA.material = poleLightMaterial;
  poleLightB.material = poleLightMaterial;
  portalLight.material = portalMaterial;

  scene.add(gltf.scene);
});

/**
 * Fireflies
 */
const firefliesGeometry = new THREE.BufferGeometry();
const firefliesCount = 30;
const positions = new Float32Array(firefliesCount * 3);
const scalingFactors = new Float32Array(firefliesCount);

for (let i = 0; i < firefliesCount; i++) {
  positions[i * 3] = (Math.random() - 0.5) * 4; // x
  positions[i * 3 + 1] = Math.random() * 2; // y
  positions[i * 3 + 2] = (Math.random() - 0.5) * 4; // z

  scalingFactors[i] = THREE.MathUtils.randFloat(0.25, 1.0);
}

firefliesGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positions, 3)
);
firefliesGeometry.setAttribute(
  "aScale",
  new THREE.BufferAttribute(scalingFactors, 1)
);

// Material
const firefliesMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    uSize: { value: 100 },
    uBounceSpeed: { value: 1 },
  },
  vertexShader: firefliesVertex,
  fragmentShader: firefliesFragment,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

debugObject.fireflySize = 100;
gui
  .add(debugObject, "fireflySize")
  .min(10)
  .max(400)
  .step(1)
  .name("Firefly size")
  .onChange(() => {
    firefliesMaterial.uniforms.uSize.value = debugObject.fireflySize;
  });

debugObject.fireflyBounceSpeed = 1;
gui
  .add(debugObject, "fireflyBounceSpeed")
  .min(0.1)
  .max(4)
  .step(0.01)
  .name("Bounce speed")
  .onChange(() => {
    firefliesMaterial.uniforms.uBounceSpeed.value =
      debugObject.fireflyBounceSpeed;
  });

// Points
const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial);
scene.add(fireflies);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Update fireflies
  firefliesMaterial.uniforms.uPixelRatio.value = Math.min(
    window.devicePixelRatio,
    2
  );
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  45,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.x = 4;
camera.position.y = 2;
camera.position.z = 4;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

debugObject.clearColor = "#0a100e";
renderer.setClearColor(debugObject.clearColor);

gui.addColor(debugObject, "clearColor").name("Environment color");
gui.onChange(() => {
  renderer.setClearColor(debugObject.clearColor);
});

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update movement
  firefliesMaterial.uniforms.uTime.value = elapsedTime;
  portalMaterial.uniforms.uTime.value = elapsedTime;

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "dat.gui";
import galaxyVertexShader from "./shaders/galaxy/vertex.glsl";
import galaxyFragmentShader from "./shaders/galaxy/fragment.glsl";

/**
 * Base
 */
// Debug
const gui = new dat.GUI({ width: 400 });

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Galaxy
const parameters = {
	count: 100000,
	// size: 0.01,
	radius: 5,
	branches: 3,
	// spin: 1,
	randomness: 0.2,
	randomnessPower: 3,
	insideColor: "#ff6030",
	outsideColor: "#1b3984",
};

let particleGeometry = null;
let particleMaterial = null;
let particle = null;

const generateGalaxy = () => {
	if (particle !== null) {
		particleGeometry.dispose();
		particleMaterial.dispose();
		scene.remove(particle);
	}

	particleGeometry = new THREE.BufferGeometry();
	const positions = new Float32Array(parameters.count * 3);
	const colors = new Float32Array(parameters.count * 3);
	const scales = new Float32Array(parameters.count);
	const randomness = new Float32Array(parameters.count * 3);

	const colorInside = new THREE.Color(parameters.insideColor);
	const colorOutside = new THREE.Color(parameters.outsideColor);

	for (let i = 0; i < parameters.count; i++) {
		const i3 = i * 3;

		/**
		 * Position
		 *
		 * Get particles modulo according to branches (default 3 branches)
		 * then divide by branches to get a limit between 0 and 0.66
		 * then multiply by 2PI to get radian value and set values in circle
		 * then set branches in right axis and multiply by radius to have particles lines
		 */

		const radius = Math.random() * parameters.radius;
		const branchAngle =
			((i % parameters.branches) / parameters.branches) * Math.PI * 2;
		// const spinAngle = parameters.spin * radius;

		// Randomness
		// We need to spread stars on the outside and more condensed star on the inside.
		const randomX =
			Math.pow(Math.random(), parameters.randomnessPower) *
			(Math.random() < 0.5 ? 1 : -1) *
			parameters.randomness *
			radius;
		const randomY =
			Math.pow(Math.random(), parameters.randomnessPower) *
			(Math.random() < 0.5 ? 1 : -1) *
			parameters.randomness *
			radius;
		const randomZ =
			Math.pow(Math.random(), parameters.randomnessPower) *
			(Math.random() < 0.5 ? 1 : -1) *
			parameters.randomness *
			radius;

		randomness[i3 + 0] = randomX;
		randomness[i3 + 1] = randomY;
		randomness[i3 + 2] = randomZ;

		// positions[i3] = Math.cos(branchAngle + spinAngle) * radius;
		positions[i3] = Math.cos(branchAngle) * radius;
		positions[i3 + 1] = 0;
		// positions[i3 + 1] = randomY;
		// positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius;
		positions[i3 + 2] = Math.sin(branchAngle) * radius;

		// Color
		const mixedColor = colorInside.clone();
		mixedColor.lerp(colorOutside, radius / parameters.radius);

		colors[i3] = mixedColor.r;
		colors[i3 + 1] = mixedColor.g;
		colors[i3 + 2] = mixedColor.b;

		scales[i] = Math.random();
	}

	particleGeometry.setAttribute(
		"position",
		new THREE.BufferAttribute(positions, 3)
	);
	particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
	particleGeometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
	particleGeometry.setAttribute(
		"aRandomness",
		new THREE.BufferAttribute(randomness, 3)
	);

	// particleMaterial = new THREE.PointsMaterial({
	//   size: parameters.size,
	//   sizeAttenuation: false,
	//   depthWrite: false,
	//   blending: THREE.AdditiveBlending,
	//   vertexColors: true,
	// });

	particleMaterial = new THREE.ShaderMaterial({
		depthWrite: false,
		blending: THREE.AdditiveBlending,
		vertexColors: true,
		vertexShader: galaxyVertexShader,
		fragmentShader: galaxyFragmentShader,
		uniforms: {
			uSize: { value: 30 * renderer.getPixelRatio() },
			uTime: { value: 0 },
		},
	});

	particle = new THREE.Points(particleGeometry, particleMaterial);
	scene.add(particle);
};

gui
	.add(parameters, "count")
	.min(100)
	.max(200000)
	.step(100)
	.onFinishChange(generateGalaxy);
// gui
//   .add(parameters, "size")
//   .min(0.001)
//   .max(0.1)
//   .step(0.001)
//   .onFinishChange(generateGalaxy);
gui
	.add(parameters, "radius")
	.min(0.01)
	.max(20)
	.step(0.01)
	.onFinishChange(generateGalaxy);
gui
	.add(parameters, "branches")
	.min(3)
	.max(20)
	.step(1)
	.onFinishChange(generateGalaxy);
// gui
//   .add(parameters, "spin")
//   .min(-5)
//   .max(5)
//   .step(0.001)
//   .onFinishChange(generateGalaxy);
gui
	.add(parameters, "randomness")
	.min(0)
	.max(2)
	.step(0.001)
	.onFinishChange(generateGalaxy);
gui
	.add(parameters, "randomnessPower")
	.min(1)
	.max(10)
	.step(0.001)
	.onFinishChange(generateGalaxy);
gui.addColor(parameters, "insideColor").onFinishChange(generateGalaxy);
gui.addColor(parameters, "outsideColor").onFinishChange(generateGalaxy);

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
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
	75,
	sizes.width / sizes.height,
	0.1,
	100
);
camera.position.x = 3;
camera.position.y = 3;
camera.position.z = 3;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

generateGalaxy();

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
	const elapsedTime = clock.getElapsedTime();

	// Animate
	particleMaterial.uniforms.uTime.value = elapsedTime;
	// Update controls
	controls.update();

	// Render
	renderer.render(scene, camera);

	// Call tick again on the next frame
	window.requestAnimationFrame(tick);
};

tick();

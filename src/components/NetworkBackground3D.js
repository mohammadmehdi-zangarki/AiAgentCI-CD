import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const NetworkBackground3D = () => {
    const containerRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const particlesRef = useRef(null);
    const linesRef = useRef(null);
    const frameRef = useRef(null);

    useEffect(() => {
        // Scene setup
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // Camera setup
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 20;
        camera.position.y = 10;
        cameraRef.current = camera;

        // Renderer setup with optimized settings
        const renderer = new THREE.WebGLRenderer({
            antialias: false,
            alpha: true,
            powerPreference: "high-performance"
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Controls setup
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.rotateSpeed = 0.5;
        controls.enableZoom = false;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.3;
        controls.enablePan = false;

        // Create particles with optimized count
        const particlesGeometry = new THREE.BufferGeometry();
        const particleCount = 150; // Reduced particle count
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            const radius = 15;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);

            // Create a gradient from blue to purple
            colors[i * 3] = 0.2 + Math.random() * 0.2;     // R
            colors[i * 3 + 1] = 0.5 + Math.random() * 0.3; // G
            colors[i * 3 + 2] = 0.8 + Math.random() * 0.2; // B

            sizes[i] = Math.random() * 2 + 1;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // Optimized shader material
        const particlesMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pixelRatio: { value: renderer.getPixelRatio() }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                uniform float time;
                
                void main() {
                    vColor = color;
                    vec3 pos = position;
                    // Reduced movement amplitude
                    pos.x += sin(time + position.y) * 0.2;
                    pos.y += cos(time + position.x) * 0.2;
                    pos.z += sin(time + position.x) * 0.2;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (200.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                
                void main() {
                    vec2 xy = gl_PointCoord.xy - vec2(0.5);
                    float ll = length(xy);
                    if (ll > 0.5) discard;
                    
                    float alpha = 0.7 * smoothstep(0.5, 0.2, ll);
                    gl_FragColor = vec4(vColor, alpha);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particles);
        particlesRef.current = particles;

        // Optimized lines material
        const linesMaterial = new THREE.LineBasicMaterial({
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.3
        });

        const linesGroup = new THREE.Group();
        scene.add(linesGroup);
        linesRef.current = linesGroup;

        // Pre-allocate arrays for line calculations
        const linePositions = new Float32Array(6);
        const lineColors = new Float32Array(6);
        const lineGeometry = new THREE.BufferGeometry();
        lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
        lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

        // Animation function with optimized calculations
        let lastLineUpdate = 0;
        const LINE_UPDATE_INTERVAL = 100; // Update lines every 100ms

        const animate = () => {
            frameRef.current = requestAnimationFrame(animate);

            const time = Date.now();
            particlesMaterial.uniforms.time.value = time * 0.001;

            // Update lines less frequently
            if (time - lastLineUpdate > LINE_UPDATE_INTERVAL) {
                // Clear previous lines
                while(linesGroup.children.length > 0) {
                    linesGroup.remove(linesGroup.children[0]);
                }

                const positions = particles.geometry.attributes.position.array;
                const colors = particles.geometry.attributes.color.array;

                // Optimized line creation with spatial partitioning
                for (let i = 0; i < positions.length; i += 9) {
                    for (let j = i + 3; j < positions.length; j += 9) {
                        const dx = positions[i] - positions[j];
                        const dy = positions[i + 1] - positions[j + 1];
                        const dz = positions[i + 2] - positions[j + 2];
                        const distanceSq = dx * dx + dy * dy + dz * dz;

                        if (distanceSq < 30) {
                            linePositions[0] = positions[i];
                            linePositions[1] = positions[i + 1];
                            linePositions[2] = positions[i + 2];
                            linePositions[3] = positions[j];
                            linePositions[4] = positions[j + 1];
                            linePositions[5] = positions[j + 2];

                            lineColors[0] = colors[i];
                            lineColors[1] = colors[i + 1];
                            lineColors[2] = colors[i + 2];
                            lineColors[3] = colors[j];
                            lineColors[4] = colors[j + 1];
                            lineColors[5] = colors[j + 2];

                            lineGeometry.attributes.position.needsUpdate = true;
                            lineGeometry.attributes.color.needsUpdate = true;

                            const line = new THREE.Line(lineGeometry.clone(), linesMaterial);
                            linesGroup.add(line);
                        }
                    }
                }

                lastLineUpdate = time;
            }

            controls.update();
            renderer.render(scene, camera);
        };

        animate();

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            particlesMaterial.uniforms.pixelRatio.value = Math.min(window.devicePixelRatio, 2);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
            if (containerRef.current && rendererRef.current) {
                containerRef.current.removeChild(rendererRef.current.domElement);
            }
            scene.clear();
            renderer.dispose();
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-0"
            style={{
                background: 'radial-gradient(circle at center, #1a1a2e 0%, #0a0a1a 100%)',
            }}
        />
    );
};

export default NetworkBackground3D;
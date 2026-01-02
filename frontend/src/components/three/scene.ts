import * as t from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function createScene(container: HTMLElement) {
    const scene = new t.Scene();
    const width = container.clientWidth;
    const height = container.clientHeight;

    const camera = new t.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 4;

    const renderer = new t.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enableZoom = false; 
    controls.enableRotate = true; 

    // --- 1. CRAZY GEOMETRY: The Torus Knot ---
    // A complex, interlaced knot instead of a cube
    const geometry = new t.TorusKnotGeometry(1, 0.4, 200, 32);
    
    // --- 2. CRAZY MATERIAL: Iridescent Glass ---
    const material = new t.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 1,
        roughness: 0.2,
        transmission: 0.5, 
        thickness: 2,
        iridescence: 2,
        iridescenceIOR: 2.5,
        sheen: 1,
        sheenColor: 0x00ffff,
    });

    const knot = new t.Mesh(geometry, material);
    scene.add(knot);

    // --- 3. BACKGROUND PARTICLES (Starfield) ---
    const particlesGeometry = new t.BufferGeometry();
    const count = 5000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 20;
    }
    particlesGeometry.setAttribute('position', new t.BufferAttribute(positions, 3));
    const particlesMaterial = new t.PointsMaterial({ size: 0.02, color: 0xffffff });
    const points = new t.Points(particlesGeometry, particlesMaterial);
    scene.add(points);

    // --- 4. MULTI-COLOR LIGHTING ---
    const lights = [
        { color: 0x00ff00, pos: [5, 5, 5] as [number, number, number] },
        { color: 0xff00ff, pos: [-5, -5, 5] as [number, number, number] },
        { color: 0x00ffff, pos: [0, 5, -5] as [number, number, number] }
    ].map(l => {
        const pl = new t.PointLight(l.color, 50, 20);
        pl.position.set(l.pos[0], l.pos[1], l.pos[2]);
        scene.add(pl);
        return pl;
    });

    // Animation variables
    let clock = new t.Clock();

    function animate() {
        const elapsedTime = clock.getElapsedTime();
        requestAnimationFrame(animate);

        // Morph the geometry
        knot.rotation.x = elapsedTime * 0.5;
        knot.rotation.y = elapsedTime * 0.3;
        

        // Shift background particles
        points.rotation.y = elapsedTime * 0.05;

        // Change light intensity dynamically
        lights.forEach((light, i) => {
            light.intensity = 40 + Math.sin(elapsedTime + i) * 20;
        });

        controls.update();
        renderer.render(scene, camera);
    }

    animate();

    return () => {
        controls.dispose();
        renderer.dispose();
        geometry.dispose();
        material.dispose();
        particlesGeometry.dispose();
        particlesMaterial.dispose();
        container.removeChild(renderer.domElement);
    }
}
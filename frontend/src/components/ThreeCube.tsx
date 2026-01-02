import React, { useEffect, useRef } from 'react';
import { createScene } from './three/scene';

export function ThreeCube() {
    const mountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mountRef.current) return;

        const cleanup = createScene(mountRef.current);

        return () => {
            cleanup();
        };
    }, []);

    return <div ref={mountRef} className="w-full h-[300px] rounded-md overflow-hidden border bg-black" />;
}

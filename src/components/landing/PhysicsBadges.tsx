"use client";

import { useEffect, useRef, useState } from "react";
import Matter, { Engine, Render, World, Bodies, Composite, Mouse, MouseConstraint, Runner, Events, Body } from "matter-js";

const BADGES = [
    { text: "All Systems Operational", status: "success", w: 220, h: 40 },
    { text: "incident: 0", status: "success", w: 140, h: 40 },
    { text: "Avg Res: 24ms", status: "neutral", w: 140, h: 40 },
    { text: "Database High Load", status: "warning", w: 180, h: 40 },
    { text: "API Gateway 502", status: "error", w: 160, h: 40 },
];

export function PhysicsBadges() {
    const sceneRef = useRef<HTMLDivElement>(null);
    const badgeRefs = useRef<(HTMLDivElement | null)[]>([]);
    const engineRef = useRef<Matter.Engine | null>(null);
    const runnerRef = useRef<Matter.Runner | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Wait for layout to be stable
    useEffect(() => {
        if (!sceneRef.current) return;

        const observer = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;
            if (width > 0 && height > 0) {
                setTimeout(() => setIsReady(true), 200);
            }
        });

        observer.observe(sceneRef.current);
        return () => observer.disconnect();
    }, []);

    // Global pointer up listener to stop dragging state
    useEffect(() => {
        const handlePointerUp = () => setIsDragging(false);
        window.addEventListener('pointerup', handlePointerUp);
        return () => window.removeEventListener('pointerup', handlePointerUp);
    }, []);

    useEffect(() => {
        if (!isReady || !sceneRef.current) return;

        // Cleanup
        if (engineRef.current) {
            Matter.World.clear(engineRef.current.world, false);
            Matter.Engine.clear(engineRef.current);
            if (runnerRef.current) Matter.Runner.stop(runnerRef.current);
        }

        const Engine = Matter.Engine,
            Runner = Matter.Runner,
            Bodies = Matter.Bodies,
            Composite = Matter.Composite,
            Mouse = Matter.Mouse,
            MouseConstraint = Matter.MouseConstraint;

        const engine = Engine.create({
            positionIterations: 10,
            velocityIterations: 10,
        });
        const world = engine.world;
        engineRef.current = engine;

        // Zero gravity for floating effect
        engine.gravity.y = 0;
        engine.gravity.x = 0;

        const width = sceneRef.current.clientWidth;
        const height = sceneRef.current.clientHeight;

        // --- Boundaries ---
        // Thick walls to prevent tunneling
        const wallThick = 200;
        const wallOptions = { isStatic: true, render: { visible: false } };

        // Navbar protection: Push top wall down. 
        const NAVBAR_HEIGHT = 80;

        const ground = Bodies.rectangle(width / 2, height + wallThick / 2, width, wallThick, wallOptions);
        const ceiling = Bodies.rectangle(width / 2, -wallThick / 2 + NAVBAR_HEIGHT, width, wallThick, wallOptions);
        const leftWall = Bodies.rectangle(-wallThick / 2, height / 2, wallThick, height, wallOptions);
        const rightWall = Bodies.rectangle(width + wallThick / 2, height / 2, wallThick, height, wallOptions);

        Composite.add(world, [ground, ceiling, leftWall, rightWall]);

        // --- Badges ---
        const badgeBodies = BADGES.map((badge, i) => {
            const isLeft = i % 2 === 0;
            const xOffset = width * 0.15;
            let startX = isLeft ? xOffset : width - xOffset;
            const startY = height * (0.25 + (i * 0.15));

            return Bodies.rectangle(startX, startY, badge.w, badge.h, {
                restitution: 0.8, // Bouncy
                frictionAir: 0.01, // Lower friction for "swing" feel
                density: 0.004, // Heavier for better momentum/inertia
                chamfer: { radius: 20 },
                render: { visible: false }
            });
        });

        Composite.add(world, badgeBodies);

        // --- Auto-Leveling Logic ---
        // Gently rotate badges back to 0 degrees to simulate "stability"
        Matter.Events.on(engine, 'beforeUpdate', () => {
            badgeBodies.forEach(body => {
                // Tweak this stiffness for faster/slower leveling
                // 0.005 is very subtle, 0.05 is springy
                const uprightStiffness = 0.005;

                // Apply torque to push angle towards 0
                // body.torque += -body.angle * uprightStiffness; // Direct torque accumulation

                // For more stability, we can manipulate angular velocity directly if torque struggles
                // But strictly physical approach is torque.
                // Let's rely on standard physics first.
                body.torque -= body.angle * uprightStiffness;

                // Also dampen angular velocity specifically to stop endless oscillation
                Body.setAngularVelocity(body, body.angularVelocity * 0.95);
            });
        });

        // --- Mouse ---
        const mouse = Mouse.create(sceneRef.current);
        const mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2, // Tighter control to prevent dropping on fast drags
                damping: 0.05,
                render: { visible: false }
            }
        });

        // Fix scroll issue: Remove Matter.js interactions that block scrolling
        (mouseConstraint.mouse as any).element.removeEventListener("mousewheel", (mouseConstraint.mouse as any).mousewheel);
        (mouseConstraint.mouse as any).element.removeEventListener("DOMMouseScroll", (mouseConstraint.mouse as any).mousewheel);

        // Important: Reset touch-action on the container so page scrolling works on mobile/touch
        // Matter.js sets this to 'none' by default. 'pan-y' allows vertical scrolling.
        sceneRef.current.style.touchAction = 'pan-y';

        Composite.add(world, mouseConstraint);

        const runner = Runner.create();
        runnerRef.current = runner;
        Runner.run(runner, engine);

        // --- Render Loop ---
        let animationFrameId: number;

        const updateDOM = () => {
            badgeBodies.forEach((body, index) => {
                const domNode = badgeRefs.current[index];
                if (domNode) {
                    const { x, y } = body.position;
                    // Sanity check coordinates
                    if (!Number.isNaN(x) && !Number.isNaN(y)) {
                        const angle = body.angle;
                        domNode.style.transform = `translate(${x - BADGES[index].w / 2}px, ${y - BADGES[index].h / 2}px) rotate(${angle}rad)`;
                        if (domNode.style.opacity !== '1') domNode.style.opacity = '1';
                    }
                }
            });
            animationFrameId = requestAnimationFrame(updateDOM);
        };

        updateDOM();

        return () => {
            cancelAnimationFrame(animationFrameId);
            if (runnerRef.current) Runner.stop(runnerRef.current);
            if (engineRef.current) {
                Matter.World.clear(engineRef.current.world, false);
                Matter.Engine.clear(engineRef.current);
            }
        };
    }, [isReady]);

    // Dynamic pointer events: 'none' by default (for scroll), 'auto' while dragging (for robust physics)
    return (
        <div
            ref={sceneRef}
            className={`absolute inset-0 z-40 overflow-hidden ${isDragging ? 'pointer-events-auto cursor-grabbing' : 'pointer-events-none'}`}
        >
            {BADGES.map((badge, i) => (
                <div
                    key={i}
                    ref={(el) => { badgeRefs.current[i] = el }}
                    onPointerDown={() => setIsDragging(true)}
                    // Badges: pointer-events-auto rectifies this so badges CAN be clicked/dragged
                    // touch-action-none on badgse specifically to prevent scroll WHEN dragging a badge
                    className={`absolute top-0 left-0 flex items-center justify-center gap-2 px-4 py-2 rounded-full border backdrop-blur-md shadow-lg select-none cursor-grab active:cursor-grabbing will-change-transform z-50 pointer-events-auto touch-none
                        ${badge.status === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : ''}
                        ${badge.status === 'neutral' ? 'bg-zinc-500/10 border-zinc-500/20 text-zinc-500 dark:text-zinc-400' : ''}
                        ${badge.status === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : ''}
                        ${badge.status === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' : ''}
                    `}
                    style={{
                        width: badge.w,
                        height: badge.h,
                        opacity: 0,
                        position: 'absolute',
                        transform: 'translate(-999px, -999px)'
                    }}
                >
                    <div className={`size-2 rounded-full ${badge.status === 'success' ? 'bg-green-500' :
                        badge.status === 'warning' ? 'bg-amber-500' :
                            badge.status === 'error' ? 'bg-red-500' :
                                'bg-zinc-400'
                        }`} />
                    <span className="text-xs font-bold font-mono uppercase tracking-wider whitespace-nowrap">{badge.text}</span>
                </div>
            ))}
        </div>
    );
}

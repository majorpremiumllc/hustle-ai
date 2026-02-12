"use client";
import { useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";

/**
 * ScrollReveal — wraps children with fade + slide + blur entrance.
 * @param {string} direction - "up" | "left" | "right" | "scale"
 * @param {number} delay - seconds
 * @param {number} stagger - seconds between children (if using stagger mode)
 */
export default function ScrollReveal({
    children,
    direction = "up",
    delay = 0,
    duration = 0.7,
    className = "",
    as = "div",
    once = true,
}) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once, margin: "0px 0px -60px 0px" });

    const variants = {
        up: { hidden: { opacity: 0, y: 18, filter: "blur(10px)" }, visible: { opacity: 1, y: 0, filter: "blur(0px)" } },
        left: { hidden: { opacity: 0, x: -30, filter: "blur(8px)" }, visible: { opacity: 1, x: 0, filter: "blur(0px)" } },
        right: { hidden: { opacity: 0, x: 30, filter: "blur(8px)" }, visible: { opacity: 1, x: 0, filter: "blur(0px)" } },
        scale: { hidden: { opacity: 0, scale: 0.92, filter: "blur(10px)" }, visible: { opacity: 1, scale: 1, filter: "blur(0px)" } },
    };

    const v = variants[direction] || variants.up;
    const MotionTag = motion[as] || motion.div;

    return (
        <MotionTag
            ref={ref}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={v}
            transition={{
                duration,
                delay,
                ease: [0.22, 1, 0.36, 1],
            }}
            className={className}
        >
            {children}
        </MotionTag>
    );
}

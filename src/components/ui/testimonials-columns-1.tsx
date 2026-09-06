"use client";
import React from "react";
import { motion } from "motion/react";

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: {
    text: string;
    image: string;
    name: string;
    role: string;
  }[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6 bg-background"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, image, name, role }, i) => (
                <div className="p-8 rounded-3xl border shadow-xl shadow-primary/5 max-w-xs w-full bg-gradient-to-br from-white via-rose-50/30 to-pink-50/20 dark:from-[#1b1c26] dark:via-[#161720] dark:to-[#111218] border-primary/20 dark:border-primary/25 hover:border-primary/50 transition-all duration-300 relative overflow-hidden" key={i}>
                  <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                  <div className="text-gray-700 dark:text-gray-300 leading-relaxed font-medium text-sm italic mb-4">"{text}"</div>
                  <div className="flex items-center gap-3 pt-4 border-t border-primary/10 dark:border-zinc-800/80">
                    <img
                      width={44}
                      height={44}
                      src={image}
                      alt={name}
                      className="h-11 w-11 rounded-xl object-cover ring-2 ring-primary/20"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex flex-col">
                      <div className="font-extrabold tracking-tight leading-5 text-gray-950 dark:text-white text-sm">{name}</div>
                      <div className="text-[10px] leading-4 font-black uppercase text-primary tracking-wider">{role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};

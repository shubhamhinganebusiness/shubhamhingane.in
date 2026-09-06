import { cn } from "../lib/utils";
import { LogoCloud } from "./ui/logo-cloud-4";
import { motion } from "motion/react";

const logos = [
  {
    src: "https://svgl.app/library/nvidia-wordmark-light.svg",
    alt: "Nvidia Logo",
  },
  {
    src: "https://svgl.app/library/supabase_wordmark_light.svg",
    alt: "Supabase Logo",
  },
  {
    src: "https://svgl.app/library/openai_wordmark_light.svg",
    alt: "OpenAI Logo",
  },
  {
    src: "https://svgl.app/library/turso-wordmark-light.svg",
    alt: "Turso Logo",
  },
  {
    src: "https://svgl.app/library/vercel_wordmark.svg",
    alt: "Vercel Logo",
  },
  {
    src: "https://svgl.app/library/github_wordmark_light.svg",
    alt: "GitHub Logo",
  },
  {
    src: "https://svgl.app/library/claude-ai-wordmark-icon_light.svg",
    alt: "Claude AI Logo",
  },
  {
    src: "https://svgl.app/library/clerk-wordmark-light.svg",
    alt: "Clerk Logo",
  },
];

export const LogoCloudSection = () => {
  return (
    <section className="py-20 relative overflow-hidden bg-white dark:bg-gray-950">
     <div
        aria-hidden="true"
        className={cn(
          "-top-1/2 -translate-x-1/2 pointer-events-none absolute left-1/2 h-[120vmin] w-[120vmin] rounded-b-full",
          "bg-[radial-gradient(ellipse_at_center,rgba(255,1,79,0.1),transparent_50%)]",
          "blur-[30px]"
        )}
      />
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8 }}
           viewport={{ once: true }}
           className="w-full"
        >
          <h2 className="mb-10 text-center">
            <span className="block font-black text-xs uppercase tracking-[0.2em] text-primary mb-3">
              Already used by
            </span>
            <span className="font-black text-3xl text-gray-900 dark:text-white tracking-tight md:text-5xl">
              Best in the Game
            </span>
          </h2>

          <LogoCloud logos={logos} />
        </motion.div>
      </div>
    </section>
  );
}

export default LogoCloudSection;

import { MessageCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type WhatsAppCommunityButtonProps = {
  className?: string;
  compact?: boolean;
};

const WHATSAPP_COMMUNITY_URL =
  import.meta.env.VITE_WHATSAPP_COMMUNITY_URL || "https://chat.whatsapp.com/HzdNLw7gkhbCEpszycId8o";

const hasWhatsAppCommunityLink =
  /^https?:\/\//i.test(WHATSAPP_COMMUNITY_URL) &&
  /(chat\.whatsapp\.com|wa\.me)/i.test(WHATSAPP_COMMUNITY_URL);

const WhatsAppCommunityButton = ({ className, compact = false }: WhatsAppCommunityButtonProps) => {
  if (!hasWhatsAppCommunityLink) return null;

  return (
    <a
      href={WHATSAPP_COMMUNITY_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#15803d] to-[#22c55e] px-3 py-2 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(22,163,74,0.35)] ring-1 ring-white/70 transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(22,163,74,0.45)]",
        className
      )}
      aria-label="Join WhatsApp community"
    >
      <MessageCircle className={compact ? "h-4 w-4" : "h-4 w-4"} />
      <span>{compact ? "Community" : "Join Community"}</span>
      <Sparkles className="h-3.5 w-3.5 opacity-80 transition-transform duration-300 group-hover:rotate-12" />
    </a>
  );
};

export default WhatsAppCommunityButton;
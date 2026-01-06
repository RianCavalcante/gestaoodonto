"use client";

import { cn } from "@/lib/utils";
import { WhatsappLogo, InstagramLogo, FacebookLogo, Globe } from "@phosphor-icons/react";
import type { ChannelType } from "@/types";

interface ChannelBadgeProps {
    channel: ChannelType;
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
}

export function ChannelBadge({ channel, size = "md", showLabel = false }: ChannelBadgeProps) {
    const config = {
        whatsapp: {
            icon: WhatsappLogo,
            label: "WhatsApp",
            className: "bg-[#25D366] text-white",
            weight: "regular" // Official brand look usually assumes regular or fill. Let's use regular which is standard for Phosphor brand icons or fill if solid. WhatsApp logo is usually solid green or white on green. The container is green, so white icon. Regular or Fill works. Let's try 'regular' first as it's cleaner, or 'fill' if we want bold. The user said 'official', which often implies the solid shape. Let's go with 'regular' as phosphor brand icons are designed well. Actually, wait. 'bg-[#25D366]' is the container. So the icon is white. 'regular' outline is fine. 'fill' might be better for visibility at small sizes. Let's use 'fill' for better visibility on small badge.
        },
        instagram: {
            icon: InstagramLogo,
            label: "Instagram",
            className: "bg-gradient-to-br from-purple-600 to-pink-500 text-white",
            weight: "fill"
        },
        facebook: {
            icon: FacebookLogo,
            label: "Facebook",
            className: "bg-[#1877F2] text-white",
            weight: "fill"
        },
        website: {
            icon: Globe,
            label: "Site",
            className: "bg-blue-600 text-white",
            weight: "fill"
        },
    };

    const { icon: Icon, label, className, weight = "fill" } = config[channel] || config.website;

    const sizeClasses = {
        sm: "w-5 h-5 p-0.5",
        md: "w-8 h-8 p-1.5",
        lg: "w-10 h-10 p-2",
    };

    const iconSizes = {
        sm: "w-3 h-3",
        md: "w-4 h-4",
        lg: "w-5 h-5",
    };

    return (
        <div className={cn("inline-flex items-center gap-1.5")}>
            <div className={cn("rounded-full shadow-sm flex items-center justify-center", className, sizeClasses[size])}>
                <Icon className={iconSizes[size]} weight={weight as any} />
            </div>
            {showLabel && <span className="text-sm font-medium text-gray-700">{label}</span>}
        </div>
    );
}

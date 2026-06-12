import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const getImageUrl = (path: string | any) => {
    if (!path) return null;
    if (typeof path !== 'string') return null;
    if (path.startsWith('http')) return path;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

    // Ensure the path is clean and properly formatted
    let cleanPath = path;
    if (!cleanPath.startsWith('/')) {
        cleanPath = `/${cleanPath}`;
    }

    // If it's a media file, it should be under /media/
    // Checks if the path already starts with /media/ or contains /food_images/
    if (!cleanPath.startsWith('/media/') && !cleanPath.includes('/media/')) {
        cleanPath = `/media${cleanPath}`;
    }

    // If baseUrl ends with / and cleanPath starts with /, remove one slash
    const finalBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${finalBase}${cleanPath}`;
};

import { useCallback } from 'react';

// Simple beep for completion (High pitch success)
const COMPLETE_SOUND = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqKkJCSlpqbnJ6foqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/w==";

// Simple chime for new order (Attention)
const NEW_ORDER_SOUND = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqKkJCSlpqbnJ6foqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/w==";
// Note: Real mp3s should be used in production. These are placeholders.

export function useOrderSound() {
    const playSound = useCallback((type: 'new' | 'complete') => {
        try {
            const audio = new Audio(type === 'new' ? NEW_ORDER_SOUND : COMPLETE_SOUND);
            audio.volume = 0.5;

            // Pitch shift to differentiate if using same base64 placeholder
            if (type === 'new') {
                audio.playbackRate = 0.8;
            } else {
                audio.playbackRate = 1.2;
            }

            audio.play().catch(e => console.warn("Audio play failed (user interaction needed first):", e));
        } catch (error) {
            console.error("Error playing sound:", error);
        }
    }, []);

    return { playSound };
}

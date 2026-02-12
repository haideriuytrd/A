import { useCallback } from 'react';

// Map of sound events to their file paths
const SOUNDS = {
    correct: '/sounds/correct.mp3',
    incorrect: '/sounds/incorrect.mp3',
    success: '/sounds/success.mp3',
    levelUp: '/sounds/level-up.mp3',
    click: '/sounds/click.mp3',
};

export const useSound = () => {
    const play = useCallback((soundName) => {
        const audioPath = SOUNDS[soundName];
        if (!audioPath) return;

        try {
            const audio = new Audio(audioPath);
            audio.volume = 0.5; // Default volume

            // Play and catch any autoplay errors
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch((error) => {
                    // Auto-play was prevented
                    console.debug('Audio play failed:', error);
                });
            }
        } catch (err) {
            console.warn('Audio playback error:', err);
        }
    }, []);

    return { play };
};

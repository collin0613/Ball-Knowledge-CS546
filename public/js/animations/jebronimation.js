document.addEventListener('DOMContentLoaded', function() {
    gsap.registerPlugin(ScrollTrigger);

    function generateFrames(totalFrames) {
        const frames = [];
        for (let i = 1; i <= totalFrames; i++) {
            frames.push(`/public/images/patimation/frame_${String(i).padStart(4, '0')}.png`);
        }
        return frames;
    }
    
    const frames = generateFrames(205);

    function updateImage(frame) {
        const count = frames.length;
        const i = Math.floor(frame * (count - 1));
        return i;
    }

    gsap.to('#patimation', {
        scrollTrigger: {
            trigger: '.scroll-content',
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1,
            markers: true,
            onUpdate: (self) => {
                const t = self.progress;
                const i = updateImage(t);
                const element = document.getElementById('patimation');
                if (element) {
                    element.src = frames[i];
                    console.log("Patimation frame:", i);
                } else {
                    console.error("Element #patimation not found");
                }
            }
        }
    });

    console.log("Patimation initialized");
});
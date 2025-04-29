document.addEventListener('DOMContentLoaded', function() {
    gsap.registerPlugin(ScrollTrigger);

    const frames = [
        '/public/images/lebronimation/0.png',
        '/public/images/lebronimation/1.png',
        '/public/images/lebronimation/2.png',
        '/public/images/lebronimation/3.png',
        '/public/images/lebronimation/4.png',
        '/public/images/lebronimation/5.png',
        '/public/images/lebronimation/6.png',
        '/public/images/lebronimation/7.png',
        '/public/images/lebronimation/8.png',
        '/public/images/lebronimation/9.png',
        '/public/images/lebronimation/10.png',
        '/public/images/lebronimation/11.png',
        '/public/images/lebronimation/12.png',
        '/public/images/lebronimation/13.png',
        '/public/images/lebronimation/14.png',
        '/public/images/lebronimation/15.png'
    ];

    function updateImage(frame) {
        const count = frames.length;
        const i = Math.floor(frame * (count - 1));
        return i;
    }

    gsap.to('#lebronimation', {
        scrollTrigger: {
            trigger: '.scroll-content',
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1,
            markers: true,
            onUpdate: (self) => {
                const t = self.progress;
                const i = updateImage(t);
                const element = document.getElementById('lebronimation');
                if (element) {
                    element.src = frames[i];
                    console.log("Lebronimation frame:", i);
                } else {
                    console.error("Element #lebronimation not found");
                }
            }
        }
    });

    console.log("Lebronimation initialized");
});
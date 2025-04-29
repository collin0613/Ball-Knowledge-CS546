document.addEventListener('DOMContentLoaded', function() {
    gsap.registerPlugin(ScrollTrigger);

    gsap.to(".parallax1", {
        y: -100,
        scrollTrigger: {
            trigger: ".parallax1",
            start: "top bottom",
            end: "bottom top",
            scrub: true,
            markers: true
        }
    });

    gsap.to(".parallax2", {
        y: -200,
        scrollTrigger: {
            trigger: ".parallax2",
            start: "top bottom",
            end: "bottom top",
            scrub: true,
            markers: true
        }
    });

    gsap.to(".parallax3", {
        y: -300,
        scrollTrigger: {
            trigger: ".parallax3",
            start: "top bottom",
            end: "bottom top",
            scrub: true,
            markers: true
        }
    });

    gsap.to(".parallax4", {
        y: -400,
        scrollTrigger: {
            trigger: ".parallax4",
            start: "top bottom",
            end: "bottom top",
            scrub: true,
            markers: true
        }
    });
    
    gsap.to(".parallax5", {
        y: -500,
        scrollTrigger: {
            trigger: ".parallax5",
            start: "top bottom",
            end: "bottom top",
            scrub: true,
            markers: true
        }
    });
    
    gsap.to(".parallax6", {
        y: -600,
        scrollTrigger: {
            trigger: ".parallax6",
            start: "top bottom",
            end: "bottom top",
            scrub: true,
            markers: true
        }
    });
    
    gsap.to(".parallax7", {
        y: -700,
        scrollTrigger: {
            trigger: ".parallax7",
            start: "top bottom",
            end: "bottom top",
            scrub: true,
            markers: true
        }
    });
    
    gsap.to(".parallax8", {
        y: -800,
        scrollTrigger: {
            trigger: ".parallax8",
            start: "top bottom",
            end: "bottom top",
            scrub: true,
            markers: true
        }
    });
    
    gsap.to(".parallax9", {
        y: -900,
        scrollTrigger: {
            trigger: ".parallax9",
            start: "top bottom",
            end: "bottom top",
            scrub: true,
            markers: true
        }
    });
    
    gsap.fromTo(".parallaxlbj", 
        {
            y: "90vh",
        },
        {
            y: "-60vh",
            scrollTrigger: {
                trigger: ".scroll-content",
                start: "top bottom",
                end: "bottom top",
                scrub: true,
                markers: true
            }
        }
    );

    console.log("Parallax animations initialized");
});
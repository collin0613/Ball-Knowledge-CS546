import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const frames = [
    'lebronimation/0.png',
    'lebronimation/1.png',
    'lebronimation/2.png',
    'lebronimation/3.png',
    'lebronimation/4.png',
    'lebronimation/5.png',
    'lebronimation/6.png',
    'lebronimation/7.png',
    'lebronimation/8.png',
    'lebronimation/9.png',
    'lebronimation/10.png',
    'lebronimation/11.png',
    'lebronimation/12.png',
    'lebronimation/13.png',
    'lebronimation/14.png',
    'lebronimation/15.png'
]

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
            document.getElementById('lebronimation').src = frames[i];
        }
    }
})
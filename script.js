gsap.set('.cursor', { xPercent: -50, yPercent: -50 });

let cursor = document.querySelector('.cursor');
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;
let speed = 0.1;

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

function animate() {
    targetX += (mouseX - targetX) * speed;
    targetY += (mouseY - targetY) * speed;

    gsap.set(cursor, { x: targetX, y: targetY });

    requestAnimationFrame(animate);
}

animate();

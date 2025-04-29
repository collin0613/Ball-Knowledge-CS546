// Dot magnification effect - vanilla JS implementation
document.addEventListener('DOMContentLoaded', function() {
    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.id = 'dot-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.zIndex = '0';
    canvas.style.pointerEvents = 'none';
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    
    // Configuration
    const dotSize = 0.5;
    const dotSpacing = 10;
    const magnifyRadius = 100;
    const maxMagnification = 3;
    let mouseX = -1000;
    let mouseY = -1000;
    
    // Set canvas size
    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawDots();
    }
    
    // Track mouse position
    document.addEventListener('mousemove', function(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      drawDots();
    });
    
    // Draw all dots
    function drawDots() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      
      const startX = Math.floor(scrollX / dotSpacing) * dotSpacing;
      const startY = Math.floor(scrollY / dotSpacing) * dotSpacing;
      const endX = scrollX + window.innerWidth + dotSpacing;
      const endY = scrollY + window.innerHeight + dotSpacing;
      
      ctx.fillStyle = '#000';
      
      for (let x = startX; x <= endX; x += dotSpacing) {
        for (let y = startY; y <= endY; y += dotSpacing) {
          const canvasX = x - scrollX;
          const canvasY = y - scrollY;
          
          const dx = mouseX - canvasX;
          const dy = mouseY - canvasY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          let size = dotSize;
          if (distance < magnifyRadius) {
            const magnifyFactor = 1 + (maxMagnification * (1 - distance / magnifyRadius));
            size *= magnifyFactor;
          }
          
          ctx.beginPath();
          ctx.arc(canvasX, canvasY, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    
    // Remove original background pattern
    const scrollContent = document.querySelector('.scroll-content');
    if (scrollContent) {
      scrollContent.style.backgroundImage = 'none';
    }
    
    // Initialize
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('scroll', drawDots);
    resizeCanvas();
  });
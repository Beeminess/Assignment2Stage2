// Scroll-driven image sequence for hero section

const HERO_FRAME_COUNT = 43;
// Using absolute path for better compatibility:
const HERO_FRAME_FOLDER = 'asset/cake_video'; 
const HERO_FRAME_BASENAME = 'kling_20251128_Image_to_Video_rotate_a_c_5710_0_';
const HERO_FRAME_EXTENSION = '.png'; 

const heroFrames = [];
let heroCanvas;
let heroCtx;
let heroCurrentFrame = 0;

function heroFrameSrc(index) {
  const padded = index.toString().padStart(5, '0');
  return `${HERO_FRAME_FOLDER}/${HERO_FRAME_BASENAME}${padded}${HERO_FRAME_EXTENSION}`;
}

function preloadHeroFrames(onComplete) {
  let loaded = 0;

  for (let i = 0; i < HERO_FRAME_COUNT; i++) {
    const img = heroFrames[i] || new Image();
    img.src = heroFrameSrc(i);
    img.onload = () => {
      loaded += 1;
      if (loaded === HERO_FRAME_COUNT && typeof onComplete === 'function') {
        onComplete();
      }
    };
    img.onerror = () => { 
        console.error(`Failed to load image: ${img.src}`);
    };
    heroFrames[i] = img;
  }
}

// FIX: Resizes canvas to a fixed 1500px height, calculating width based on image ratio
function resizeHeroCanvas() {
  if (!heroCanvas || !heroCtx) return;

  const dpr = window.devicePixelRatio || 1;
  const targetHeight = 800;
  
  // Use the first loaded frame to determine the aspect ratio
  const img = heroFrames[0];
  
  let width, height;

  if (img && img.width && img.height) {
    // Calculate aspect ratio (width / height)
    const imgRatio = img.width / img.height; 

    // Calculate the new width based on the fixed height (1500px)
    width = targetHeight * imgRatio;
    height = targetHeight;
  } else {
    // Fallback if called before images load (should be prevented by initHeroScrollSequence)
    console.warn("Image not loaded yet, using fallback ratio.");
    const fallbackRatio = 16 / 9; // Fallback to 16:9 ratio
    width = targetHeight * fallbackRatio;
    height = targetHeight;
  }

  // Set the canvas's physical pixel size
  heroCanvas.width = width * dpr;
  heroCanvas.height = height * dpr;

  // Set the canvas's CSS size
  heroCanvas.style.width = `${width}px`;
  heroCanvas.style.height = `${height}px`;

  heroCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  renderHeroFrame(heroCurrentFrame);
}

// FIX: Logic changed from 'cover' (cropping) to 'contain' (full picture visible)
function renderHeroFrame(index) {
  index = Math.max(0, Math.min(index, HERO_FRAME_COUNT - 1));

  if (!heroCtx || !heroFrames[index]) return;

  heroCurrentFrame = index;
  const img = heroFrames[index];

  const canvasWidth = heroCanvas.clientWidth;
  const canvasHeight = heroCanvas.clientHeight;

  // Clear the drawing area using physical dimensions
  heroCtx.clearRect(0, 0, heroCanvas.width, heroCanvas.height); 

  const imgRatio = img.width / img.height;
  const canvasRatio = canvasWidth / canvasHeight;

  let drawWidth;
  let drawHeight;

  // Contain Logic: ensures the whole image fits
  if (imgRatio > canvasRatio) {
    // Image is proportionally wider, match width to canvas width
    drawWidth = canvasWidth;
    drawHeight = canvasWidth / imgRatio;
  } else {
    // Image is proportionally taller, match height to canvas height
    drawHeight = canvasHeight;
    drawWidth = canvasHeight * imgRatio;
  }

  // Center the image
  const offsetX = (canvasWidth - drawWidth) / 2;
  const offsetY = (canvasHeight - drawHeight) / 2;

  heroCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

function onHeroScroll() {
  if (!heroCanvas) return;

  // Get the hero section element
  const heroSection = heroCanvas.closest('.hero');
  if (!heroSection) return;

  // Get hero section position and dimensions
  const heroRect = heroSection.getBoundingClientRect();
  const heroTop = heroRect.top + window.scrollY;
  const heroHeight = heroSection.offsetHeight;
  const viewportHeight = window.innerHeight;

  // Calculate scroll progress within the hero section
  // When hero section top reaches viewport top, progress starts at 0
  // When hero section bottom reaches viewport top, progress reaches 1
  const scrollTop = window.scrollY || window.pageYOffset;
  const heroStart = heroTop;
  const heroEnd = heroTop + heroHeight - viewportHeight;
  
  // Calculate scroll progress (0 to 1) within the hero section
  let scrollFraction = 0;
  if (scrollTop <= heroStart) {
    // Before hero section
    scrollFraction = 0;
  } else if (scrollTop >= heroEnd) {
    // After hero section
    scrollFraction = 1;
  } else {
    // Within hero section
    scrollFraction = (scrollTop - heroStart) / (heroEnd - heroStart);
  }

  // Map scroll progress to frame index (0 to 42)
  const frameIndex = Math.min(
    HERO_FRAME_COUNT - 1,
    Math.floor(scrollFraction * HERO_FRAME_COUNT)
  );

  window.requestAnimationFrame(() => renderHeroFrame(frameIndex));
}

// FIX: Updated to call resizeHeroCanvas AFTER images are loaded
function initHeroScrollSequence() {
  heroCanvas = document.getElementById('hero-sequence');
  if (!heroCanvas) {
      console.error("Canvas element with ID 'hero-sequence' not found.");
      return;
  }

  heroCtx = heroCanvas.getContext('2d');

  preloadHeroFrames(() => {
    // 1. Resize canvas ONLY after the first image is loaded to get its ratio
    resizeHeroCanvas(); 
    
    // 2. Draw first frame on load
    renderHeroFrame(0);
    console.log("Cake sequence frames successfully preloaded.");
  });

  window.addEventListener('scroll', onHeroScroll, { passive: true });
  window.addEventListener('resize', () => {
    resizeHeroCanvas();
    onHeroScroll(); // Recalculate scroll position after resize
  });
}

document.addEventListener('DOMContentLoaded', initHeroScrollSequence);

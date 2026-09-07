import bombIcon from '../assets/Bomb.png';
import bombExplodingIcon from '../assets/BombExploding.png';

export function setupAnimatedFavicon(intervalMs = 450): () => void {
  let isExploding = false;
  let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");

  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    document.head.appendChild(link);
  }
  link.href = bombIcon;

  const timer = setInterval(() => {
    isExploding = !isExploding;
    link.href = isExploding ? bombExplodingIcon : bombIcon;
  }, intervalMs);

  return () => clearInterval(timer);
}

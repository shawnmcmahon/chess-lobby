const FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,900;1,9..144,500;1,9..144,700&family=JetBrains+Mono:wght@400;500;700&family=Archivo+Black&family=Caprasimo&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500;1,700&family=Inter+Tight:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=IBM+Plex+Mono:wght@400;500;600&display=swap";

export function loadFonts() {
  if (document.querySelector(`link[data-fonts="${FONTS_URL}"]`)) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = FONTS_URL;
  link.dataset.fonts = FONTS_URL;
  document.head.appendChild(link);
}

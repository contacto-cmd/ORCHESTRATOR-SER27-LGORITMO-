document.addEventListener("DOMContentLoaded", () => {
  console.log("🔱 Soberanía activa: SINI OMEGA SUPREME V6.0");
  
  // Ejemplo: animación de título
  const title = document.querySelector("h1");
  title.style.opacity = 0;
  setTimeout(() => {
    title.style.transition = "opacity 2s";
    title.style.opacity = 1;
  }, 500);
});

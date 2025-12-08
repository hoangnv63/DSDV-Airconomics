document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll(".nav-link");

  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      navLinks.forEach(l => l.classList.remove("active"));
      link.classList.add("active");
      const target = document.querySelector(link.dataset.target);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // DIRECT INIT – no IntersectionObserver
  if (window.initChart1) window.initChart1();
  if (window.initChart2) window.initChart2();
  if (window.initChart3) window.initChart3();
});

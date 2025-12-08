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

// Sections to observe
const sections = document.querySelectorAll("main section");
const navLinks = document.querySelectorAll(".nav-link");

const observerOptions = {
  root: null,
  rootMargin: "0px",
  threshold: 0.5, 
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navLinks.forEach(link => {
        if (link.dataset.target === "#" + id || link.dataset.target === id) {
          link.classList.add("active");
        } else {
          link.classList.remove("active");
        }
      });
    }
  });
}, observerOptions);

// Start observing each chart section
sections.forEach(section => observer.observe(section));

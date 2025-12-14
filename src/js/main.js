// main.js — merged and fixed

document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll("main section");
  const header = document.querySelector(".header");
  const headerHeight = header ? header.offsetHeight : 0;

  // Smooth scroll on click
  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      // Set active class
      navLinks.forEach(l => l.classList.remove("active"));
      link.classList.add("active");

      // Get target section
      let targetSelector = link.dataset.target;
      if (!targetSelector.startsWith("#")) targetSelector = "#" + targetSelector;

      const target = document.querySelector(targetSelector);
      if (target) {
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
        window.scrollTo({
          top: targetPosition,
          behavior: "smooth"
        });
      }
    });
  });

  // IntersectionObserver to update nav on scroll
  const observerOptions = {
    root: null,
    rootMargin: `-${headerHeight}px 0px 0px 0px`,
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

  sections.forEach(section => observer.observe(section));

  // ------------------ INIT CHARTS ------------------
  if (window.initChart1) window.initChart1();
  if (window.initChart2) window.initChart2();
  if (window.initChart3) window.initChart3();
});

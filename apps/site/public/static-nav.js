(function () {
  function wireStaticNav(menuBtnId, panelId) {
    var btn = document.getElementById(menuBtnId);
    var panel = document.getElementById(panelId);
    if (!btn || !panel) {
      return;
    }

    function setOpen(open) {
      panel.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("static-nav-open", open);
      var icon = btn.querySelector("[data-lucide]");
      if (icon) {
        icon.setAttribute("data-lucide", open ? "x" : "menu");
        if (window.lucide && typeof window.lucide.createIcons === "function") {
          window.lucide.createIcons({ attrs: { "stroke-width": 1.5 } });
        }
      }
    }

    btn.addEventListener("click", function () {
      setOpen(!panel.classList.contains("is-open"));
    });

    panel.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setOpen(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    });
  }

  wireStaticNav("menu-btn", "mobile-nav-panel");
  wireStaticNav("arch-menu-btn", "arch-mobile-nav-panel");
})();

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
      if (event.key === "Escape" && panel.classList.contains("is-open")) {
        setOpen(false);
      }
    });
  }

  function wireArchContentsSheet() {
    var openBtn = document.getElementById("arch-contents-open");
    var panel = document.getElementById("arch-toc-panel");
    var backdrop = document.getElementById("arch-contents-backdrop");
    if (!openBtn || !panel) {
      return;
    }

    var closeBtn = panel.querySelector(".static-arch-sheet-close");

    function setSheetOpen(open) {
      panel.classList.toggle("is-sheet-open", open);
      openBtn.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("static-contents-open", open);
      if (backdrop) {
        backdrop.classList.toggle("is-visible", open);
        backdrop.hidden = !open;
      }
    }

    openBtn.addEventListener("click", function () {
      setSheetOpen(!panel.classList.contains("is-sheet-open"));
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        setSheetOpen(false);
      });
    }

    if (backdrop) {
      backdrop.addEventListener("click", function () {
        setSheetOpen(false);
      });
    }

    panel.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setSheetOpen(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && panel.classList.contains("is-sheet-open")) {
        setSheetOpen(false);
      }
    });
  }

  wireStaticNav("menu-btn", "mobile-nav-panel");
  wireStaticNav("arch-menu-btn", "arch-mobile-nav-panel");
  wireArchContentsSheet();
})();

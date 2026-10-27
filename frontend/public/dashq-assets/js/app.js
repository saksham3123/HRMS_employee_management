/*------------------------------------------------------------------
[App Js]

Template:       DashQ - Bootstrap HTML Admin Dashboard Template

Version:        1.0.0
Last change:    19 June, 2026
-------------------------------------------------------------------*/
(function (window, document) {
    'use strict';

    const DashQ = {
        // --- Configuration & Constants ---
        settings: {
            storagePrefix: "DashQ_admin_",
            keys: {
                mode: "theme_mode",
                preset: "theme_preset",
                primary: "primary_color",
                font: "font_family",
                size: "font_size",
            },
            defaults: {
                mode: "light",
                preset: "theme-indigo",
                font: "inter",
                size: "medium",
                primary: "#573CFB",
            }
        },

        // --- Initialization ---
        init: function () {
            this.root = document.documentElement;
            this.body = document.body;

            this.initThemeMode();
            this.initThemePreset();
            this.initCustomColor();
            this.initTypography();
            this.initBootstrapComponents();
            this.initEventListeners();
            this.initLayoutToggles();
        },

        // --- Storage Helper ---
        getStorage: function (key) {
            return localStorage.getItem(this.settings.storagePrefix + key);
        },

        setStorage: function (key, value) {
            localStorage.setItem(this.settings.storagePrefix + key, value);
        },

        // --- Theme Mode (Light/Dark) ---
        initThemeMode: function () {
            const saved = this.getStorage(this.settings.keys.mode) || this.settings.defaults.mode;
            this.applyThemeMode(saved);

            document.addEventListener('click', (e) => {
                if (e.target.closest('#themeToggle')) {
                    const current = this.root.getAttribute("data-bs-theme");
                    this.applyThemeMode(current === "light" ? "dark" : "light");
                }
            });
        },

        applyThemeMode: function (mode) {
            this.root.setAttribute("data-bs-theme", mode);
            this.setStorage(this.settings.keys.mode, mode);

            const btn = document.getElementById("themeToggle");
            if (btn) {
                btn.innerHTML = mode === "light" ? '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon"></i>';
            }
        },

        // --- Theme Presets & Custom Primary ---
        initThemePreset: function () {
            const saved = this.getStorage(this.settings.keys.preset) || this.settings.defaults.preset;
            this.applyThemePreset(saved, false);
        },

        applyThemePreset: function (preset, clearCustom = true) {
            if (!preset) return;
            if (clearCustom) localStorage.removeItem(this.settings.storagePrefix + this.settings.keys.primary);

            this.root.setAttribute("data-theme", preset);
            this.setStorage(this.settings.keys.preset, preset);

            // Sync UI active states
            document.querySelectorAll(".theme-swatch").forEach(btn => {
                btn.classList.toggle("active", btn.dataset.theme === preset);
            });
        },

        initCustomColor: function () {
            const saved = this.getStorage(this.settings.keys.primary);
            if (saved) this.applyCustomPrimary(saved);

            // Handle Inputs
            document.addEventListener('input', (e) => {
                if (e.target.id === 'customThemeColor') this.applyCustomPrimary(e.target.value);
            });

            document.addEventListener('change', (e) => {
                if (e.target.id === 'customThemeHex') {
                    let val = e.target.value.trim();
                    if (!val.startsWith('#')) val = '#' + val;
                    if (/^#([0-9A-Fa-f]{3,6})$/.test(val)) {
                        this.applyCustomPrimary(val);
                    }
                }
            });
        },

        applyCustomPrimary: function (hex) {
            this.root.style.setProperty("--bs-primary", hex);
            
            // Convert Hex to RGB for Bootstrap utility classes
            const rgb = this.hexToRgb(hex);
            if (rgb) this.root.style.setProperty("--bs-primary-rgb", `${rgb.r}, ${rgb.g}, ${rgb.b}`);

            this.setStorage(this.settings.keys.primary, hex);

            const colorInput = document.getElementById("customThemeColor");
            const hexInput = document.getElementById("customThemeHex");
            if (colorInput) colorInput.value = hex;
            if (hexInput) hexInput.value = hex.toUpperCase();
        },

        // --- Typography ---
        initTypography: function () {
            const font = this.getStorage(this.settings.keys.font) || this.settings.defaults.font;
            const size = this.getStorage(this.settings.keys.size) || this.settings.defaults.size;
            this.applyFont(font);
            this.applySize(size);
        },

        applyFont: function (key) {
            const fonts = {
                inter: '"Inter", system-ui, sans-serif',
                dm: '"DM Sans", system-ui, sans-serif',
                poppins: '"Poppins", system-ui, sans-serif',
                space: '"Space Grotesk", system-ui, sans-serif'
            };
            this.root.style.setProperty("--app-font-family", fonts[key] || fonts.inter);
            this.setStorage(this.settings.keys.font, key);
            this.updatePills(".font-pill", "font", key);
        },

        applySize: function (key) {
            const sizes = { small: 0.9, medium: 1, large: 1.1 };
            this.root.style.setProperty("--font-scale", sizes[key] || 1);
            this.setStorage(this.settings.keys.size, key);
            this.updatePills(".size-pill", "size", key);
        },

        updatePills: function (selector, dataAttr, activeVal) {
            document.querySelectorAll(selector).forEach(p => {
                p.classList.toggle("active", p.dataset[dataAttr] === activeVal);
            });
        },

        // --- Utils & Layout ---
        initLayoutToggles: function () {
            const toggles = [
                { id: "Background_Image", class: "bg-image" },
                { id: "Glass_Effect_Toggle", class: "glass-effect" },
                { id: "Retro_Border_Style", class: "retro-border" }
            ];

            toggles.forEach(t => {
                const el = document.getElementById(t.id);
                if (!el) return;
                const state = this.getStorage(t.id) === "true";
                el.checked = state;
                this.body.classList.toggle(t.class, state);

                el.addEventListener('change', () => {
                    this.body.classList.toggle(t.class, el.checked);
                    this.setStorage(t.id, el.checked);
                });
            });
        },

        initEventListeners: function () {
            // Global Click Handling (Event Delegation)
            document.addEventListener('click', (e) => {
                // Preset Buttons
                const presetBtn = e.target.closest('.theme-swatch');
                if (presetBtn) this.applyThemePreset(presetBtn.dataset.theme);

                // Font/Size Pills
                const fontPill = e.target.closest('.font-pill');
                if (fontPill) this.applyFont(fontPill.dataset.font);

                const sizePill = e.target.closest('.size-pill');
                if (sizePill) this.applySize(sizePill.dataset.size);

                // Submenu Toggle
                const submenuBtn = e.target.closest('[data-bs-toggle="submenu"]');
                if (submenuBtn) {
                    e.preventDefault();
                    submenuBtn.nextElementSibling.classList.toggle("show");
                }

                // Layout Utility Toggles
                if (e.target.closest('.btn-fullscreen-main')) this.body.classList.toggle('app-body-fullscreen');
                if (e.target.closest('.btn-navbar-collapse')) this.body.classList.toggle('body-navbar-collapse');
                if (e.target.closest('.aside-toggle')) document.querySelector('aside')?.classList.toggle('open');

                // Ripple Effect
                const rippleBtn = e.target.closest('.btn-ripple');
                if (rippleBtn) this.createRipple(e, rippleBtn);
            });

            // Scroll Header
            const header = document.querySelector("header");
            window.addEventListener('scroll', () => {
                header?.classList.toggle("scrolled", window.scrollY > 10);
            }, { passive: true });
        },

        // --- Helper: Ripple ---
        createRipple: function (e, btn) {
            const ripple = document.createElement('span');
            ripple.classList.add('ripple-element');
            const rect = btn.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
            ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
            btn.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove());
        },

        // --- Helper: Hex to RGB ---
        hexToRgb: function (hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        },

        // --- Third Party Plugins ---
        initBootstrapComponents: function () {
            // Tooltips
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(el => new bootstrap.Tooltip(el));

            // Tab Animations
            document.addEventListener('shown.bs.tab', (e) => {
                const target = document.querySelector(e.target.getAttribute("data-bs-target") || e.target.getAttribute("href"));
                if (!target) return;
                const dir = [...e.target.parentElement.children].indexOf(e.target) > [...e.relatedTarget?.parentElement.children || []].indexOf(e.relatedTarget) ? "right" : "left";
                target.classList.remove("tab-animate-from-right", "tab-animate-from-left");
                void target.offsetWidth; 
                target.classList.add(`tab-animate-from-${dir}`);
            });

            // DateRange
            if (window.jQuery && $.fn.daterangepicker) {
                $('.js-daterange').daterangepicker({ opens: 'left' });
            }
        }
    };

    // Modern layout to Classic version
    document.addEventListener("DOMContentLoaded", function () {
        const toggle = document.getElementById("Classic_View");

        if (toggle) {
            toggle.addEventListener("change", function () {
                document.body.classList.toggle("classic-view", this.checked);
            });
        }
    });

    // LTR to RTL mode toggle
    document.addEventListener("DOMContentLoaded", function () {
        const rtlToggle = document.getElementById("RTL_Mode");

        if (rtlToggle) {
            rtlToggle.addEventListener("change", function () {

                const html = document.documentElement;

                const bootstrapCSS = document.querySelector(
                    'link[href*="bootstrap.min.css"], link[href*="bootstrap.rtl.min.css"]'
                );

                if (!bootstrapCSS) return;

                let currentHref = bootstrapCSS.getAttribute("href");

                if (this.checked) {
                    html.setAttribute("dir", "rtl");
                    bootstrapCSS.setAttribute(
                        "href",
                        currentHref.replace("bootstrap.min.html", "bootstrap.rtl.min.html")
                    );
                } else {
                    html.setAttribute("dir", "ltr");
                    bootstrapCSS.setAttribute(
                        "href",
                        currentHref.replace("bootstrap.rtl.min.html", "bootstrap.min.html")
                    );
                }
            });
        }
    });

    // Run on DOM Ready
    document.addEventListener('DOMContentLoaded', () => DashQ.init());

    // Export to window for external access
    window.DashQ = DashQ;

})(window, document);
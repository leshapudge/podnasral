/** Inline fallback — работает даже если Tailwind-chunk не загрузился */
export const CRITICAL_OS_CSS = `
*, *::before, *::after { box-sizing: border-box; }
html, body {
  margin: 0;
  min-height: 100%;
  background: #0a1628;
  color: #e8d5b0;
  font-family: system-ui, -apple-system, sans-serif;
}
img { max-width: 100%; height: auto; display: block; }
a { color: #55c57a; }

.mc-os-scene {
  background: #0a1628;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}
.mc-os-wrap {
  position: relative;
  z-index: 1;
  margin: 0 auto;
  max-width: 1600px;
  min-height: 100vh;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
}
@media (min-width: 640px) { .mc-os-wrap { padding: 1rem; } }
@media (min-width: 768px) { .mc-os-wrap { padding: 1.5rem; } }

.mc-os-backdrop {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(180deg, #4a90c2 0%, #87ceeb 18%, #55c57a 18%, #3d8f5a 45%, #2d5a27 100%);
  opacity: 0.35;
}
.mc-os-monitor {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 640px;
  height: calc(100vh - 1rem);
  overflow: hidden;
  background: linear-gradient(180deg, #3d3024 0%, #2a2118 8%, #1a1208 100%);
  border: 4px solid #1a1208;
  border-radius: 6px;
  box-shadow: inset 0 0 0 2px #5c4a32, 0 24px 80px rgba(0, 0, 0, 0.65);
}
@media (min-width: 640px) { .mc-os-monitor { height: calc(100vh - 2rem); } }

.mc-os-bezel {
  display: flex;
  height: 2.5rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2px solid #1a1208;
  background: #3d3024;
  padding: 0 1rem;
}
.mc-os-bezel-title {
  font-family: var(--font-silkscreen), ui-monospace, monospace;
  font-size: 10px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: #a89070;
}

.mc-os-tabs {
  display: flex;
  flex-shrink: 0;
  align-items: stretch;
  min-height: 2.75rem;
  background: #2a2118;
  border-bottom: 2px solid #1a1208;
  padding: 0;
  position: relative;
  z-index: 2;
}
.mc-os-tabs-scroll {
  display: flex;
  flex: 1;
  min-width: 0;
  align-items: stretch;
  overflow-x: auto;
  overflow-y: hidden;
  padding-left: 0.25rem;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
}
.mc-os-tabs-scroll::-webkit-scrollbar {
  height: 4px;
}
.mc-os-tabs-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
}
.mc-os-tab-btn {
  position: relative;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  align-self: stretch;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #7a6a52;
  padding: 0.625rem 0.75rem;
  font-family: var(--font-silkscreen), ui-monospace, monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1.25;
}
@media (min-width: 640px) { .mc-os-tab-btn { padding: 0.625rem 1rem; font-size: 12px; } }
.mc-tab-active {
  background: linear-gradient(180deg, #2a2118 0%, #1a1208 100%) !important;
  color: #e8d5b0 !important;
}
.mc-tab-active::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: #55c57a;
}
.mc-os-tab-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.375rem;
  border-left: 1px solid #1a1208;
  padding: 0 0.5rem;
}
.mc-os-profile-btn {
  display: flex;
  align-items: center;
  height: 100%;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0 0.35rem;
  border-radius: 0;
}
.mc-os-profile-btn:hover { background: rgba(26, 18, 8, 0.5); }
.mc-os-menu-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.75rem;
  height: 1.75rem;
  border: 2px solid #5c4a32;
  background: linear-gradient(180deg, #4a3c2a 0%, #2a2118 100%);
  color: #e8d5b0;
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
}
.mc-os-menu-btn:hover { border-color: #55c57a; filter: brightness(1.1); }

.mc-os-topbar {
  display: flex;
  height: 2.75rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(26, 18, 8, 0.8);
  background: #1f1810;
  padding: 0 1rem;
}
.mc-os-status {
  display: flex;
  height: 2rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  border-top: 2px solid #1a1208;
  background: #0d0a08;
  padding: 0 1rem;
  font-family: var(--font-silkscreen), ui-monospace, monospace;
  font-size: 10px;
  color: #5c4a32;
}

.mc-os-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 2px solid #5c4a32;
  background: linear-gradient(180deg, #4a3c2a 0%, #2a2118 100%);
  color: #e8d5b0 !important;
  text-decoration: none;
  cursor: pointer;
  font-family: var(--font-silkscreen), ui-monospace, monospace;
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: 0.05em;
}
.mc-os-btn:hover { filter: brightness(1.12); border-color: #55c57a; }

.os-scrollbar {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  background: #14100c;
  padding: 1rem;
}
@media (min-width: 640px) { .os-scrollbar { padding: 1.25rem; } }

.mc-slot {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1a1a1a;
  background-image: url("/assets/mc/slot.svg");
  background-size: cover;
  border: 2px solid #373737;
  box-shadow: inset 2px 2px 0 #0a0a0a, inset -1px -1px 0 #4a4a4a;
}
.mc-pixel-image {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  object-fit: contain;
}

.mc-stat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}
@media (min-width: 640px) { .mc-stat-grid { grid-template-columns: repeat(4, 1fr); } }
.mc-stat-card {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #1a1208;
  background: rgba(26, 18, 8, 0.6);
  padding: 0.5rem;
  border-radius: 4px;
}
.mc-quick-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}
@media (min-width: 640px) { .mc-quick-grid { grid-template-columns: repeat(4, 1fr); } }
.mc-quick-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #1a1208;
  background: rgba(26, 18, 8, 0.4);
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  color: #e8d5b0;
  text-align: left;
}
.mc-quick-btn:hover { border-color: rgba(85, 197, 122, 0.4); }

.mc-section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  margin-top: 1.5rem;
}
.mc-section-title::before,
.mc-section-title::after {
  content: "";
  flex: 1;
  border-top: 1px dashed rgba(92, 74, 50, 0.8);
}
.mc-section-title span {
  font-family: var(--font-silkscreen), ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: #a89070;
  white-space: nowrap;
}
`;

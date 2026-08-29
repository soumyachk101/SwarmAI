/**
 * Skip-to-main-content link.
 *
 * Hidden off-screen until the user tabs into it — standard a11y pattern
 * that lets keyboard users bypass the chrome (sidebar, dock, window
 * controls) and land straight in the main content area.
 */
export default function SkipNav() {
 return (
 <a
 href="#main-content"
 className="
 sr-only
 focus:not-sr-only
 focus:fixed
 focus:top-2
 focus:left-2
 focus:z-[200]
 focus:rounded-md
 focus:bg-swarm-gold
 focus:px-3
 focus:py-1.5
 focus:text-sm
 focus:font-medium
 focus:text-swarm-bg
 focus:shadow-lg
 focus:outline-none
 "
 >
 Skip to main content
 </a>
 );
}

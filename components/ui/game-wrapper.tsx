'use client'

/**
 * GameWrapper — responsive shell for the child portal.
 *
 * Mobile  (< lg): flex-col — TopHUD top, scrollable content, BottomNav bottom
 * Desktop (≥ lg): flex-row — ChildSideNav left, TopHUD + scrollable content right
 *
 * Uses trapped scroll (overflow-y-auto on inner content div) so TopHUD and
 * BottomNav/SideNav stay fixed in place at all viewport sizes.
 */

export function GameWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex flex-col lg:flex-row"
      style={{
        height: '100dvh',
        overflow: 'hidden',
        background: '#060a06',
      }}
    >
      {children}
    </div>
  )
}

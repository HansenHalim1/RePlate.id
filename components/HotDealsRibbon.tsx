import React from "react"

type HotDealsRibbonProps = {
  text?: string
}

/**
 * Ribbon banner that matches the figma “Hot Deals!!” treatment.
 */
const HotDealsRibbon: React.FC<HotDealsRibbonProps> = ({ text = "Hot Deals!!" }) => {
  return (
    <div className="pointer-events-none absolute left-4 sm:left-10 top-0 sm:top-6 -rotate-12 z-20">
      <div className="relative inline-block">
        <div className="absolute inset-0 bg-[#7D8D2A] skew-x-[-15deg] rounded-md shadow-xl" />
        <span className="relative inline-block px-8 py-3 text-xl font-semibold text-white tracking-wide">
          {text}
        </span>
      </div>
    </div>
  )
}

export default HotDealsRibbon

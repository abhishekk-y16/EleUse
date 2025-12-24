"use client"
import Link from "next/link"
import { Zap, Settings, BarChart3, Map, Thermometer } from "lucide-react"

export function Sidebar() {
  const items = [
    { href: "/", icon: BarChart3, label: "Dashboard" },
    { href: "/analysis/temperature", icon: Thermometer, label: "Temperature Impact" },
    { href: "/analysis/geographic", icon: Map, label: "Geographic Data" },
  ]

  return (
    <div className="lg:col-span-1 bg-sidebar border-r border-sidebar-border p-6 h-screen overflow-y-auto sticky top-0 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-chart-1" />
          <span className="font-bold text-lg text-sidebar-foreground">EleUse</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Analysis Section */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wide">Analysis</h3>
          <nav className="space-y-2">
            {items.map((item, i) => (
              <Link
                key={i}
                href={item.href}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-sidebar-foreground hover:bg-sidebar-accent`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Settings removed */}
      </div>
    </div>
  )
}

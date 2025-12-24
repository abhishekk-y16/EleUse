"use client"

export function HeatmapChart() {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  // Mock data: 24 hours x 7 days
  const data = [
    [1800, 1600, 1500, 1400, 1600, 1900, 2200],
    [1700, 1500, 1400, 1300, 1500, 1800, 2100],
    [1600, 1400, 1300, 1200, 1400, 1700, 2000],
    [1500, 1300, 1200, 1100, 1300, 1600, 1900],
    [1600, 1400, 1300, 1200, 1400, 1700, 2000],
    [1800, 1600, 1500, 1400, 1600, 1900, 2200],
    [2100, 1900, 1800, 1700, 1900, 2200, 2500],
    [2300, 2100, 2000, 1900, 2100, 2400, 2700],
    [2400, 2200, 2100, 2000, 2200, 2500, 2800],
    [2500, 2300, 2200, 2100, 2300, 2600, 2900],
    [2600, 2400, 2300, 2200, 2400, 2700, 3000],
    [2700, 2500, 2400, 2300, 2500, 2800, 3100],
    [2800, 2600, 2500, 2400, 2600, 2900, 3200],
    [2900, 2700, 2600, 2500, 2700, 3000, 3300],
    [3000, 2800, 2700, 2600, 2800, 3100, 3400],
    [3100, 2900, 2800, 2700, 2900, 3200, 3500],
    [3200, 3000, 2900, 2800, 3000, 3300, 3600],
    [3100, 2900, 2800, 2700, 2900, 3200, 3500],
    [3000, 2800, 2700, 2600, 2800, 3100, 3400],
    [2900, 2700, 2600, 2500, 2700, 3000, 3300],
    [2800, 2600, 2500, 2400, 2600, 2900, 3200],
    [2700, 2500, 2400, 2300, 2500, 2800, 3100],
    [2600, 2400, 2300, 2200, 2400, 2700, 3000],
    [2400, 2200, 2100, 2000, 2200, 2500, 2800],
  ]

  const maxValue = Math.max(...data.flat())
  const minValue = Math.min(...data.flat())

  const getColor = (value: number) => {
    const normalized = (value - minValue) / (maxValue - minValue)
    if (normalized < 0.33) return "bg-chart-3"
    if (normalized < 0.66) return "bg-chart-1"
    return "bg-chart-2"
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left px-2 py-2 text-muted-foreground">Hour</th>
              {days.map((day) => (
                <th key={day} className="text-center px-1 py-2 text-muted-foreground">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hours.map((hour) => (
              <tr key={hour}>
                <td className="text-left px-2 py-1 text-muted-foreground font-mono">
                  {String(hour).padStart(2, "0")}:00
                </td>
                {days.map((_, dayIdx) => (
                  <td key={`${hour}-${dayIdx}`} className="text-center px-1 py-1">
                    <div
                      className={`w-8 h-8 rounded ${getColor(data[hour][dayIdx])} cursor-pointer hover:opacity-75`}
                      title={`${data[hour][dayIdx]} kW`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded bg-chart-3" />
          <span>Low</span>
          <div className="w-4 h-4 rounded bg-chart-1" />
          <span>Medium</span>
          <div className="w-4 h-4 rounded bg-chart-2" />
          <span>High</span>
        </div>
      </div>
    </div>
  )
}

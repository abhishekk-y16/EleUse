"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OverviewTab } from "./tabs/overview-tab"
import { CorrelationTab } from "./tabs/correlation-tab"
import { SeasonalTab } from "./tabs/seasonal-tab"
import { ForecastTab } from "./tabs/forecast-tab"
import { Sidebar } from "./sidebar"

export function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <aside className="hidden lg:block lg:col-span-1">
            <Sidebar />
          </aside>

          <main className="col-span-1 lg:col-span-4 p-6 overflow-y-auto">
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">EleUse</h1>
                <p className="text-muted-foreground">Weather-Augmented Electricity Demand Analysis</p>
              </div>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="correlation">Correlation</TabsTrigger>
                  <TabsTrigger value="seasonal">Seasonal</TabsTrigger>
                  <TabsTrigger value="forecast">Forecast</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <OverviewTab />
                </TabsContent>

                <TabsContent value="correlation" className="space-y-4">
                  <CorrelationTab />
                </TabsContent>

                <TabsContent value="seasonal" className="space-y-4">
                  <SeasonalTab />
                </TabsContent>

                <TabsContent value="forecast" className="space-y-4">
                  <ForecastTab />
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

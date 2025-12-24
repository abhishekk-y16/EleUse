export async function GET() {
  return Response.json({
    system: "EleUse",
    version: "1.0.0",
    status: "operational",
    endpoints: {
      weather: "/api/weather",
      train: "/api/models/train",
      predict: "/api/models/predict",
      analysis: "/api/analysis",
    },
  })
}

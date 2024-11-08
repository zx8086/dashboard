// backend/src/index.ts

import express from "express";
import cors from "cors";
import { getCorrelations, getClusterHealth } from "./elastic.js";
import { validateQueryParams } from "./types.js";

const app = express();
const port = 3007;

app.use(cors());
app.use(express.json());

// Update the correlations endpoint to use Express Request/Response
app.get("/api/correlations", async (req: express.Request, res: express.Response) => {
  try {
    const params = validateQueryParams({
      timeRange: req.query.timeRange as string,
      status: req.query.status ? parseInt(req.query.status as string) : undefined,
      application: req.query.application as string,
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined,
    });

    const result = await getCorrelations(params);
    res.json(result);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get("/api/health", async (req: express.Request, res: express.Response) => {
  try {
    const health = await getClusterHealth();
    res.json(health);
  } catch (error) {
    console.error(
      `🔴 Error checking health: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    res.status(503).json({
      error: error instanceof Error ? error.message : "Service Unavailable",
      timestamp: new Date().toISOString(),
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});

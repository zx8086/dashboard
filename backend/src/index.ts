// backend/src/index.ts

import express from "express";
import cors from "cors";
import { getCorrelations } from "./elastic.js";

const app = express();
const port = 3007;

app.use(cors());
app.use(express.json());

app.get("/api/correlations", async (req: express.Request, res: express.Response) => {
  try {
    const params = {
      timeRange: req.query.timeRange as string || '15m',
      environment: req.query.environment as string,
      status: req.query.status ? parseInt(req.query.status as string) : undefined,
      application: req.query.application as string,
      searchTerm: req.query.search as string,
      organization: req.query.organization as string,
      domain: req.query.domain as string,
      interfaceId: req.query.interfaceId as string,
      lastKey: req.query.lastKey as string
    };
    
    console.log('Received query params:', params);
    const result = await getCorrelations(params);
    res.json(result);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
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

app.get("/api/debug/mapping", async (req: express.Request, res: express.Response) => {
    try {
        const mapping = await elasticClient.indices.getMapping({
            index: "logs-mulesoft-default"
        });
        res.json(mapping);
    } catch (error) {
        console.error('Mapping error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get("/api/debug/environments", async (req: express.Request, res: express.Response) => {
    try {
        const result = await elasticClient.search({
            index: "logs-mulesoft-default",
            size: 0,
            aggs: {
                environments: {
                    terms: {
                        field: "environment",
                        size: 10
                    }
                }
            }
        });
        
        const environments = result.aggregations?.environments?.buckets || [];
        res.json({
            available_environments: environments,
            count: environments.length
        });
    } catch (error) {
        console.error('Environment check error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/metrics', async (c) => {
    try {
        const timeRange = c.query.timeRange || '1h';
        const metrics = await getPerformanceMetrics(timeRange);
        return c.json(metrics);
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});

// backend/src/index.ts

import express from "express";
import cors from "cors";
import { getClusterHealth, elasticClient, getCorrelations, getPerformanceMetrics } from "./elastic.js";

const app = express();
const port = 3007;

app.use(cors());
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.url}`);
    const startTime = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        console.log(`📤 ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
    });
    
    next();
});

app.get("/api/correlations", async (req: express.Request, res: express.Response) => {
    const requestId = Math.random().toString(36).substring(7);
    
    // Log raw request query parameters
    console.log(`🔍 [${requestId}] Raw Query Parameters:`, {
        query: req.query,
        url: req.url
    });

    try {
        const params = {
            timeRange: req.query.timeRange as string || '15m',
            environment: req.query.environment as string,
            status: req.query.status ? parseInt(req.query.status as string) : undefined,
            application: req.query.application as string,
            correlationId: req.query.correlationId as string,
            organization: req.query.organization as string,
            domain: req.query.domain as string,
            interfaceId: req.query.interfaceId as string,
            lastKey: req.query.lastKey as string
        };
        
        // Log parsed parameters and their types
        console.log(`📝 [${requestId}] Parsed Parameters:`, {
            params,
            types: Object.entries(params).reduce((acc, [key, value]) => ({
                ...acc,
                [key]: `${typeof value} => ${value}`
            }), {})
        });
        
        const result = await getCorrelations(params);

        // Log the query that was actually executed
        console.log(`🔎 [${requestId}] Elasticsearch Query:`, {
            filters: result.activeFilters, // We'll add this in elastic.ts
            totalBefore: result.totalBefore, // We'll add this in elastic.ts
            totalAfter: result.total,
            resultCount: result.data.length
        });

        res.json(result);
    } catch (error) {
        console.error(`❌ [${requestId}] Error:`, error);
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

app.get("/api/debug/query-preview", async (req: express.Request, res: express.Response) => {
    try {
        const params = {
            timeRange: req.query.timeRange as string || '15m',
            environment: req.query.environment as string,
            organization: req.query.organization as string,
            // ... other params ...
        };
        
        const must: any[] = [
            {
                range: {
                    "@timestamp": {
                        gte: `now-${params.timeRange}`,
                        lte: 'now'
                    }
                }
            }
        ];

        if (params.environment) {
            must.push({ term: { "environment": params.environment } });
        }
        if (params.organization) {
            must.push({ term: { "interface_metadata.org": params.organization } });
        }
        // ... other filters ...

        const searchParams = {
            index: "logs-mulesoft-default",
            size: 0,
            track_total_hits: true,
            query: { bool: { must } },
            // ... aggregations ...
        };

        res.json({
            params,
            query: searchParams,
            filters_applied: must.length - 1 // subtract the timestamp range
        });
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});

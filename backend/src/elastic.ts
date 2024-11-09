// backend/src/elastic.ts

import { Client } from "@elastic/elasticsearch";
import type { validateQueryParams, QueryParams } from "./types.ts";
// import { validateQueryParams } from './types';

type SearchResponse<T, A> = {
    took?: number;
    _shards: {
        total: number;
        successful: number;
        failed: number;
    };
    aggregations?: A;
};

interface CorrelationBucket {
  key: string;
  doc_count: number;
  applications: {
    buckets: Array<{ key: string; doc_count: number }>;
  };
  interface_desc: {
    buckets: Array<{ key: string; doc_count: number }>;
  };
  interface_id: {
    buckets: Array<{ key: string; doc_count: number }>;
  };
  business_entity: {
    buckets: Array<{ key: string; doc_count: number }>;
  };
  start_time: { value: number };
  end_time: { value: number };
  has_start: { doc_count: number };
  has_end: { doc_count: number };
  has_exception: { doc_count: number };
  status: { value: number };
}

interface CustomAggregations {
  total_correlations: { value: number };
  correlations: {
    buckets: CorrelationBucket[];
  };
  available_applications: {
    buckets: Array<{ key: string; doc_count: number }>;
  };
  available_interfaces: {
    buckets: Array<{ key: string; doc_count: number }>;
  };
  status_distribution: {
    buckets: Array<{ key: string; doc_count: number }>;
  };
}

class ElasticsearchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ElasticsearchError";
  }
}

const createElasticClient = () => {
  try {
    return new Client({
      node: "https://us-cld.es.us-east-1.aws.found.io",
      auth: {
        apiKey: "cEFyZUI1TUI1cVVLcVplR05nOTU6b25FYXVnWWVTRjZRMnlXSnZWc2JyQQ==",
      },
      maxRetries: 5,
      requestTimeout: 60000,
      tls: {
        rejectUnauthorized: true,
      },
    });
  } catch (error) {
    throw new ElasticsearchError(
      `Failed to create Elasticsearch client: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

export const elasticClient = createElasticClient();

const verifyClientConnection = async (client: Client) => {
  try {
    const health = await client.cluster.health();
    console.log(`🟢 Elasticsearch cluster status: ${health.status}`);
    return true;
  } catch (error) {
    console.error(
      `🔴 Failed to connect to Elasticsearch: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    throw new ElasticsearchError(
      `Failed to connect to Elasticsearch: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

verifyClientConnection(elasticClient).catch((error) => {
  console.error("❌ Fatal: Could not establish Elasticsearch connection");
  process.exit(1);
});

// Add a new interface for timing metrics
interface QueryMetrics {
    took: number;
    totalShards: number;
    successfulShards: number;
    skippedShards: number;
    failedShards: number;
    timestamp: string;
    params: QueryParams;
    cacheHit?: boolean;
}

// Add time range specific settings
const getTimeRangeSettings = (timeRange: string) => {
    if (timeRange === '24h') {
        return {
            batched_reduce_size: 1024, // Increase for larger time ranges
            max_concurrent_shard_requests: 3 // Reduce concurrent requests
        };
    }
    return {
        batched_reduce_size: 512,
        max_concurrent_shard_requests: 5
    };
};

export const getCorrelations = async (params: QueryParams = {}) => {
    try {
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

        if (params.status === 0) {
            must.push({
                bool: {
                    must: [
                        {
                            term: {
                                "tracePoint.keyword": "EXCEPTION"
                            }
                        }
                    ]
                }
            });
        }

        if (params.correlationId) {
            must.push({
                wildcard: {
                    "correlationId": {
                        value: `*${params.correlationId}*`,
                        case_insensitive: true
                    }
                }
            });
        }

        const searchParams = {
            index: "logs-mulesoft-default",
            size: 0,
            track_total_hits: true,
            query: {
                bool: { must }
            },
            aggs: {
                correlations: {
                    terms: {
                        field: "correlationId",
                        size: params.pageSize || 100,
                        order: { "start_time": "desc" }
                    },
                    aggs: {
                        applications: {
                            terms: {
                                field: "applicationName",
                                size: 10
                            }
                        },
                        interface_id: {
                            terms: {
                                field: "interfaceId",
                                size: 1
                            }
                        },
                        start_time: {
                            min: {
                                field: "@timestamp"
                            }
                        },
                        end_time: {
                            max: {
                                field: "@timestamp"
                            }
                        },
                        has_start: {
                            filter: {
                                term: {
                                    "tracePoint": "START"
                                }
                            }
                        },
                        has_end: {
                            filter: {
                                term: {
                                    "tracePoint": "END"
                                }
                            }
                        },
                        has_exception: {
                            filter: {
                                term: {
                                    "tracePoint": "EXCEPTION"
                                }
                            }
                        },
                        overall_status: {
                            bucket_script: {
                                buckets_path: {
                                    start: "has_start._count",
                                    end: "has_end._count",
                                    exception: "has_exception._count"
                                },
                                script: "if (params.exception > 0) return 0; if (params.start > 0 && params.end > 0) return 1; if (params.start > 0) return 2; return 3;"
                            }
                        }
                    }
                }
            }
        };

        if (typeof params.status === 'number') {
            searchParams.aggs.correlations.aggs.status_filter = {
                bucket_selector: {
                    buckets_path: {
                        status: "overall_status"
                    },
                    script: `params.status == ${params.status}`
                }
            };
        }

        console.log('Status filter debug:', {
            statusRequested: params.status,
            queryStructure: JSON.stringify(searchParams.aggs.correlations.aggs, null, 2)
        });

        const response = await elasticClient.search(searchParams);
        
        return {
            data: response.aggregations?.correlations?.buckets || [],
            total: response.hits.total,
            nextKey: response.aggregations?.correlations?.buckets?.length > 0 
                ? response.aggregations.correlations.buckets[response.aggregations.correlations.buckets.length - 1].key 
                : null
        };
    } catch (error) {
        console.error('Elasticsearch error:', error);
        throw error;
    }
};

// Function to store metrics (implement based on your needs)
async function storeQueryMetrics(metrics: QueryMetrics) {
    try {
        // Option 1: Store in Elasticsearch
        await elasticClient.index({
            index: 'correlation-query-metrics',
            document: metrics
        });

        // Option 2: Store in memory for short-term analysis
        queryMetricsCache.push(metrics);
        if (queryMetricsCache.length > 1000) {
            queryMetricsCache.shift();
        }

    } catch (error) {
        console.error('Failed to store query metrics:', error);
    }
}

// In-memory metrics cache
const queryMetricsCache: QueryMetrics[] = [];

// Add utility functions for metrics analysis
export const getQueryMetrics = (timeRange: string = '1h') => {
    const metrics = queryMetricsCache.filter(m => 
        new Date(m.timestamp).getTime() > Date.now() - parseTimeRange(timeRange)
    );

    return {
        totalQueries: metrics.length,
        averageQueryTime: metrics.reduce((acc, m) => acc + m.took, 0) / metrics.length,
        cacheHitRate: metrics.filter(m => m.cacheHit).length / metrics.length,
        shardStats: {
            avgTotalShards: metrics.reduce((acc, m) => acc + m.totalShards, 0) / metrics.length,
            avgFailedShards: metrics.reduce((acc, m) => acc + m.failedShards, 0) / metrics.length,
        },
        slowestQueries: metrics
            .sort((a, b) => b.took - a.took)
            .slice(0, 5)
    };
};

// Helper function to parse time ranges
function parseTimeRange(timeRange: string): number {
    const unit = timeRange.slice(-1);
    const value = parseInt(timeRange.slice(0, -1));
    
    switch(unit) {
        case 'h': return value * 60 * 60 * 1000;
        case 'm': return value * 60 * 1000;
        case 's': return value * 1000;
        default: return 3600000; // default 1h
    }
}

// Add an endpoint to expose metrics
export const getPerformanceMetrics = async (timeRange: string = '1h') => {
    try {
        // Get stored metrics
        const metrics = getQueryMetrics(timeRange);
        
        // Get cluster stats
        const clusterStats = await elasticClient.cluster.stats();
        
        return {
            queryMetrics: metrics,
            clusterHealth: {
                status: clusterStats.status,
                nodes: clusterStats.nodes.count,
                indices: clusterStats.indices.count,
                memory: clusterStats.nodes.os.mem,
            },
            optimizationStatus: {
                requestCacheEnabled: true,
                batchedReduceSize: 512,
                maxConcurrentShardRequests: 5,
                // ... other optimization settings
            }
        };
    } catch (error) {
        console.error('Failed to get performance metrics:', error);
        throw error;
    }
};

// Helper functions to manage pagination state
const correlationIdCache = new Map<number, string>();

function storeLastCorrelationId(page: number, correlationId: string) {
    correlationIdCache.set(page, correlationId);
}

function getLastCorrelationId(page: number): string | undefined {
    return correlationIdCache.get(page);
}

export const getClusterHealth = async () => {
  try {
    const health = await elasticClient.cluster.health();

    const indexCheck = await elasticClient.search({
      index: "logs-mulesoft-default",
      size: 0,
    });

    return {
      status: health.status,
      available: true,
      clusterInfo: {
        numberOfNodes: health.number_of_nodes,
        activeShards: health.active_shards,
        numberOfDataNodes: health.number_of_data_nodes,
        activePrimaryShards: health.active_primary_shards,
        clusterName: health.cluster_name,
      },
      indexInfo: {
        responseTime: indexCheck.took,
        totalShards: indexCheck._shards.total,
        successfulShards: indexCheck._shards.successful,
      },
    };
  } catch (error) {
    console.error("Health check failed:", error);
    return {
      status: "red",
      available: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    };
  }
};

export const verifyIndex = async () => {
    try {
        const indexExists = await elasticClient.indices.exists({
            index: "logs-mulesoft-default"
        });
        
        if (!indexExists) {
            console.error("Index does not exist!");
            return;
        }
    } catch (error) {
        console.error('Error verifying index:', error);
    }
};

verifyClientConnection(elasticClient)
    .then(() => verifyIndex())
    .catch((error) => {
        console.error("❌ Fatal: Could not establish Elasticsearch connection");
        process.exit(1);
    });

// Add performance tracking
const trackQueryPerformance = (metrics: QueryMetrics) => {
    const timeRange = metrics.params.timeRange;
    const environment = metrics.params.environment;
    
    console.log(`Performance Report:
        Time Range: ${timeRange}
        Environment: ${environment}
        Query Time: ${metrics.took}ms
        Total Time: ${metrics.executionTimeMs}ms
        Results: ${metrics.total}
        Cache Hit: ${metrics.cacheHit}
        Shards: ${metrics.successfulShards}/${metrics.totalShards}
    `);
};

// Add a simple cache for counts
const countCache = new Map<string, { count: number; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds

export const getTotalCount = async (params: QueryParams) => {
    const cacheKey = `${params.timeRange}-${params.environment}`;
    const now = Date.now();
    const cached = countCache.get(cacheKey);

    if (cached && (now - cached.timestamp) < CACHE_TTL) {
        return cached.count;
    }

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
        must.push({
            term: {
                "environment": params.environment
            }
        });
    }

    const result = await elasticClient.count({
        index: "logs-mulesoft-default",
        query: {
            bool: { must }
        }
    });

    countCache.set(cacheKey, {
        count: result.count,
        timestamp: now
    });

    return result.count;
};

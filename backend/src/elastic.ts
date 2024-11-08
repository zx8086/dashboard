// backend/src/elastic.ts

import { Client } from "@elastic/elasticsearch";
import type { QueryParams } from "./types.ts";

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

export const getCorrelations = async (params: QueryParams = {}) => {
    console.log('Received params:', params);
    try {
        const must: any[] = [
            {
                range: {
                    timestamp: {
                        gte: `now-${params.timeRange}`,
                        lte: 'now'
                    }
                }
            }
        ];

        // Alternative search implementation
        if (params.search) {
            must.push({
                wildcard: {
                    correlationId: {
                        value: `*${params.search.toLowerCase()}*`
                    }
                }
            });
        }

        const result = await elasticClient.search({
            index: "logs-mulesoft-default",
            size: 0,
            query: {
                bool: { must }
            },
            aggs: {
                correlations: {
                    terms: {
                        field: "correlationId",
                        size: 2000,
                        order: { "start_time": "desc" }
                    },
                    aggs: {
                        applications: {
                            terms: {
                                field: "applicationName",
                                size: 10
                            }
                        },
                        interface_desc: {
                            terms: {
                                field: "interfaceDesc",
                                size: 1
                            }
                        },
                        interface_id: {
                            terms: {
                                field: "interfaceId",
                                size: 1
                            }
                        },
                        business_entity: {
                            terms: {
                                field: "businessEntity",
                                size: 1
                            }
                        },
                        start_time: {
                            min: {
                                field: "timestamp"
                            }
                        },
                        end_time: {
                            max: {
                                field: "timestamp"
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
                                    starts: "has_start._count",
                                    ends: "has_end._count",
                                    exceptions: "has_exception._count",
                                    apps: "applications._bucket_count"
                                },
                                script: "if (params.exceptions > 0) return 0; if (params.apps == 0) return 3; if (params.starts >= params.apps && params.ends >= params.apps) return 1; if (params.starts > 0) return 2; return 3;"
                            }
                        },
                        elapsed_time_ms: {
                            bucket_script: {
                                buckets_path: {
                                    start: "start_time.value",
                                    end: "end_time.value"
                                },
                                script: "params.end - params.start"
                            }
                        }
                    }
                }
            }
        });

        let buckets = result.aggregations?.correlations?.buckets || [];
        
        // Apply filters
        if (params.status !== undefined && params.status !== null) {
            buckets = buckets.filter(bucket => 
                bucket.overall_status && 
                bucket.overall_status.value === params.status
            );
        }

        // Apply pagination with increased page size
        const pageSize = params.pageSize || 50;
        const start = ((params.page || 1) - 1) * pageSize;
        const paginatedBuckets = buckets.slice(start, start + pageSize);

        return {
            data: paginatedBuckets,
            total: buckets.length,
            hasMore: buckets.length > (start + pageSize)
        };

    } catch (error) {
        console.error('Elasticsearch error:', error);
        throw error;
    }
};

// Helper function to calculate the after key for pagination
function getAfterKey(page: number, pageSize: number): string {
  return `${(page - 1) * pageSize}`;
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

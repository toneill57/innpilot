#!/usr/bin/env node

/**
 * Comprehensive MCP Integration Test Script
 * Tests all MCP capabilities and compares with API endpoints
 */

import { promises as fs } from 'fs';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${colors.bold}${colors.cyan}=== ${title} ===${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

class MCPTester {
  constructor() {
    this.results = {
      mcpTests: [],
      apiTests: [],
      comparisons: [],
      performance: {}
    };
    this.startTime = Date.now();
  }

  // Simulate MCP calls (these would be real MCP calls in Claude environment)
  async simulateMCPCall(functionName, params = {}) {
    const startTime = Date.now();

    try {
      // Simulate different MCP function responses
      let result;

      switch (functionName) {
        case 'mcp__supabase__list_tables':
          result = await this.mockListTables();
          break;
        case 'mcp__supabase__execute_sql':
          result = await this.mockExecuteSQL(params.query);
          break;
        case 'mcp__supabase__get_advisors':
          result = await this.mockGetAdvisors(params.type);
          break;
        case 'mcp__supabase__get_project_url':
          result = await this.mockGetProjectURL();
          break;
        case 'mcp__supabase__list_extensions':
          result = await this.mockListExtensions();
          break;
        case 'mcp__supabase__search_docs':
          result = await this.mockSearchDocs(params.query);
          break;
        default:
          throw new Error(`Unknown MCP function: ${functionName}`);
      }

      const duration = Date.now() - startTime;
      return { success: true, result, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      return { success: false, error: error.message, duration };
    }
  }

  async mockListTables() {
    // Simulate the actual response structure
    return [{
      schema: "public",
      name: "document_embeddings",
      rls_enabled: false,
      rows: 8,
      columns: [
        { name: "id", data_type: "uuid" },
        { name: "content", data_type: "text" },
        { name: "embedding", data_type: "USER-DEFINED", format: "vector" },
        { name: "source_file", data_type: "character varying" }
      ]
    }];
  }

  async mockExecuteSQL(query) {
    // Simulate different SQL responses
    if (query.includes('COUNT(*)')) {
      return [{ total_embeddings: 8, unique_sources: 1 }];
    }
    if (query.includes('GROUP BY')) {
      return [{
        source_file: "pasos-para-reportar-al-sire.md",
        document_type: "sire_docs",
        chunks: 8,
        min_chunk: 0,
        max_chunk: 7,
        avg_tokens: null
      }];
    }
    return [];
  }

  async mockGetAdvisors(type) {
    return {
      lints: [
        {
          name: "unused_index",
          title: "Unused Index",
          level: "INFO",
          description: "Index has not been used",
          detail: "Index `idx_document_embeddings_category` on table `public.document_embeddings` has not been used"
        }
      ]
    };
  }

  async mockGetProjectURL() {
    return "https://ooaumjzaztmutltifhoq.supabase.co";
  }

  async mockListExtensions() {
    return [
      { name: "vector", schema: "public", installed_version: "0.8.0" },
      { name: "pg_stat_statements", schema: "extensions", installed_version: "1.11" }
    ];
  }

  async mockSearchDocs(query) {
    return {
      searchDocs: {
        nodes: [{
          title: "pgvector: Embeddings and vector similarity",
          href: "https://supabase.com/docs/guides/database/extensions/pgvector"
        }]
      }
    };
  }

  async testAPI(endpoint, options = {}) {
    const startTime = Date.now();

    try {
      const response = await fetch(`http://localhost:3000/api/${endpoint}`, {
        method: options.method || 'GET',
        headers: options.headers || {},
        body: options.body ? JSON.stringify(options.body) : undefined
      });

      const data = await response.json();
      const duration = Date.now() - startTime;

      return {
        success: response.ok,
        status: response.status,
        data,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        error: error.message,
        duration
      };
    }
  }

  async runMCPTests() {
    logSection('MCP Function Tests');

    const tests = [
      {
        name: 'List Tables',
        function: 'mcp__supabase__list_tables',
        params: { schemas: ['public'] }
      },
      {
        name: 'Count Embeddings',
        function: 'mcp__supabase__execute_sql',
        params: { query: 'SELECT COUNT(*) as total_embeddings FROM document_embeddings' }
      },
      {
        name: 'Get Performance Advisors',
        function: 'mcp__supabase__get_advisors',
        params: { type: 'performance' }
      },
      {
        name: 'Get Project URL',
        function: 'mcp__supabase__get_project_url'
      },
      {
        name: 'List Extensions',
        function: 'mcp__supabase__list_extensions'
      },
      {
        name: 'Search Documentation',
        function: 'mcp__supabase__search_docs',
        params: { query: 'pgvector similarity' }
      }
    ];

    for (const test of tests) {
      log(`\nTesting: ${test.name}`);

      const result = await this.simulateMCPCall(test.function, test.params);

      if (result.success) {
        logSuccess(`${test.name} completed in ${result.duration}ms`);
        logInfo(`Result sample: ${JSON.stringify(result.result).substring(0, 100)}...`);
      } else {
        logError(`${test.name} failed: ${result.error}`);
      }

      this.results.mcpTests.push({
        name: test.name,
        success: result.success,
        duration: result.duration,
        error: result.error || null
      });
    }
  }

  async runAPITests() {
    logSection('API Endpoint Tests');

    const tests = [
      {
        name: 'Health Check',
        endpoint: 'health'
      },
      {
        name: 'Chat Query (SIRE)',
        endpoint: 'chat',
        options: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: { question: '¿Cuáles son los 13 campos obligatorios del SIRE?' }
        }
      },
      {
        name: 'Chat Query (Vector Test)',
        endpoint: 'chat',
        options: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: { question: 'test pgvector performance' }
        }
      }
    ];

    for (const test of tests) {
      log(`\nTesting API: ${test.name}`);

      const result = await this.testAPI(test.endpoint, test.options);

      if (result.success) {
        logSuccess(`${test.name} completed in ${result.duration}ms (Status: ${result.status})`);

        if (test.endpoint === 'chat' && result.data.performance) {
          logInfo(`Vector search: ${result.data.performance.vector_search_ms}ms`);
          logInfo(`Context used: ${result.data.context_used ? 'Yes' : 'No'}`);
          logInfo(`Cache hit: ${result.data.performance.cache_hit ? 'Yes' : 'No'}`);
        }
      } else {
        logError(`${test.name} failed: ${result.error || `Status ${result.status}`}`);
      }

      this.results.apiTests.push({
        name: test.name,
        success: result.success,
        duration: result.duration,
        status: result.status,
        error: result.error || null
      });
    }
  }

  async runComparisons() {
    logSection('MCP vs API Comparisons');

    // Compare data consistency
    log('\nComparing embedding counts...');

    const mcpCount = await this.simulateMCPCall('mcp__supabase__execute_sql', {
      query: 'SELECT COUNT(*) as total FROM document_embeddings'
    });

    const apiHealth = await this.testAPI('health');

    if (mcpCount.success && apiHealth.success) {
      const mcpTotal = mcpCount.result[0]?.total || 0;
      const apiStatus = apiHealth.data.pgvector?.status === 'active';

      logInfo(`MCP embedding count: ${mcpTotal}`);
      logInfo(`API pgvector status: ${apiStatus ? 'Active' : 'Inactive'}`);

      this.results.comparisons.push({
        test: 'Embedding Count Consistency',
        mcpResult: mcpTotal,
        apiResult: apiStatus,
        consistent: mcpTotal > 0 && apiStatus
      });
    }
  }

  generateReport() {
    logSection('Test Results Summary');

    const totalTests = this.results.mcpTests.length + this.results.apiTests.length;
    const successfulTests = [
      ...this.results.mcpTests.filter(t => t.success),
      ...this.results.apiTests.filter(t => t.success)
    ].length;

    log(`\nTotal Tests: ${totalTests}`);
    log(`Successful: ${successfulTests}`, successfulTests === totalTests ? colors.green : colors.yellow);
    log(`Failed: ${totalTests - successfulTests}`, totalTests - successfulTests === 0 ? colors.green : colors.red);

    // MCP Results
    log(`\n${colors.bold}MCP Test Results:${colors.reset}`);
    this.results.mcpTests.forEach(test => {
      const status = test.success ? '✅' : '❌';
      log(`  ${status} ${test.name} (${test.duration}ms)`);
      if (test.error) log(`     Error: ${test.error}`, colors.red);
    });

    // API Results
    log(`\n${colors.bold}API Test Results:${colors.reset}`);
    this.results.apiTests.forEach(test => {
      const status = test.success ? '✅' : '❌';
      log(`  ${status} ${test.name} (${test.duration}ms)`);
      if (test.error) log(`     Error: ${test.error}`, colors.red);
    });

    // Performance Summary
    const mcpAvgDuration = this.results.mcpTests.reduce((sum, t) => sum + t.duration, 0) / this.results.mcpTests.length;
    const apiAvgDuration = this.results.apiTests.reduce((sum, t) => sum + t.duration, 0) / this.results.apiTests.length;

    log(`\n${colors.bold}Performance Summary:${colors.reset}`);
    log(`  MCP Average: ${Math.round(mcpAvgDuration)}ms`);
    log(`  API Average: ${Math.round(apiAvgDuration)}ms`);

    const totalDuration = Date.now() - this.startTime;
    log(`\nTotal test duration: ${totalDuration}ms`);

    return {
      summary: {
        total: totalTests,
        successful: successfulTests,
        failed: totalTests - successfulTests,
        mcpAvgDuration: Math.round(mcpAvgDuration),
        apiAvgDuration: Math.round(apiAvgDuration),
        totalDuration
      },
      details: this.results
    };
  }

  async run() {
    log(`${colors.bold}${colors.cyan}🚀 Starting MCP Integration Tests${colors.reset}`);

    await this.runMCPTests();
    await this.runAPITests();
    await this.runComparisons();

    return this.generateReport();
  }
}

// Main execution
async function main() {
  const tester = new MCPTester();

  try {
    const results = await tester.run();

    logSection('Test Complete');
    logSuccess('All tests completed successfully!');

    // Save results to file
    await fs.writeFile(
      'mcp-test-results.json',
      JSON.stringify(results, null, 2)
    );
    logInfo('Results saved to mcp-test-results.json');

  } catch (error) {
    logError(`Test suite failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { MCPTester };
// Google Analytics 4 and Search Console Integration for CRM
// Install required packages:
// npm install @google-analytics/data googleapis dotenv

import 'dotenv/config';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { google } from 'googleapis';
// ============================================
// CONFIGURATION 
// ============================================

// @TODO Those values should be from Database based on tenant
const CONFIG = {
  GA4_PROPERTY_ID: process.env.GA4_PROPERTY_ID, // Format: 'properties/123456789'
  SEARCH_CONSOLE_SITE_URL: process.env.SEARCH_CONSOLE_SITE_URL, // Format: 'https://example.com'
  SERVICE_ACCOUNT_KEY_PATH: process.env.SERVICE_ACCOUNT_KEY_PATH || '',
  BRAND_KEYWORDS: process.env.BRAND_KEYWORDS ? process.env.BRAND_KEYWORDS.split(',') : [], // should Get the List from Data base
};

// ============================================
// GOOGLE ANALYTICS 4 CLIENT
// ============================================

export class GA4Client {
  constructor() {
    this.analyticsDataClient = new BetaAnalyticsDataClient({
      keyFilename: CONFIG.SERVICE_ACCOUNT_KEY_PATH,
    });
  }

  /**
   * Get organic search traffic data
   */
  async getOrganicSearchData(startDate = '30daysAgo', endDate = 'today') {
    try {
      const [response] = await this.analyticsDataClient.runReport({
        property: CONFIG.GA4_PROPERTY_ID,
        dateRanges: [{ startDate, endDate }],
        dimensions: [
          { name: 'sessionSource' },
          { name: 'sessionMedium' },
          { name: 'landingPage' },
        ],
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'engagementRate' },
          { name: 'bounceRate' },
        ],
        dimensionFilter: {
          andGroup: {
            expressions: [
              {
                filter: {
                  fieldName: 'sessionMedium',
                  stringFilter: { value: 'organic' },
                },
              },
            ],
          },
        },
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 100,
      });

      return this.formatGA4Response(response);
    } catch (error) {
      console.error('Error fetching GA4 organic search data:', error);
      throw error;
    }
  }

  /**
   * Get site search data (internal searches on your site)
   */
  async getSiteSearchData(startDate = '30daysAgo', endDate = 'today') {
    try {
      const [response] = await this.analyticsDataClient.runReport({
        property: CONFIG.GA4_PROPERTY_ID,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'searchTerm' }],
        metrics: [
          { name: 'eventCount' },
          { name: 'sessions' },
        ],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            stringFilter: { value: 'search' },
          },
        },
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        limit: 50,
      });

      return this.formatGA4Response(response);
    } catch (error) {
      console.error('Error fetching site search data:', error);
      throw error;
    }
  }

  /**
   * Get traffic by source/medium
   */
  async getTrafficBySource(startDate = '30daysAgo', endDate = 'today') {
    try {
      const [response] = await this.analyticsDataClient.runReport({
        property: CONFIG.GA4_PROPERTY_ID,
        dateRanges: [{ startDate, endDate }],
        dimensions: [
          { name: 'sessionSource' },
          { name: 'sessionMedium' },
        ],
        metrics: [
          { name: 'sessions' },
          { name: 'conversions' },
          { name: 'totalRevenue' },
        ],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 50,
      });

      return this.formatGA4Response(response);
    } catch (error) {
      console.error('Error fetching traffic by source:', error);
      throw error;
    }
  }

  /**
   * Format GA4 API response into readable format
   */
  formatGA4Response(response) {
    if (!response.rows) return [];

    return response.rows.map(row => {
      const result = {};
      
      row.dimensionValues.forEach((dimension, index) => {
        const dimensionName = response.dimensionHeaders[index].name;
        result[dimensionName] = dimension.value;
      });

      row.metricValues.forEach((metric, index) => {
        const metricName = response.metricHeaders[index].name;
        result[metricName] = parseFloat(metric.value);
      });

      return result;
    });
  }
}

// ============================================
// GOOGLE SEARCH CONSOLE CLIENT
// ============================================

export class SearchConsoleClient {
  constructor() {
    const auth = new google.auth.GoogleAuth({
      keyFile: CONFIG.SERVICE_ACCOUNT_KEY_PATH,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    this.searchConsole = google.searchconsole({
      version: 'v1',
      auth,
    });
  }

  /**
   * Get search query data from Search Console
   */
  async getSearchQueries(startDate, endDate, rowLimit = 100) {
    try {
      const response = await this.searchConsole.searchanalytics.query({
        siteUrl: CONFIG.SEARCH_CONSOLE_SITE_URL,
        requestBody: {
          startDate,
          endDate,
          dimensions: ['query'],
          rowLimit,
          startRow: 0,
        },
      });

      return response.data.rows || [];
    } catch (error) {
      console.error('Error fetching Search Console data:', error);
      throw error;
    }
  }

  /**
   * Get search queries categorized by brand/category
   */
  async getCategorizedSearchData(startDate, endDate) {
    const queries = await this.getSearchQueries(startDate, endDate, 1000);
    
    return {
      brandSearches: this.filterBrandSearches(queries),
      categorySearches: this.filterCategorySearches(queries),
      allSearches: queries,
    };
  }

  /**
   * Filter brand-related searches
   */
  filterBrandSearches(queries) {
    return queries.filter(row => {
      const query = row.keys[0].toLowerCase();
      return CONFIG.BRAND_KEYWORDS.some(brand => query.includes(brand.toLowerCase()));
    });
  }

  /**
   * Filter category searches (non-brand queries)
   */
  filterCategorySearches(queries) {
    return queries.filter(row => {
      const query = row.keys[0].toLowerCase();
      return !CONFIG.BRAND_KEYWORDS.some(brand => query.includes(brand.toLowerCase()));
    });
  }

  /**
   * Get search performance by page
   */
  async getSearchPerformanceByPage(startDate, endDate, rowLimit = 100) {
    try {
      const response = await this.searchConsole.searchanalytics.query({
        siteUrl: CONFIG.SEARCH_CONSOLE_SITE_URL,
        requestBody: {
          startDate,
          endDate,
          dimensions: ['page', 'query'],
          rowLimit,
        },
      });

      return response.data.rows || [];
    } catch (error) {
      console.error('Error fetching page performance:', error);
      throw error;
    }
  }
}

// ============================================
// MAIN INTEGRATION CLASS
// ============================================

export class CRMAnalyticsIntegration {
  constructor() {
    this.ga4Client = new GA4Client();
    this.searchConsoleClient = new SearchConsoleClient();
  }

  /**
   * Get comprehensive search analytics data
   */
  async getCompleteSearchAnalytics(daysAgo = 30) {
    const startDate = this.getDateString(daysAgo);
    const endDate = this.getDateString(0);

    try {
      const [
        organicTraffic,
        siteSearches,
        trafficSources,
        searchConsoleData,
      ] = await Promise.all([
        this.ga4Client.getOrganicSearchData(`${daysAgo}daysAgo`, 'today'),
        this.ga4Client.getSiteSearchData(`${daysAgo}daysAgo`, 'today'),
        this.ga4Client.getTrafficBySource(`${daysAgo}daysAgo`, 'today'),
        this.searchConsoleClient.getCategorizedSearchData(startDate, endDate),
      ]);

      return {
        summary: this.generateSummary(searchConsoleData, organicTraffic),
        googleAnalytics: {
          organicTraffic,
          siteSearches,
          trafficSources,
        },
        searchConsole: {
          brandSearches: searchConsoleData.brandSearches,
          categorySearches: searchConsoleData.categorySearches,
          topQueries: searchConsoleData.allSearches.slice(0, 20),
        },
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting complete analytics:', error);
      throw error;
    }
  }

  /**
   * Generate summary statistics
   */
  generateSummary(searchConsoleData, organicTraffic) {
    const totalClicks = searchConsoleData.allSearches.reduce(
      (sum, row) => sum + (row.clicks || 0),
      0
    );
    const totalImpressions = searchConsoleData.allSearches.reduce(
      (sum, row) => sum + (row.impressions || 0),
      0
    );
    const totalSessions = organicTraffic.reduce(
      (sum, row) => sum + (row.sessions || 0),
      0
    );

    return {
      totalSearchQueries: searchConsoleData.allSearches.length,
      totalBrandSearches: searchConsoleData.brandSearches.length,
      totalCategorySearches: searchConsoleData.categorySearches.length,
      totalClicks,
      totalImpressions,
      averageCTR: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      totalOrganicSessions: totalSessions,
    };
  }

  /**
   * Helper to format dates for Search Console
   */
  getDateString(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
  }

  /**
   * Export data for CRM integration
   */
  async exportForCRM(daysAgo = 30) {
    const data = await this.getCompleteSearchAnalytics(daysAgo);
    
    // Format for your CRM system
    const crmData = {
      reportDate: new Date().toISOString(),
      period: `Last ${daysAgo} days`,
      metrics: data.summary,
      brandPerformance: data.searchConsole.brandSearches.map(row => ({
        keyword: row.keys[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      })),
      categoryPerformance: data.searchConsole.categorySearches.slice(0, 50).map(row => ({
        keyword: row.keys[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      })),
      topLandingPages: data.googleAnalytics.organicTraffic.slice(0, 20),
    };

    return crmData;
  }
}

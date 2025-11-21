import { google } from 'googleapis';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { AnalyticsAdminServiceClient } from '@google-analytics/admin';

class GoogleAnalyticsService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_ANALYTICS_CALLBACK_URL
    );

    // Scopes for BOTH Analytics and Search Console
    this.scopes = [
      'https://www.googleapis.com/auth/analytics.readonly',
      'https://www.googleapis.com/auth/webmasters.readonly', // For Search Console
      'https://www.googleapis.com/auth/webmasters'  // Full access (if needed for some operations)
    ];
  }

  // --- AUTHENTICATION METHODS ---

  getAuthUrl() {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.scopes,
      prompt: 'consent',
    });
  }

  async getTokensFromCode(code) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  // --- HELPER: CLIENT FACTORIES ---

  _getGa4Client(refreshToken) {
    return new BetaAnalyticsDataClient({
      credentials: {
        type: 'authorized_user',
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
      },
    });
  }

  _getSearchConsoleClient(refreshToken) {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({ refresh_token: refreshToken });
    return google.searchconsole({ version: 'v1', auth });
  }

  // --- GA4 ADMIN METHODS ---

  async listProperties(refreshToken) {
    const adminClient = new AnalyticsAdminServiceClient({
      credentials: {
        type: 'authorized_user',
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
      },
    });

    const [response] = await adminClient.listAccountSummaries();
    
    const properties = response.map(res => res.propertySummaries?.map(prop => ({
      accountName: res.account,
      propertyName: prop?.displayName,
      propertyId: prop?.property?.split('/')[1],
      ...prop
    })));
    return {
      message: "Pick a Property ID and save it to your DB!",
      available_properties: properties
    };
  }

  // --- GA4 DATA METHODS ---

  async getOrganicTraffic(refreshToken, propertyId, startDate, endDate) {
    const client = this._getGa4Client(refreshToken);
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
      dimensionFilter: {
        filter: {
          fieldName: 'sessionDefaultChannelGroup',
          stringFilter: { value: 'Organic Search', matchType: 'CONTAINS_CASE_INSENSITIVE' }
        }
      }
    });
    return response;
  }

  async getSiteSearches(refreshToken, propertyId, startDate, endDate) {
    const client = this._getGa4Client(refreshToken);
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'searchTerm' }], // Requires Enhanced Measurement enabled in GA4
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: { value: 'view_search_results' }
        }
      }
    });
    return response;
  }

  async getTrafficSources(refreshToken, propertyId, startDate, endDate) {
    const client = this._getGa4Client(refreshToken);
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'sessionSourceMedium' }],
      metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }]
    });
    return response;
  }

  // --- SEARCH CONSOLE METHODS ---

  async getSearchQueries(refreshToken, siteUrl, startDate, endDate, limit = 100) {
    const sc = this._getSearchConsoleClient(refreshToken);
    const res = await sc.searchanalytics.query({
      siteUrl: siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: limit
      }
    });
    return res.data.rows || [];
  }

  async getPagePerformance(refreshToken, siteUrl, startDate, endDate, limit = 100) {
    const sc = this._getSearchConsoleClient(refreshToken);
    const res = await sc.searchanalytics.query({
      siteUrl: siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['page'],
        rowLimit: limit
      }
    });
    return res.data.rows || [];
  }

  // Special method for Brand vs Category categorization
  async getCategorizedSearchData(refreshToken, siteUrl, startDate, endDate) {
    const sc = this._getSearchConsoleClient(refreshToken);
    const res = await sc.searchanalytics.query({
      siteUrl: siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: 1000
      }
    });

    const rows = res.data.rows || [];
    // Simple categorization logic (customize 'brandKeywords' as needed)
    // In a real app, pass the brand name dynamically
    const brandKeywords = ['mybrand', 'company name']; 
    
    const brandSearches = rows.filter(r => brandKeywords.some(k => r.keys[0].toLowerCase().includes(k)));
    const categorySearches = rows.filter(r => !brandKeywords.some(k => r.keys[0].toLowerCase().includes(k)));

    return { brandSearches, categorySearches };
  }

  // --- AGGREGATED METHODS ---

  async getCompleteSearchAnalytics(refreshToken, gaPropertyId, scSiteUrl, days) {
    const endDate = new Date().toISOString().split('T')[0];
    const startDateObj = new Date();
    startDateObj.setDate(startDateObj.getDate() - days);
    const startDate = startDateObj.toISOString().split('T')[0];

    const [gaData, scData] = await Promise.all([
      this.getTrafficSources(refreshToken, gaPropertyId, startDate, endDate),
      this.getSearchQueries(refreshToken, scSiteUrl, startDate, endDate, 50)
    ]);
    console.log('GA Data Retrieved:', gaData);
    console.log('SC Data Retrieved:', scData);

    return {
      googleAnalytics: gaData,
      searchConsole: scData,
      summary: {
        totalTraffic: gaData.rows ? gaData.rows.reduce((acc, row) => acc + parseInt(row.metricValues[0].value), 0) : 0,
        topQuery: scData.length > 0 ? scData[0].keys[0] : 'N/A'
      }
    };

  // FIX: Again, pass raw credentials directly.
  const analyticsDataClient = new BetaAnalyticsDataClient({
    credentials: {
      type: 'authorized_user',
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
    },
  });

  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${gaPropertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'activeUsers' }]
    });

    return response;

  } catch (error) {
    throw error;
  }
  }
}

export default new GoogleAnalyticsService();
import googleAnalyticsService from '../services/googleAnalyticsService.js';

class AnalyticsController {
  
  // --- AUTH FLOW START ---
  connect(req, res) {
    try {
      const url = googleAnalyticsService.getAuthUrl();
      res.redirect(url);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async callback(req, res) {
    try {
      const { code } = req.query;
      const tokens = await googleAnalyticsService.getTokensFromCode(code);
      
      console.log("REFRESH TOKEN ACQUIRED:", tokens.refresh_token);
      
      // Redirect user to frontend, passing the token (IN PRODUCTION: Save to DB, don't expose in URL)
      res.redirect(`/api/v1/analytics/list-properties?refreshToken=${tokens.refresh_token}`);
    } catch (error) {
      console.error('Auth Callback Error:', error);
      res.status(500).send("Authentication Failed");
    }
  }
  // --- AUTH FLOW END ---

  async listProperties(req, res) {
    try {
      const { refreshToken } = req.query;
      if (!refreshToken) return res.status(401).json({ error: "No refresh token provided" });

      const properties = await googleAnalyticsService.listProperties(refreshToken);
      res.json({ success: true, count: properties.length, data: properties });
    } catch (error) {
      console.error('List Properties Error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getCompleteAnalytics(req, res) {
    try {
      const { days = 30, refreshToken, propertyId, siteUrl } = req.query;
      const daysNum = parseInt(days, 10);

      if (!refreshToken || !propertyId || !siteUrl) {
        return res.status(400).json({ error: "Missing credentials: refreshToken, propertyId, or siteUrl" });
      }

      const data = await googleAnalyticsService.getCompleteSearchAnalytics(refreshToken, propertyId, siteUrl, daysNum);
      res.json({ success: true, data });
    } catch (error) {
      console.error('Error in getCompleteAnalytics:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getOrganicTraffic(req, res) {
    try {
      const { startDate = '30daysAgo', endDate = 'today', refreshToken, propertyId } = req.query;
      
      const response = await googleAnalyticsService.getOrganicTraffic(refreshToken, propertyId, startDate, endDate);
      
      const cleanData = response.rows ? response.rows.map(row => ({
        date: row.dimensionValues[0].value,
        users: parseInt(row.metricValues[0].value),
        sessions: parseInt(row.metricValues[1].value)
      })) : [];

      res.json({ success: true, data: cleanData, count: cleanData.length });
    } catch (error) {
      console.error('Error in getOrganicTraffic:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getSiteSearches(req, res) {
    try {
      const { startDate = '30daysAgo', endDate = 'today', refreshToken, propertyId } = req.query;

      const response = await googleAnalyticsService.getSiteSearches(refreshToken, propertyId, startDate, endDate);

      const cleanData = response.rows ? response.rows.map(row => ({
        searchTerm: row.dimensionValues[0].value,
        count: parseInt(row.metricValues[0].value)
      })) : [];

      res.json({ success: true, data: cleanData, count: cleanData.length });
    } catch (error) {
      console.error('Error in getSiteSearches:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getTrafficSources(req, res) {
    try {
      const { startDate = '30daysAgo', endDate = 'today', refreshToken, propertyId } = req.query;

      const response = await googleAnalyticsService.getTrafficSources(refreshToken, propertyId, startDate, endDate);

      const cleanData = response.rows ? response.rows.map(row => ({
        sourceMedium: row.dimensionValues[0].value,
        users: parseInt(row.metricValues[0].value)
      })) : [];

      res.json({ success: true, data: cleanData, count: cleanData.length });
    } catch (error) {
      console.error('Error in getTrafficSources:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getSearchQueries(req, res) {
    try {
      const { days = 30, limit = 100, refreshToken, siteUrl } = req.query;
      const daysNum = parseInt(days, 10);
      const limitNum = parseInt(limit, 10);
      
      const endDate = new Date().toISOString().split('T')[0];
      const startDateObj = new Date();
      startDateObj.setDate(startDateObj.getDate() - daysNum);
      const startDate = startDateObj.toISOString().split('T')[0];

      const data = await googleAnalyticsService.getSearchQueries(refreshToken, siteUrl, startDate, endDate, limitNum);

      res.json({ success: true, data, count: data.length });
    } catch (error) {
      console.error('Error in getSearchQueries:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getBrandSearches(req, res) {
    try {
      const { days = 30, refreshToken, siteUrl } = req.query;
      const daysNum = parseInt(days, 10);
      
      const endDate = new Date().toISOString().split('T')[0];
      const startDateObj = new Date();
      startDateObj.setDate(startDateObj.getDate() - daysNum);
      const startDate = startDateObj.toISOString().split('T')[0];

      const { brandSearches } = await googleAnalyticsService.getCategorizedSearchData(refreshToken, siteUrl, startDate, endDate);
      console.log("Brand Searches Retrieved:", brandSearches);
      res.json({
        success: true,
        data: brandSearches,
        count: brandSearches.length,
        totalClicks: brandSearches.reduce((sum, row) => sum + (row.clicks || 0), 0),
        totalImpressions: brandSearches.reduce((sum, row) => sum + (row.impressions || 0), 0),
      });
    } catch (error) {
      console.error('Error in getBrandSearches:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getCategorySearches(req, res) {
    try {
      const { days = 30, refreshToken, siteUrl } = req.query;
      const daysNum = parseInt(days, 10);
      
      const endDate = new Date().toISOString().split('T')[0];
      const startDateObj = new Date();
      startDateObj.setDate(startDateObj.getDate() - daysNum);
      const startDate = startDateObj.toISOString().split('T')[0];

      const { categorySearches } = await googleAnalyticsService.getCategorizedSearchData(refreshToken, siteUrl, startDate, endDate);

      res.json({
        success: true,
        data: categorySearches,
        count: categorySearches.length,
        totalClicks: categorySearches.reduce((sum, row) => sum + (row.clicks || 0), 0),
        totalImpressions: categorySearches.reduce((sum, row) => sum + (row.impressions || 0), 0),
      });
    } catch (error) {
      console.error('Error in getCategorySearches:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getPagePerformance(req, res) {
    try {
      const { days = 30, limit = 100, refreshToken, siteUrl } = req.query;
      const daysNum = parseInt(days, 10);
      const limitNum = parseInt(limit, 10);

      const endDate = new Date().toISOString().split('T')[0];
      const startDateObj = new Date();
      startDateObj.setDate(startDateObj.getDate() - daysNum);
      const startDate = startDateObj.toISOString().split('T')[0];

      const data = await googleAnalyticsService.getPagePerformance(refreshToken, siteUrl, startDate, endDate, limitNum);

      res.json({ success: true, data, count: data.length });
    } catch (error) {
      console.error('Error in getPagePerformance:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getSummary(req, res) {
    try {
      const { days = 30, refreshToken, propertyId, siteUrl } = req.query;
      // Re-use getCompleteAnalytics logic for summary
      const data = await googleAnalyticsService.getCompleteSearchAnalytics(refreshToken, propertyId, siteUrl, parseInt(days));
      console.log('Summary Data Retrieved:', data);
      res.json({ success: true, data: data.summary });
    } catch (error) {
      console.error('Error in getSummary:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async healthCheck(req, res) {
    res.json({
      success: true,
      status: 'healthy',
      message: 'Analytics Service (OAuth User Mode) is operational',
      timestamp: new Date().toISOString(),
    });
  }
}

// Singleton + Binding
const analyticsCtrl = new AnalyticsController();

export default {
  connect: analyticsCtrl.connect.bind(analyticsCtrl),
  callback: analyticsCtrl.callback.bind(analyticsCtrl),
  listProperties: analyticsCtrl.listProperties.bind(analyticsCtrl),
  getCompleteAnalytics: analyticsCtrl.getCompleteAnalytics.bind(analyticsCtrl),
  getOrganicTraffic: analyticsCtrl.getOrganicTraffic.bind(analyticsCtrl),
  getSiteSearches: analyticsCtrl.getSiteSearches.bind(analyticsCtrl),
  getTrafficSources: analyticsCtrl.getTrafficSources.bind(analyticsCtrl),
  getSearchQueries: analyticsCtrl.getSearchQueries.bind(analyticsCtrl),
  getBrandSearches: analyticsCtrl.getBrandSearches.bind(analyticsCtrl),
  getCategorySearches: analyticsCtrl.getCategorySearches.bind(analyticsCtrl),
  getPagePerformance: analyticsCtrl.getPagePerformance.bind(analyticsCtrl),
  getSummary: analyticsCtrl.getSummary.bind(analyticsCtrl),
  healthCheck: analyticsCtrl.healthCheck.bind(analyticsCtrl),
};
// routes/analyticsRoutes.js
import express from "express";
import analyticsController from "../controller/analyticsController.js";

const router = express.Router();

// ======================================================
//  AUTHENTICATION ROUTES
// ======================================================

/**
 * @swagger
 * /analytics/connect:
 *   get:
 *     summary: Initiate OAuth flow
 *     description: Redirects user to Google OAuth consent screen
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 */
router.get("/connect", analyticsController.connect);

/**
 * @swagger
 * /analytics/callback:
 *   get:
 *     summary: OAuth callback endpoint
 *     description: Handles the OAuth callback from Google
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Authorization code from Google
 *     responses:
 *       302:
 *         description: Redirect to list-properties with refresh token
 *       500:
 *         description: Authentication failed
 */
router.get("/callback", analyticsController.callback);

/**
 * @swagger
 * /analytics/list-properties:
 *   get:
 *     summary: List available GA4 properties
 *     description: Returns all GA4 properties the user has access to
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: refreshToken
 *         required: true
 *         schema:
 *           type: string
 *         description: OAuth refresh token
 *     responses:
 *       200:
 *         description: List of available properties
 *       401:
 *         description: No refresh token provided
 */
router.get("/list-properties", analyticsController.listProperties);

// ======================================================
//  HEALTH CHECK
// ======================================================

/**
 * @swagger
 * /analytics/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns OK status to verify analytics service is running
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Service is healthy
 */
router.get("/health", analyticsController.healthCheck);

// ======================================================
//  COMPLETE ANALYTICS
// ======================================================

/**
 * @swagger
 * /analytics/complete:
 *   get:
 *     summary: Get complete analytics (GA4 + Search Console)
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: refreshToken
 *         required: true
 *         schema:
 *           type: string
 *         description: OAuth refresh token
 *       - in: query
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *         description: GA4 property ID
 *       - in: query
 *         name: siteUrl
 *         required: true
 *         schema:
 *           type: string
 *         description: Search Console site URL
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to look back (default 30, max 365)
 *     responses:
 *       200:
 *         description: Complete analytics dataset
 *       400:
 *         description: Missing required parameters
 */
router.get("/complete", analyticsController.getCompleteAnalytics);

// ======================================================
//  SUMMARY
// ======================================================

/**
 * @swagger
 * /analytics/summary:
 *   get:
 *     summary: Get analytics summary
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: refreshToken
 *         required: true
 *         schema:
 *           type: string
 *         description: OAuth refresh token
 *       - in: query
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *         description: GA4 property ID
 *       - in: query
 *         name: siteUrl
 *         required: true
 *         schema:
 *           type: string
 *         description: Search Console site URL
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Days to look back (default 30)
 *     responses:
 *       200:
 *         description: Summary analytics data
 */
router.get("/summary", analyticsController.getSummary);

// ======================================================
//  GA4 ROUTES
// ======================================================

/**
 * @swagger
 * /analytics/organic-traffic:
 *   get:
 *     summary: Get organic search traffic (GA4)
 *     tags: [GA4]
 *     parameters:
 *       - in: query
 *         name: refreshToken
 *         required: true
 *         schema:
 *           type: string
 *         description: OAuth refresh token
 *       - in: query
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *         description: GA4 property ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           default: "30daysAgo"
 *         description: Start date (default 30daysAgo)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           default: "today"
 *         description: End date (default today)
 *     responses:
 *       200:
 *         description: Organic traffic results
 */
router.get("/organic-traffic", analyticsController.getOrganicTraffic);

/**
 * @swagger
 * /analytics/site-searches:
 *   get:
 *     summary: Get internal site search data (GA4)
 *     tags: [GA4]
 *     parameters:
 *       - in: query
 *         name: refreshToken
 *         required: true
 *         schema:
 *           type: string
 *         description: OAuth refresh token
 *       - in: query
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *         description: GA4 property ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           default: "30daysAgo"
 *         description: Start date (default 30daysAgo)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           default: "today"
 *         description: End date (default today)
 *     responses:
 *       200:
 *         description: Internal search queries from GA4
 */
router.get("/site-searches", analyticsController.getSiteSearches);

/**
 * @swagger
 * /analytics/traffic-sources:
 *   get:
 *     summary: Get traffic sources (GA4)
 *     tags: [GA4]
 *     parameters:
 *       - in: query
 *         name: refreshToken
 *         required: true
 *         schema:
 *           type: string
 *         description: OAuth refresh token
 *       - in: query
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *         description: GA4 property ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           default: "30daysAgo"
 *         description: Start date (optional)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           default: "today"
 *         description: End date (optional)
 *     responses:
 *       200:
 *         description: Traffic sources breakdown
 */
router.get("/traffic-sources", analyticsController.getTrafficSources);

// ======================================================
//  SEARCH CONSOLE ROUTES
// ======================================================

/**
 * @swagger
 * /analytics/search-queries:
 *   get:
 *     summary: Get search queries (Search Console)
 *     tags: [Search Console]
 *     parameters:
 *       - in: query
 *         name: refreshToken
 *         required: true
 *         schema:
 *           type: string
 *         description: OAuth refresh token
 *       - in: query
 *         name: siteUrl
 *         required: true
 *         schema:
 *           type: string
 *         description: Search Console site URL
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Days to look back (default 30)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Max results (default 100)
 *     responses:
 *       200:
 *         description: Search query list
 */
router.get("/search-queries", analyticsController.getSearchQueries);

/**
 * @swagger
 * /analytics/brand-searches:
 *   get:
 *     summary: Get brand-related search queries (Search Console)
 *     tags: [Search Console]
 *     parameters:
 *       - in: query
 *         name: refreshToken
 *         required: true
 *         schema:
 *           type: string
 *         description: OAuth refresh token
 *       - in: query
 *         name: siteUrl
 *         required: true
 *         schema:
 *           type: string
 *         description: Search Console site URL
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Days to look back (default 30)
 *     responses:
 *       200:
 *         description: Brand keyword analytics
 */
router.get("/brand-searches", analyticsController.getBrandSearches);

/**
 * @swagger
 * /analytics/category-searches:
 *   get:
 *     summary: Get non-brand/category search queries (Search Console)
 *     tags: [Search Console]
 *     parameters:
 *       - in: query
 *         name: refreshToken
 *         required: true
 *         schema:
 *           type: string
 *         description: OAuth refresh token
 *       - in: query
 *         name: siteUrl
 *         required: true
 *         schema:
 *           type: string
 *         description: Search Console site URL
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Days to look back (default 30)
 *     responses:
 *       200:
 *         description: Category search analytics
 */
router.get("/category-searches", analyticsController.getCategorySearches);

/**
 * @swagger
 * /analytics/page-performance:
 *   get:
 *     summary: Get landing page performance (Search Console)
 *     tags: [Search Console]
 *     parameters:
 *       - in: query
 *         name: refreshToken
 *         required: true
 *         schema:
 *           type: string
 *         description: OAuth refresh token
 *       - in: query
 *         name: siteUrl
 *         required: true
 *         schema:
 *           type: string
 *         description: Search Console site URL
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Days to look back (default 30)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Limit results (default 100)
 *     responses:
 *       200:
 *         description: Page performance statistics
 */
router.get("/page-performance", analyticsController.getPagePerformance);

export default router;
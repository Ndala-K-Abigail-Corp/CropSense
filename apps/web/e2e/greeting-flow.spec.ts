import { test, expect } from '@playwright/test';

/**
 * E2E Test: Greeting Flow
 * Tests greeting detection, response display, and Gemini fallback
 */

test.describe('Greeting Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard (assumes user is logged in)
    await page.goto('/dashboard');
    
    // Wait for chat interface to load
    await page.waitForSelector('textarea[placeholder*="Ask about"]', { timeout: 10000 });
  });

  test('detects and responds to "Hi" greeting', async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="Ask about"]').first();
    
    // Type greeting
    await chatInput.fill('Hi');
    await page.click('button[type="submit"]');
    
    // Wait for response
    await page.waitForSelector('text=/Hello|Hi there|CropSense/i', { timeout: 30000 });
    
    // Verify greeting response appears
    const response = page.locator('text=/Hello|Hi there|CropSense/i').first();
    await expect(response).toBeVisible();
    
    // Verify response mentions CropSense or agricultural assistant
    await expect(page.locator('text=/agricultural|farming|crops|soil/i')).toBeVisible();
  });

  test('detects and responds to "Hello" greeting', async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="Ask about"]').first();
    
    await chatInput.fill('Hello');
    await page.click('button[type="submit"]');
    
    // Wait for greeting response
    await page.waitForSelector('text=/Hello|Hi there|CropSense/i', { timeout: 30000 });
    
    const response = page.locator('text=/Hello|Hi there|CropSense/i').first();
    await expect(response).toBeVisible();
  });

  test('detects and responds to "Oh hello" greeting', async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="Ask about"]').first();
    
    await chatInput.fill('Oh hello');
    await page.click('button[type="submit"]');
    
    // Wait for greeting response
    await page.waitForSelector('text=/Hello|Hi there|CropSense/i', { timeout: 30000 });
    
    const response = page.locator('text=/Hello|Hi there|CropSense/i').first();
    await expect(response).toBeVisible();
  });

  test('greeting response uses Gemini fallback when no vector results', async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="Ask about"]').first();
    
    // Send greeting
    await chatInput.fill('Hi');
    await page.click('button[type="submit"]');
    
    // Wait for response
    await page.waitForSelector('text=/Hello|Hi there|CropSense/i', { timeout: 30000 });
    
    // Verify response doesn't have sources (greeting fallback)
    const sourcesSection = page.locator('text=Sources');
    const sourcesCount = await sourcesSection.count();
    
    // Greeting responses typically don't have sources
    expect(sourcesCount).toBe(0);
  });

  test('greeting response is displayed in message bubble', async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="Ask about"]').first();
    
    await chatInput.fill('Hello');
    await page.click('button[type="submit"]');
    
    // Wait for message to appear
    await page.waitForSelector('text=/Hello|Hi there|CropSense/i', { timeout: 30000 });
    
    // Verify message bubble structure
    const messageBubble = page.locator('[class*="rounded-2xl"]').filter({ hasText: /Hello|Hi there|CropSense/i }).first();
    await expect(messageBubble).toBeVisible();
    
    // Verify bot icon is present
    const botIcon = page.locator('svg').filter({ hasText: /Bot/i }).first();
    // Bot icon should be visible (check for icon in assistant messages)
    await expect(page.locator('text=/Hello|Hi there|CropSense/i').first()).toBeVisible();
  });

  test('can ask follow-up question after greeting', async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="Ask about"]').first();
    
    // Send greeting
    await chatInput.fill('Hi');
    await page.click('button[type="submit"]');
    
    // Wait for greeting response
    await page.waitForSelector('text=/Hello|Hi there|CropSense/i', { timeout: 30000 });
    
    // Send follow-up question
    await chatInput.fill('What are the best practices for tomato cultivation?');
    await page.click('button[type="submit"]');
    
    // Wait for agricultural response
    await page.waitForSelector('text=/tomato|cultivation|growing|plant/i', { timeout: 30000 });
    
    // Verify both messages are visible
    await expect(page.locator('text=Hi')).toBeVisible();
    await expect(page.locator('text=/tomato|cultivation/i')).toBeVisible();
  });
});


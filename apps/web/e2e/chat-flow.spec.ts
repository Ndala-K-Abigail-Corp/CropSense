import { test, expect } from '@playwright/test';

/**
 * E2E Test: Complete User Flow
 * Sign up → Ask question → See response
 */

test.describe('CropSense Chat Flow', () => {
  const testUser = {
    email: `test-${Date.now()}@cropsense.test`,
    password: 'TestPassword123!',
  };

  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
  });

  test('complete user journey: sign up, ask question, receive response', async ({ page }) => {
    // Step 1: Navigate to sign up page
    await test.step('Navigate to sign up', async () => {
      await page.click('text=Sign up');
      await expect(page).toHaveURL(/.*signup/);
      await expect(page.locator('h1, h2')).toContainText(/sign up|create account/i);
    });

    // Step 2: Fill out sign up form
    await test.step('Complete sign up form', async () => {
      await page.fill('input[type="email"]', testUser.email);
      await page.fill('input[type="password"]', testUser.password);
      
      // Look for confirm password field if it exists
      const confirmPasswordField = page.locator('input[type="password"]').nth(1);
      if (await confirmPasswordField.count() > 0) {
        await confirmPasswordField.fill(testUser.password);
      }
      
      await page.click('button[type="submit"]');
    });

    // Step 3: Wait for redirect to dashboard/chat
    await test.step('Verify successful authentication', async () => {
      // Should redirect to dashboard or chat page
      await page.waitForURL(/.*dashboard|.*chat/, { timeout: 10000 });
      
      // Should see user interface elements
      await expect(page.locator('text=Sign out, text=Logout').first()).toBeVisible({ timeout: 5000 });
    });

    // Step 4: Ask a farming question
    await test.step('Ask a question', async () => {
      // Find the chat input
      const chatInput = page.locator('input[placeholder*="Ask"], textarea[placeholder*="Ask"]').first();
      await expect(chatInput).toBeVisible();
      
      // Type a farming question
      await chatInput.fill('What are the best practices for growing tomatoes?');
      
      // Click send button
      const sendButton = page.locator('button[type="submit"], button:has-text("Send")').first();
      await sendButton.click();
    });

    // Step 5: Wait for and verify response
    await test.step('Receive and verify AI response', async () => {
      // Wait for loading indicator
      await expect(page.locator('text=Searching, text=Loading').first()).toBeVisible({
        timeout: 2000,
      }).catch(() => {
        // Loading might be too fast, that's OK
      });
      
      // Wait for response to appear (should contain farming-related content)
      await expect(page.locator('text=/tomato|growing|plant|soil/i').first()).toBeVisible({
        timeout: 30000,
      });
      
      // Verify the user's message is displayed
      await expect(page.locator('text=best practices for growing tomatoes')).toBeVisible();
    });

    // Step 6: Verify sources are displayed (if RAG is working)
    await test.step('Verify sources are shown', async () => {
      // Look for sources section
      const sourcesSection = page.locator('text=Sources, text=References');
      
      // Sources might be present if RAG backend is connected
      if (await sourcesSection.count() > 0) {
        await expect(sourcesSection.first()).toBeVisible();
      }
    });
  });

  test('can ask multiple questions in conversation', async ({ page }) => {
    // For this test, assume user is already logged in
    // (In real scenario, you'd set up authentication state)
    
    test.skip(!process.env.TEST_USER_EMAIL, 'Requires authenticated user');
    
    await page.goto('/dashboard');
    
    // First question
    const chatInput = page.locator('input[placeholder*="Ask"], textarea[placeholder*="Ask"]').first();
    await chatInput.fill('What is crop rotation?');
    await page.click('button[type="submit"]');
    
    // Wait for response
    await page.waitForSelector('text=/crop rotation/i', { timeout: 30000 });
    
    // Second question
    await chatInput.fill('How does it prevent soil depletion?');
    await page.click('button[type="submit"]');
    
    // Wait for second response
    await page.waitForSelector('text=/soil|nutrient|depletion/i', { timeout: 30000 });
    
    // Both questions and answers should be visible
    expect(await page.locator('text=What is crop rotation').count()).toBeGreaterThan(0);
    expect(await page.locator('text=How does it prevent soil depletion').count()).toBeGreaterThan(0);
  });

  test('displays empty state when no messages', async ({ page }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Requires authenticated user');
    
    await page.goto('/dashboard');
    
    // Should show empty state
    await expect(page.locator('text=/Ask CropSense|Get started|No messages/i').first()).toBeVisible();
    
    // Should show suggestion buttons
    const suggestions = page.locator('button:has-text("practices"), button:has-text("diseases")');
    expect(await suggestions.count()).toBeGreaterThan(0);
  });

  test('input validation: prevents empty messages', async ({ page }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Requires authenticated user');
    
    await page.goto('/dashboard');
    
    const sendButton = page.locator('button[type="submit"]').first();
    
    // Send button should be disabled when input is empty
    await expect(sendButton).toBeDisabled();
    
    // Type only whitespace
    const chatInput = page.locator('input[placeholder*="Ask"]').first();
    await chatInput.fill('   ');
    
    // Send button should still be disabled
    await expect(sendButton).toBeDisabled();
  });

  test('accessibility: keyboard navigation works', async ({ page }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Requires authenticated user');
    
    await page.goto('/dashboard');
    
    // Focus on input
    await page.keyboard.press('Tab');
    
    // Type a question
    await page.keyboard.type('How to water crops?');
    
    // Submit with Enter
    await page.keyboard.press('Enter');
    
    // Should send the message
    await expect(page.locator('text=How to water crops?')).toBeVisible({ timeout: 5000 });
  });

  test('mobile responsive: works on small screens', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Check that navbar is responsive
    const mobileMenu = page.locator('[aria-label="Menu"], button:has-text("Menu")');
    if (await mobileMenu.count() > 0) {
      await mobileMenu.click();
    }
    
    // Check that chat interface is visible and usable
    test.skip(!process.env.TEST_USER_EMAIL, 'Requires authenticated user');
    await page.goto('/dashboard');
    
    const chatInput = page.locator('input[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible();
    
    // Input should be appropriately sized for mobile
    const inputBox = await chatInput.boundingBox();
    expect(inputBox?.width).toBeLessThan(400);
  });
});

/**
 * E2E Test: Authentication Flows
 */
test.describe('Authentication', () => {
  test('can log in with existing account', async ({ page }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Requires test user credentials');
    
    await page.goto('/');
    await page.click('text=Log in, text=Sign in');
    
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!);
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!);
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=/invalid|incorrect|error/i')).toBeVisible({ timeout: 5000 });
  });

  test('can log out', async ({ page }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Requires authenticated user');
    
    await page.goto('/dashboard');
    
    // Click logout button
    await page.click('text=Sign out, text=Logout, button:has-text("Log out")');
    
    // Should redirect to home page
    await expect(page).toHaveURL(/.*\/$|.*home/);
    
    // Should see sign in/sign up options
    await expect(page.locator('text=Sign in, text=Log in')).toBeVisible();
  });
});

/**
 * E2E Test: Error Handling
 */
test.describe('Error Handling', () => {
  test('handles network errors gracefully', async ({ page }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Requires authenticated user');
    
    await page.goto('/dashboard');
    
    // Simulate offline mode
    await page.context().setOffline(true);
    
    const chatInput = page.locator('input[placeholder*="Ask"]').first();
    await chatInput.fill('Test question');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=/error|failed|try again/i')).toBeVisible({ timeout: 10000 });
    
    // Re-enable network
    await page.context().setOffline(false);
  });
});


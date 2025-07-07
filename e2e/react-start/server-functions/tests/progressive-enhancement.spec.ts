import { expect, test } from '@playwright/test'

test.describe('Progressive Enhancement with useServerFetcher', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/progressive-enhancement-test')
  })

  test('Form works with JavaScript enabled', async ({ page }) => {
    // Fill the form
    await page.fill('input[name="name"]', 'John Doe')
    await page.fill('input[name="age"]', '30')
    
    // Submit the form
    await page.click('button[type="submit"]')
    
    // Wait for the result
    await page.waitForSelector('[data-testid="result"]')
    
    // Check the result
    const result = await page.textContent('[data-testid="result"]')
    expect(result).toContain('Hello, John Doe! You are 30 years old.')
    
    // Check that we're still on the same page (no redirect)
    expect(page.url()).toContain('/progressive-enhancement-test')
    
    // Check the fetcher state
    const state = await page.textContent('[data-testid="fetcher-state"]')
    expect(state).toBe('idle')
  })

  test('Form works with JavaScript disabled', async ({ page, context }) => {
    // Disable JavaScript
    await context.route('**/*.js', (route) => route.abort())
    
    // Reload the page without JS
    await page.goto('/progressive-enhancement-test')
    
    // Fill the form
    await page.fill('input[name="name"]', 'Jane Smith')
    await page.fill('input[name="age"]', '25')
    
    // Submit the form
    await page.click('button[type="submit"]')
    
    // Wait for navigation back to the page
    await page.waitForURL(/progressive-enhancement-test/)
    
    // Check the result is displayed
    const result = await page.textContent('[data-testid="result"]')
    expect(result).toContain('Hello, Jane Smith! You are 25 years old.')
    
    // Check that the flash query param was removed
    expect(page.url()).not.toContain('__tsr_flash')
  })

  test('Form handles errors with JavaScript enabled', async ({ page }) => {
    // Submit form with invalid data
    await page.fill('input[name="name"]', '')
    await page.fill('input[name="age"]', 'not-a-number')
    
    await page.click('button[type="submit"]')
    
    // Wait for error
    await page.waitForSelector('[data-testid="error"]')
    
    // Check error message
    const error = await page.textContent('[data-testid="error"]')
    expect(error).toContain('Name is required')
  })

  test('Form handles errors with JavaScript disabled', async ({ page, context }) => {
    // Disable JavaScript
    await context.route('**/*.js', (route) => route.abort())
    
    // Reload the page without JS
    await page.goto('/progressive-enhancement-test')
    
    // Submit form with invalid data
    await page.fill('input[name="name"]', '')
    await page.fill('input[name="age"]', '20')
    
    await page.click('button[type="submit"]')
    
    // Wait for navigation back
    await page.waitForURL(/progressive-enhancement-test/)
    
    // Check error is displayed
    const error = await page.textContent('[data-testid="error"]')
    expect(error).toContain('Name is required')
  })

  test('Form handles redirects with JavaScript enabled', async ({ page }) => {
    await page.goto('/progressive-enhancement-redirect-test')
    
    // Fill the form
    await page.fill('input[name="name"]', 'Redirect Test')
    
    // Submit the form
    await page.click('button[type="submit"]')
    
    // Wait for redirect
    await page.waitForURL(/redirect-target/)
    
    // Check we're on the target page
    const content = await page.textContent('[data-testid="redirect-target"]')
    expect(content).toContain('Redirect Test')
  })

  test('Form handles redirects with JavaScript disabled', async ({ page, context }) => {
    // Disable JavaScript
    await context.route('**/*.js', (route) => route.abort())
    
    await page.goto('/progressive-enhancement-redirect-test')
    
    // Fill the form
    await page.fill('input[name="name"]', 'No JS Redirect')
    
    // Submit the form
    await page.click('button[type="submit"]')
    
    // Wait for redirect
    await page.waitForURL(/redirect-target/)
    
    // Check we're on the target page
    const content = await page.textContent('[data-testid="redirect-target"]')
    expect(content).toContain('No JS Redirect')
  })

  test('Multiple forms on same page work independently', async ({ page }) => {
    await page.goto('/progressive-enhancement-multiple')
    
    // Submit first form
    await page.fill('[data-testid="form1"] input[name="value"]', 'Form 1 Value')
    await page.click('[data-testid="form1"] button[type="submit"]')
    
    // Check first form result
    await page.waitForSelector('[data-testid="form1-result"]')
    const result1 = await page.textContent('[data-testid="form1-result"]')
    expect(result1).toContain('Form 1 Value')
    
    // Submit second form
    await page.fill('[data-testid="form2"] input[name="value"]', 'Form 2 Value')
    await page.click('[data-testid="form2"] button[type="submit"]')
    
    // Check second form result
    await page.waitForSelector('[data-testid="form2-result"]')
    const result2 = await page.textContent('[data-testid="form2-result"]')
    expect(result2).toContain('Form 2 Value')
    
    // Ensure first form result is still there
    expect(await page.textContent('[data-testid="form1-result"]')).toContain('Form 1 Value')
  })

  test('Form preserves other query parameters', async ({ page, context }) => {
    // Disable JavaScript
    await context.route('**/*.js', (route) => route.abort())
    
    // Go to page with existing query params
    await page.goto('/progressive-enhancement-test?existing=param&another=value')
    
    // Fill and submit form
    await page.fill('input[name="name"]', 'Query Test')
    await page.fill('input[name="age"]', '40')
    
    await page.click('button[type="submit"]')
    
    // Wait for navigation
    await page.waitForURL(/progressive-enhancement-test/)
    
    // Check that existing query params are preserved
    const url = new URL(page.url())
    expect(url.searchParams.get('existing')).toBe('param')
    expect(url.searchParams.get('another')).toBe('value')
    expect(url.searchParams.has('__tsr_flash')).toBe(false)
  })
})
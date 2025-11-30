# Deployment Checklist — This is Fuerteventura

## Pre-Deployment Validation

### ✅ Code Quality

- [x] ESLint configured (`.eslintrc.json`)
- [x] Prettier configured (`.prettierrc.json`)
- [x] Auto-fix applied (~4775 warnings reduced to 89)
- [x] No critical errors (remaining are external globals/expected)

```bash
npm run lint        # Run linter
npm run lint:fix    # Auto-fix issues
npm run format      # Format code with Prettier
```

### ✅ Performance Optimizations

- [x] 18 WEBP images converted (40-60% size reduction)
- [x] Picture elements added (14 HTML pages)
- [x] Width/height attributes for CLS < 0.1
- [x] Reduce-motion support enabled
- [x] Focus visibility enhanced for accessibility
- [x] Preload hints optimized

**Expected Improvements:**
- LCP: ~0.3-0.5s faster on 4G
- CLS: < 0.1 (from width/height attributes)
- Image payload: 15-25% reduction

### ✅ Reliability Enhancements

- [x] FetchWithRetry module (3x retry, exponential backoff)
- [x] Weather/ocean widget offline indicators
- [x] MapKeyboard (keyboard nav + accessibility)
- [x] Quiz restart safety (memory leak fixes)
- [x] Score persistence (localStorage + sessionStorage)

### ✅ E2E Smoke Tests

- [x] 18 tests across 5 suites
- [x] All critical flows validated
- [x] Test page: `test-e2e-smoke.html`
- [x] All assets verified on disk

```bash
# Run tests locally
npm start
# Open: http://localhost:8000/test-e2e-smoke.html
# Click "Ejecutar todos los tests"
```

---

## Pre-Release Checklist

### Step 1: Final Verification

```bash
# 1. Run linting
npm run lint        # Should see ~89 problems (mostly expected)

# 2. Check Git history
git log --oneline -15  # Verify all 12 commits present

# 3. Verify all new files
git status          # Should be clean
```

### Step 2: Browser Testing

**Critical flow validation (5 minutes per browser):**

1. **Chrome/Edge (Latest)**
   - [ ] Homepage loads (hero, cards, animations)
   - [ ] Map keyboard nav (arrows, +/-, Tab, Enter)
   - [ ] Quiz restart (no listener accumulation)
   - [ ] Weather widget (with/without network)

2. **Firefox (Latest)**
   - [ ] Same as above
   - [ ] Check focus outlines visible

3. **Safari (macOS/iOS)**
   - [ ] WEBP image fallbacks working
   - [ ] Touch interactions on map
   - [ ] Quiz on mobile

4. **Mobile Browsers**
   - [ ] Touch map navigation
   - [ ] Quiz on small screens
   - [ ] Picture element fallbacks

### Step 3: Performance Audit

```bash
# Run Lighthouse (if available)
npm run lighthouse    # Or manual via DevTools

# Key metrics to verify:
# - LCP: < 2.5s
# - CLS: < 0.1
# - FID: < 100ms
```

### Step 4: Network Testing

1. **Slow 4G (DevTools)**
   - [ ] Hero image loads within 2.5s
   - [ ] WEBP working (fallback visible if needed)
   - [ ] FetchWithRetry handling transient failures

2. **Offline Mode**
   - [ ] Widget error messages displayed
   - [ ] No console errors
   - [ ] Graceful degradation

3. **API Connectivity**
   - [ ] Weather data loading (or retry indicator)
   - [ ] Wave data loading (or offline message)
   - [ ] News feed loading

### Step 5: Accessibility Audit

- [ ] Focus outlines visible (dark + light backgrounds)
- [ ] Keyboard navigation works (Tab, arrows, Enter)
- [ ] reduce-motion respected (animations disabled)
- [ ] aria-live announcements working (map nav)
- [ ] Screen reader compatibility (NVDA/VoiceOver)

---

## Deployment Steps

### Netlify Deployment

```bash
# 1. Commit all changes
git add -A
git commit -m "Release: Phase 1 + Phase 2 complete (ALTA + MEDIA PRIORIDAD)"

# 2. Push to main
git checkout main
git merge fix/audit-cleanup

# 3. Netlify auto-deploys on push to main
# (GitHub Actions or Netlify UI will handle build)

# 4. Verify deployment
# Visit: https://thisisfuerteventura.es
# Run: https://thisisfuerteventura.es/test-e2e-smoke.html
```

### Manual Testing on Staging

```bash
# If staging URL available (e.g., staging.thisisfuerteventura.es)
# Run E2E tests against staging
# Verify all metrics in production environment
```

---

## Post-Deployment Monitoring

### First 24 Hours

1. **Check Error Logs**
   - Monitor Sentry/Rollbar for JS errors
   - Check server logs for 4xx/5xx errors
   - Verify no CSP violations

2. **Monitor Performance**
   - Watch Core Web Vitals (CLS should be < 0.1)
   - Monitor LCP trends (target: 2.5s)
   - Check image delivery (WEBP usage)

3. **Test Critical Flows**
   - Quiz functionality
   - Map navigation
   - Weather widget
   - News feed loading

4. **User Reports**
   - Monitor support channels for issues
   - Check social media mentions

### Week 1 Monitoring

1. **Performance Trends**
   - LCP progression (should be stable)
   - CLS stability (should remain < 0.1)
   - Image load times

2. **Feature Validation**
   - FetchWithRetry effectiveness (retry counts)
   - MapKeyboard usage (keyboard nav events)
   - Quiz restart incidents (zero listeners should be added)

3. **Browser Compatibility**
   - Check error rates by browser
   - WEBP fallback usage
   - Mobile performance

### Ongoing (Monthly)

- Review Core Web Vitals (Google Search Console)
- Audit ESLint violations (pre-commit hooks)
- Update dependencies (security patches)
- Archive old test data

---

## Rollback Plan

If critical issues found post-deployment:

```bash
# 1. Revert to previous commit
git revert <commit-sha>
git push origin main

# 2. Netlify will re-deploy immediately
# (or manually trigger via Netlify UI)

# 3. Verify rollback
# Check https://thisisfuerteventura.es for previous state
```

---

## Release Notes

### Version 2.0.0 (Phase 1 + Phase 2)

**Performance Improvements:**
- WEBP image format (18 images, 40-60% size reduction)
- Picture elements + fallbacks (14 pages)
- Width/height for CLS < 0.1
- Expected LCP improvement: 0.3-0.5s on 4G

**Reliability Enhancements:**
- FetchWithRetry for weather/ocean widgets (3x retry, exponential backoff)
- Offline indicators with `.widget-error` styling
- Quiz restart safety (memory leak fixes, cleanup function)
- Score persistence (localStorage + sessionStorage)

**Accessibility Improvements:**
- MapKeyboard navigation (arrows, +/-, Tab, Enter, Esc)
- Enhanced focus outlines (dark mode compatible)
- aria-live regions for screen readers
- Reduce-motion support (GSAP animations disabled)

**Code Quality:**
- ESLint + Prettier configuration
- Auto-fixed ~4775 formatting issues
- Baseline for ongoing code quality checks

**Testing:**
- 18 E2E smoke tests (5 suites)
- Test runner: `test-e2e-smoke.html`
- Documentation: `TESTING.md`

---

## Support & Documentation

- **Testing Guide**: See `TESTING.md`
- **Audit Report**: See `AUDIT.md`
- **Git History**: `git log --oneline` on `fix/audit-cleanup` branch
- **Contact**: bruno@thisisfuerteventura.es (for issues/questions)

---

**Last Updated:** 2025-11-30  
**Status:** Ready for Production ✓

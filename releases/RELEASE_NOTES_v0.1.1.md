# UIsentinel v0.1.1 Release Notes

**Release Date**: October 2, 2025  
**Type**: Feature Update  
**Status**: ✅ Ready for Release

---

## 🎉 What's New

### Advanced Zoom Capture Capabilities

UIsentinel v0.1.1 adds **precision zoom capture** for elements and regions, enabling UI/UX developers and AI agents to inspect UI components at any magnification level.

---

## ✨ New Features

### 1. Element Zoom Capture 🔬
Capture specific UI elements with zoom applied

**CLI:**
```bash
uisentinel element-zoom \
  --url http://localhost:3000 \
  --selector ".button" \
  --zoom 2 \
  --padding 10 \
  --name button_detail
```

**Use Cases:**
- Component detail inspection
- Button/icon quality verification
- Typography detail review
- Small UI element magnification

### 2. Region Zoom Capture 📐
Capture specific rectangular areas with zoom

**CLI:**
```bash
uisentinel region-zoom \
  --url http://localhost:3000 \
  -x 0 -y 0 \
  --width 400 --height 300 \
  --zoom 2 \
  --name hero_detail
```

**Use Cases:**
- Hero section detail view
- Layout detail inspection
- Pixel-perfect verification
- Print-quality region captures

---

## 📊 Complete Zoom Capabilities

| Mode | Command | Description |
|------|---------|-------------|
| **Page Zoom** | `zoom` | Full page with zoom (existing) |
| **Element Zoom** | `element-zoom` | Specific element zoomed 🆕 |
| **Region Zoom** | `region-zoom` | Rectangular area zoomed 🆕 |

---

## 🎯 Examples

### Detail Inspection
```bash
# Inspect button at 2x magnification
uisentinel element-zoom -u http://localhost:3000 -s ".button" -z 2 -n button_2x

# Verify icon quality at 3x
uisentinel element-zoom -u http://localhost:3000 -s ".icon" -z 3 -n icon_3x
```

### Layout Verification
```bash
# Zoom into hero section
uisentinel region-zoom -u http://localhost:3000 -x 0 -y 0 -w 600 --height 400 -z 2 -n hero_detail

# Check specific layout area
uisentinel region-zoom -u http://localhost:3000 -x 100 -y 100 -w 200 --height 150 -z 3 -n detail_area
```

### Responsive Testing
```bash
# Mobile button at 2x
uisentinel element-zoom -u http://localhost:3000 -s ".button" -z 2 --viewport mobile -n button_mobile_2x

# Desktop navigation detail
uisentinel element-zoom -u http://localhost:3000 -s "#nav" -z 1.5 --viewport desktop -n nav_desktop_detail
```

---

## 🔧 API Changes

### New Methods

**AdvancedCapture.captureElementWithZoom()**
```javascript
const screenshot = await advCapture.captureElementWithZoom({
  selector: '.button',
  zoom: 2,
  padding: 10,
  path: 'button_detail.png'
});
```

**AdvancedCapture.captureRegionWithZoom()**
```javascript
const screenshot = await advCapture.captureRegionWithZoom({
  x: 0,
  y: 0,
  width: 400,
  height: 300,
  zoom: 2,
  path: 'region_detail.png'
});
```

---

## 📚 Documentation Updates

- ✅ **docs/advanced-capture.md** - Added zoom examples
- ✅ **README.md** - Updated feature list
- ✅ **examples/zoom-capture-demo.js** - Working demo
- ✅ **COMMAND_REFERENCE.md** - CLI command reference

---

## 🧪 Testing

### Test Results
✅ **All tests passing**

**Tested Scenarios:**
- Element zoom (2x, 1.5x, 3x)
- Region zoom (2x, 3x)
- Page zoom (2x, 0.5x - existing)
- With padding variations
- Multiple viewports
- Edge cases (small elements, large regions)

**Screenshots Generated:** 7 test files
- `element_h1_2x_zoom.png` ✅
- `element_p_1.5x_zoom.png` ✅
- `region_400x300_2x_zoom.png` ✅
- `region_200x150_3x_zoom.png` ✅
- `page_2x_zoom.png` ✅
- `page_overview_0.5x_zoom.png` ✅
- `element_h1_normal.png` ✅ (baseline)

---

## 🚀 Migration Guide

### From v0.1.0 to v0.1.1

**No Breaking Changes!** All existing functionality remains the same.

**What's New:**
```bash
# New CLI commands available
uisentinel element-zoom --help
uisentinel region-zoom --help
```

**Programmatic API:**
```javascript
// New methods available
const advCapture = sentinel.getBrowserEngine().getAdvancedCapture(page);
await advCapture.captureElementWithZoom({ ... });
await advCapture.captureRegionWithZoom({ ... });
```

---

## 📦 Installation

### Update
```bash
npm update -g uisentinel
```

### Fresh Install
```bash
npm install -g uisentinel
npx playwright install chromium
```

### Verify
```bash
uisentinel --version
# Should show: 0.1.1
```

---

## 🎓 Quick Start

```bash
# Try element zoom
uisentinel element-zoom \
  --url https://example.com \
  --selector h1 \
  --zoom 2 \
  --name heading_detail

# Try region zoom
uisentinel region-zoom \
  --url https://example.com \
  -x 0 -y 0 \
  --width 400 --height 300 \
  --zoom 2 \
  --name region_detail

# Run demo
npm run example:zoom
```

---

## 🐛 Bug Fixes

None in this release (feature-only update)

---

## 🔮 What's Next

Potential future enhancements (community feedback welcome):
- Video recording
- Animated GIF generation
- PDF reports with captures
- Side-by-side comparison views
- AI-powered component detection

---

## 📊 Stats

- **New Files**: 4
- **Modified Files**: 6
- **New CLI Commands**: 2
- **New API Methods**: 2
- **Documentation**: 600+ lines updated
- **Test Coverage**: 7 scenarios
- **Lines of Code**: +2,328

---

## 👥 Contributors

- @mhjabreel

---

## 🙏 Acknowledgments

Built with:
- Playwright (browser automation)
- TypeScript (type safety)
- Commander.js (CLI framework)
- axe-core (accessibility testing)

---

## 📝 Full Changelog

### Added
- Element zoom capture (`element-zoom` command)
- Region zoom capture (`region-zoom` command)
- `captureElementWithZoom()` API method
- `captureRegionWithZoom()` API method
- Comprehensive zoom documentation
- Working zoom demo example

### Changed
- Updated README.md with zoom features
- Enhanced advanced-capture.md guide
- Updated feature checklist

### Fixed
- None

---

## 🎯 Summary

**v0.1.1** brings **precision zoom capabilities** to UIsentinel, enabling developers and AI agents to inspect UI components and regions at any magnification level - perfect for:

✅ Component quality verification  
✅ Typography and icon inspection  
✅ Pixel-perfect layout checks  
✅ Design system documentation  
✅ Print-quality captures  

**Install today and start zooming into your UI details!** 🔍✨

---

## 📞 Support

- **Issues**: https://github.com/mhjabreel/uisentinel/issues
- **Documentation**: https://github.com/mhjabreel/uisentinel
- **Examples**: `examples/` directory

---

**Happy Capturing with Zoom!** 📸🔍

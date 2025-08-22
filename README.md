# Precision AEO Website Grader

A comprehensive Answer Engine Optimization (AEO) analysis tool specifically designed for healthcare and life sciences companies. This tool helps pharma companies optimize their content for AI-powered search engines like ChatGPT, Claude, Perplexity, and Google's AI.

## 🎯 Purpose

As AI search engines become increasingly important for healthcare information discovery, traditional SEO isn't enough. This tool performs **real website analysis** to evaluate sites against AEO best practices, with a special focus on YMYL (Your Money or Your Life) healthcare content requirements.

## ✨ Key Features

### 🔬 Real Website Analysis
- **Live Performance Testing**: Integrates with Google PageSpeed Insights API for real performance, accessibility, and SEO scores
- **Content Structure Analysis**: Actually crawls and analyzes HTML structure, headings, meta tags, and schema markup
- **Healthcare Content Review**: Scans content for medical authority signals, citations, regulatory mentions, and compliance indicators
- **Fallback Analysis**: When live analysis isn't possible, provides intelligent domain-based assessment

### 📊 Healthcare-Focused Scoring
- **6 Core AEO Factors** with healthcare-specific weighting:
  - Content Structure (25%)
  - Authority Signals (20%) 
  - Technical Optimization (20%)
  - Content Clarity (15%)
  - YMYL Compliance (10%)
  - User Experience (10%)

### 🎨 Advanced User Experience
- **Real-time Progress Updates**: Live analysis progress with detailed status messages
- **Enhanced Results Display**: Shows which analyses were successfully completed vs. rapid assessment
- **Instant PDF Reports**: Professional, branded PDF reports with detailed recommendations
- **Mobile-Responsive Design**: Optimized experience across all devices
- **Accessibility Compliant**: WCAG guidelines followed throughout

### 🏥 Healthcare-Specific Features
- **Medical Authority Detection**: Identifies author credentials (MD, PharmD, PhD)
- **Regulatory Compliance Checking**: Scans for FDA, EMA, NIH references
- **Medical Disclaimer Analysis**: Evaluates YMYL compliance elements
- **Healthcare Keyword Analysis**: Assesses content relevance across drug, condition, and safety categories
- **Citation and Reference Detection**: Identifies medical citations and peer-reviewed sources

## 🔧 Technical Architecture

### Real Analysis Capabilities
```javascript
// The tool performs actual website analysis including:
- Page speed and performance metrics via Google PageSpeed Insights API
- HTML content analysis via multiple CORS proxy attempts
- Structured data and schema markup detection
- Medical content authority signal analysis
- Technical SEO audit (meta tags, headings, accessibility)
- Healthcare-specific compliance checking
```

### Intelligent Fallback System
When full analysis isn't possible due to CORS restrictions or API limitations, the tool provides:
- Domain authority assessment
- Healthcare relevance scoring based on URL patterns
- Security configuration analysis
- Estimated scores based on domain characteristics

### Analysis Methods
1. **Enhanced Analysis**: Full website crawling + API data + content analysis
2. **Rapid Assessment**: Domain-based analysis with healthcare-specific scoring
3. **Hybrid Mode**: Combines available data sources for best possible analysis

## 📁 Project Structure

```
precision-aeo-grader/
├── index.html          # Main application interface
├── styles.css          # Complete styling with PAEO-2 design system
├── app.js             # Core analysis engine and UI logic
└── README.md          # This documentation
```

## ⚙️ Setup & Configuration

### Required Dependencies
- **jsPDF**: Loaded via CDN for PDF generation
- **Google Fonts**: Inter font family for professional typography

### Optional API Integration
For enhanced analysis, configure Google PageSpeed Insights API:
```javascript
// In app.js, replace with your API key:
const apiKey = 'YOUR_PAGESPEED_API_KEY'; // Get free key from Google Cloud Console
```

### Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 🔍 Analysis Algorithm

### Scoring Methodology
The tool uses a sophisticated scoring system that combines:

1. **Real Website Data** (when available):
   - Live performance metrics
   - Content structure analysis
   - Healthcare compliance indicators

2. **Domain Intelligence**:
   - Educational (.edu) and government (.gov) domains receive authority bonuses
   - Healthcare-specific domain patterns boost relevance scores
   - Platform detection (WordPress, Wix) may impact technical scores

3. **Healthcare-Specific Adjustments**:
   - Medical authority keywords: +8 points
   - Regulatory mentions (FDA, NIH): +12 points
   - Educational domains: +15 points
   - Missing HTTPS: -20 points
   - Poor performance scores: -15 points

### Content Analysis Features
- **Heading Hierarchy**: Analyzes H1-H6 structure and logical flow
- **Medical Authority**: Detects author credentials and expert qualifications
- **Citation Analysis**: Identifies references to clinical trials and peer-reviewed sources
- **Readability Assessment**: Calculates Flesch Reading Ease for healthcare content
- **Compliance Checking**: Scans for required medical disclaimers and safety information

## 🚀 Key Capabilities

### Real-Time Website Analysis
- Fetches live performance data from Google PageSpeed Insights
- Analyzes actual HTML content structure and meta information
- Evaluates healthcare-specific compliance elements
- Provides detailed technical SEO audit results

### Healthcare Content Intelligence
- Scans for medical keywords across 5 categories (drugs, conditions, authority, safety, medical)
- Identifies regulatory compliance indicators
- Evaluates author credential display
- Assesses medical citation and reference quality

### Professional Reporting
- Generates comprehensive PDF reports with scoring breakdown
- Includes specific, actionable recommendations
- Provides category-by-category analysis with real findings
- Offers lead capture for consulting services

## 🔒 Privacy & Security

- **Client-Side Processing**: All analysis happens in the browser
- **No Data Storage**: User inputs and results are never stored
- **GDPR Compliant**: No tracking or cookies without consent
- **PHI Safe**: Built with healthcare privacy requirements in mind
- **Secure by Design**: Uses HTTPS-only analysis and secure API calls

## 📱 Mobile Optimization

Fully responsive design featuring:
- Touch-optimized form inputs
- Adaptive layouts for all screen sizes
- Fast loading performance on mobile networks
- Accessible navigation and interactions

## 🎨 Design System

Built with the PAEO-2 design system including:
- Consistent color palette optimized for healthcare brands
- Professional typography with Inter font family
- Glassmorphism and modern UI elements
- High contrast ratios for accessibility
- Smooth animations and micro-interactions

## 🔧 Development Features

### Error Handling
- Graceful fallback when APIs are unavailable
- User-friendly error messages with retry options
- Progressive enhancement based on available data sources

### Performance Optimization
- Efficient DOM manipulation
- Optimized API calls with timeout handling
- Lazy loading of non-critical resources

### Accessibility
- Screen reader compatible
- Keyboard navigation support
- High contrast color schemes
- ARIA labels and semantic markup

## 🚦 Known Limitations

- CORS restrictions may limit content analysis for some websites
- PageSpeed Insights API requires key for full functionality
- Some websites with strict security policies may not be analyzable
- PDF generation may be slower on older mobile devices

## 🔮 Roadmap

- [ ] Integration with additional AI search APIs
- [ ] Expanded schema markup recommendations
- [ ] Competitor analysis features
- [ ] Historical scoring and progress tracking
- [ ] API endpoint for programmatic access
- [ ] Advanced healthcare content templates

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built specifically for healthcare and pharmaceutical marketing teams
- Designed with input from medical content strategists and compliance experts
- Optimized for the evolving landscape of AI-powered search

---

**Built with ❤️ for the healthcare community**

*Precision AEO - Where Healthcare Content Meets AI Search Optimization*
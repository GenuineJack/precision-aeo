# AEO Website Grader

A comprehensive Answer Engine Optimization (AEO) analysis tool specifically designed for healthcare and life sciences companies. This tool helps pharma companies optimize their content for AI-powered search engines like ChatGPT, Claude, Perplexity, and Google's AI.

## 🎯 Purpose

As AI search engines become increasingly important for healthcare information discovery, traditional SEO isn't enough. This tool analyzes websites against AEO best practices, with a special focus on YMYL (Your Money or Your Life) healthcare content requirements.

## ✨ Features

- **Healthcare-Focused Analysis**: Scoring algorithm tailored for pharmaceutical and medical content
- **6 Core AEO Factors**: 
  - Content Structure (25%)
  - Authority Signals (20%) 
  - Technical Optimization (20%)
  - Content Clarity (15%)
  - YMYL Compliance (10%)
  - User Experience (10%)
- **Instant PDF Reports**: Professional, shareable analysis reports
- **Mobile-Responsive Design**: Works seamlessly across devices
- **Lead Capture Integration**: Built-in lead generation for consulting services
- **Accessibility Compliant**: WCAG guidelines followed throughout

## 📁 Project Structure

```
aeo-website-grader/
├── index.html          # Main HTML structure
├── styles.css          # CSS styling and responsive design
├── app.js             # JavaScript functionality
└── README.md          # This file
```

## 🔧 Technical Details

### Scoring Algorithm
The tool uses a deterministic scoring system that evaluates URLs based on:
- Domain authority indicators (.edu, .gov domains get higher scores)
- Healthcare-specific keywords (pharma, bio, med, clinical)
- Regulatory indicators (FDA, NIH references)
- Platform detection (WordPress, Wix, etc.)

### Dependencies
- **jsPDF**: For PDF report generation (loaded via CDN)
- **Google Fonts**: Inter font family
- **Pure JavaScript**: No frameworks required

### Browser Support
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 🎨 Customization

### Branding
Update the header title and tagline in `index.html`:
```html
<h1>Your Company Name</h1>
<p class="tagline">Your custom tagline here</p>
```

### Scoring Factors
Modify the scoring weights in `app.js`:
```javascript
const aeoFactors = {
  contentStructure: { name: 'Content Structure', weight: 25, checks: [...] },
  // Adjust weights as needed
};
```

### Styling
The CSS uses custom properties for easy theming:
```css
:root {
  --c-brand: #0B8A94;
  --c-accent: #1ECAD7;
  --c-ink: #142129;
  /* Modify colors here */
}
```

## 🔒 Privacy & Security

- **No Server Communication**: All analysis happens client-side
- **No Data Storage**: User inputs are not stored or transmitted
- **GDPR Compliant**: No cookies or tracking without consent
- **PHI Safe**: Built with healthcare privacy requirements in mind

## 📱 Mobile Optimization

The tool is fully responsive with:
- Touch-friendly form inputs
- Optimized layouts for small screens
- Fast loading on mobile networks
- Accessible navigation

## 🐛 Known Issues

- PDF generation may be slow on older devices
- Very long URLs might overflow in mobile layouts
- Internet Explorer not supported

## 📋 TODO

- [ ] Add real website crawling capability
- [ ] Integrate with actual AI search APIs
- [ ] Add more detailed competitor analysis
- [ ] Implement user accounts and saved reports
- [ ] Add email automation for lead follow-up


## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Designed for healthcare and pharmaceutical marketing teams
- Built with accessibility and performance in mind
- Inspired by the growing importance of AI search optimization

---

**Built with ❤️ for the healthcare community**

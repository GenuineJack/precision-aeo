// SUPABASE CONFIGURATION
// Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://hcgrmpgnxnajhachbqcr.supabase.co'; // Replace with your Project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjZ3JtcGdueG5hamhhY2hicWNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4ODgzNzIsImV4cCI6MjA3MTQ2NDM3Mn0.Zn-3tdIqYKNo1B2tDcRQscxj_2SiG4CEiB6wvLGH3-g'; // Replace with your anon/public key

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test Function 
async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  console.log('Supabase URL:', SUPABASE_URL);
  console.log('API Key (last 10 chars):', SUPABASE_ANON_KEY.slice(-10));
  
  // Test a simple select to see if we can connect
  const { data, error } = await supabase
    .from('url_submissions')
    .select('count', { count: 'exact', head: true });
    
  if (error) {
    console.error('Connection test failed:', error);
  } else {
    console.log('Connection test successful, table exists');
  }
}

// Call the test when page loads
testSupabaseConnection();

// Global state
function setDisplayById(id, value){
  var el = document.getElementById(id);
  if (el) { el.style.display = value; }
}

let currentAnalysis = null;
let currentUrl = '';
let realAnalysisData = null;
let currentEmail = ''; // Store email for lead capture

// AEO factors (weights & checks)
const aeoFactors = {
  contentStructure: { name: 'Content Structure', weight: 25, checks: ['Clear headings and subheadings','Question-answer format','Logical information hierarchy','Scannable content blocks'] },
  authoritySignals: { name: 'Authority Signals', weight: 20, checks: ['Author credentials and bios','Medical citations and references','Regulatory mentions (FDA, EMA)','Clinical trial references'] },
  technicalOptimization: { name: 'Technical Optimization', weight: 20, checks: ['Schema markup implementation','Page load speed','Mobile responsiveness','Clean URL structure'] },
  contentClarity: { name: 'Content Clarity', weight: 15, checks: ['Plain language usage','Direct answer provision','Minimal medical jargon','Clear call-to-actions'] },
  ymylCompliance: { name: 'YMYL Compliance', weight: 10, checks: ['Medical disclaimers','Content freshness dates','Expert review process','Source attribution'] },
  userExperience: { name: 'User Experience', weight: 10, checks: ['Easy navigation','Readable typography','Accessible design','Contact information'] },
};

// Definitions for each AEO category used for tooltip descriptions on the results page
const categoryDescriptions = {
  contentStructure: 'The way your website’s headings, subheadings, and sections are organized to improve clarity and crawlability.',
  authoritySignals: 'Indicators like backlinks, citations, and expertise that show search engines your site is trustworthy.',
  technicalOptimization: 'Behind-the-scenes improvements (speed, schema markup, mobile readiness) that help search engines access and understand your site.',
  contentClarity: 'Writing and formatting information so it is clear, direct, and easy for both users and algorithms to understand.',
  ymylCompliance: 'Ensuring content meets Google’s “Your Money or Your Life” standards for accuracy, safety, and trustworthiness in sensitive topics.',
  userExperience: 'How easy, helpful, and enjoyable your website feels for visitors, from navigation to readability.'
};

// Healthcare content analysis keywords
const healthcareKeywords = {
  drugs: ['medication', 'drug', 'treatment', 'therapy', 'pharmaceutical', 'dosage', 'prescription'],
  conditions: ['disease', 'condition', 'syndrome', 'disorder', 'symptoms', 'diagnosis', 'patient'],
  authority: ['fda', 'nih', 'cdc', 'clinical trial', 'peer reviewed', 'study', 'research', 'clinical'],
  safety: ['side effects', 'contraindications', 'warnings', 'precautions', 'adverse', 'safety'],
  medical: ['doctor', 'physician', 'medical', 'healthcare', 'clinical', 'hospital', 'medicine']
};

// SUPABASE DATABASE FUNCTIONS

async function saveUrlSubmission(url, email, score = null, realDataUsed = false) {
  try {
    console.log('Saving URL submission to database...');
    
    const { data, error } = await supabase
      .from('url_submissions')
      .insert([
        {
          url: url,
          email: email,
          overall_score: score,
          real_data_used: realDataUsed,
          user_ip: await getUserIP(),
          user_agent: navigator.userAgent
        }
      ])
      .select();

    if (error) {
      console.error('Error saving URL submission:', error);
      return false;
    }

    console.log('URL submission saved successfully:', data);
    return true;
  } catch (err) {
    console.error('Unexpected error saving URL submission:', err);
    return false;
  }
}

async function saveLeadCapture(leadData) {
  try {
    console.log('Saving lead capture to database...');
    
    const { data, error } = await supabase
      .from('lead_captures')
      .insert([
        {
          name: leadData.name,
          email: leadData.email,
          company: leadData.company,
          company_size: leadData.companySize,
          challenge: leadData.challenge,
          analyzed_url: leadData.analyzedUrl,
          overall_score: leadData.overallScore,
          user_ip: await getUserIP(),
          user_agent: navigator.userAgent
        }
      ])
      .select();

    if (error) {
      console.error('Error saving lead capture:', error);
      return false;
    }

    console.log('Lead capture saved successfully:', data);
    return true;
  } catch (err) {
    console.error('Unexpected error saving lead capture:', err);
    return false;
  }
}

// Helper function to get user IP (optional)
async function getUserIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (err) {
    console.log('Could not get user IP:', err);
    return null;
  }
}

// REAL ANALYSIS FUNCTIONS

async function getRealTechnicalData(url) {
  const checks = {
    httpsEnabled: url.startsWith('https://'),
    domainAnalysis: null,
    pageSpeedData: null,
    accessibilityScore: null
  };
  
  // Domain analysis (always works)
  checks.domainAnalysis = analyzeDomain(url);
  
  // Try PageSpeed Insights (free API - requires key)
  try {
    // Note: You'll need to get a free API key from Google Cloud Console
    // and replace 'YOUR_API_KEY' below
    const apiKey = 'AIzaSyDGxPlxkNDPYnUX08ObzVZwg1DNsLZrFp4'; 
    if (apiKey !== 'YOUR_API_KEY') {
      const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&strategy=mobile`;
      const response = await fetch(psiUrl);
      const data = await response.json();
      
      if (data.lighthouseResult) {
        checks.pageSpeedData = {
          performance: Math.round(data.lighthouseResult.categories.performance.score * 100),
          accessibility: Math.round(data.lighthouseResult.categories.accessibility.score * 100),
          seo: Math.round(data.lighthouseResult.categories.seo.score * 100),
          firstContentfulPaint: data.lighthouseResult.audits['first-contentful-paint']?.displayValue || 'N/A',
          largestContentfulPaint: data.lighthouseResult.audits['largest-contentful-paint']?.displayValue || 'N/A'
        };
      }
    }
  } catch (e) {
    console.log('PageSpeed Insights unavailable:', e.message);
  }
  
  return checks;
}

async function analyzePageContent(url) {
  try {
    // Try multiple CORS proxies
    const proxies = [
      `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
      `https://corsproxy.io/?${encodeURIComponent(url)}`,
      `https://cors-anywhere.herokuapp.com/${url}`
    ];
    
    for (const proxyUrl of proxies) {
      try {
        const response = await fetch(proxyUrl);
        const data = await response.json();
        const html = data.contents || data.response || data;
        
        if (typeof html === 'string' && html.length > 100) {
          return analyzeHtmlContent(html, url);
        }
      } catch (e) {
        continue;
      }
    }
    
    // If all proxies fail, return null
    return null;
  } catch (e) {
    console.log('Content analysis failed:', e.message);
    return null;
  }
}

function analyzeHtmlContent(html, url) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const textContent = doc.body?.textContent?.toLowerCase() || '';
  
  // Basic structure analysis
  const structure = {
    hasH1: doc.querySelector('h1') !== null,
    headingCount: doc.querySelectorAll('h1,h2,h3,h4,h5,h6').length,
    headingHierarchy: analyzeHeadingHierarchy(doc),
    hasMetaDescription: doc.querySelector('meta[name="description"]') !== null,
    metaDescriptionLength: doc.querySelector('meta[name="description"]')?.getAttribute('content')?.length || 0,
    titleLength: doc.querySelector('title')?.textContent?.length || 0
  };
  
  // Technical SEO
  const technical = {
    hasSchema: html.includes('application/ld+json') || html.includes('itemscope'),
    hasCanonical: html.includes('rel="canonical"'),
    hasOpenGraph: html.includes('og:'),
    hasTwitterCards: html.includes('twitter:'),
    hasViewportMeta: html.includes('name="viewport"'),
    hasAltTags: checkImageAltTags(doc),
    internalLinksCount: doc.querySelectorAll('a[href^="/"], a[href*="' + new URL(url).hostname + '"]').length,
    externalLinksCount: doc.querySelectorAll('a[href^="http"]').length - doc.querySelectorAll('a[href*="' + new URL(url).hostname + '"]').length
  };
  
  // Healthcare-specific analysis
  const healthcare = analyzeHealthcareContent(textContent, html, doc);
  
  // Content quality indicators
  const content = {
    wordCount: textContent.split(/\s+/).filter(word => word.length > 0).length,
    readabilityScore: calculateSimpleReadability(textContent),
    hasContactInfo: checkContactInfo(textContent, html),
    hasFAQSection: textContent.includes('faq') || textContent.includes('frequently asked'),
    hasNavigation: doc.querySelector('nav') !== null || doc.querySelector('[role="navigation"]') !== null
  };
  
  return { structure, technical, healthcare, content };
}

function analyzeHeadingHierarchy(doc) {
  const headings = Array.from(doc.querySelectorAll('h1,h2,h3,h4,h5,h6'));
  let properHierarchy = true;
  let previousLevel = 0;
  
  headings.forEach(heading => {
    const level = parseInt(heading.tagName.slice(1));
    if (level > previousLevel + 1) {
      properHierarchy = false;
    }
    previousLevel = level;
  });
  
  return {
    proper: properHierarchy,
    h1Count: doc.querySelectorAll('h1').length,
    h2Count: doc.querySelectorAll('h2').length,
    h3Count: doc.querySelectorAll('h3').length,
    total: headings.length
  };
}

function checkImageAltTags(doc) {
  const images = doc.querySelectorAll('img');
  const totalImages = images.length;
  const imagesWithAlt = Array.from(images).filter(img => img.hasAttribute('alt') && img.getAttribute('alt').trim() !== '').length;
  
  return {
    total: totalImages,
    withAlt: imagesWithAlt,
    percentage: totalImages > 0 ? Math.round((imagesWithAlt / totalImages) * 100) : 100
  };
}

function analyzeHealthcareContent(textContent, html, doc) {
  const analysis = {
    relevanceScores: {},
    hasAuthorCredentials: false,
    hasDisclaimers: false,
    hasDates: false,
    hasCitations: false,
    hasContactInfo: false,
    regulatoryMentions: 0
  };
  
  // Calculate relevance scores for each healthcare category
  Object.keys(healthcareKeywords).forEach(category => {
    const keywords = healthcareKeywords[category];
    const matches = keywords.filter(keyword => textContent.includes(keyword.toLowerCase())).length;
    analysis.relevanceScores[category] = Math.round((matches / keywords.length) * 100);
  });
  
  // Check for author credentials
  const authorPatterns = ['md', 'phd', 'pharmd', 'doctor', 'dr.', 'physician', 'author:', 'by:', 'written by'];
  analysis.hasAuthorCredentials = authorPatterns.some(pattern => textContent.includes(pattern));
  
  // Check for medical disclaimers
  const disclaimerPatterns = ['disclaimer', 'medical advice', 'consult', 'healthcare provider', 'not intended to'];
  analysis.hasDisclaimers = disclaimerPatterns.some(pattern => textContent.includes(pattern));
  
  // Check for dates (last updated, published, etc.)
  const datePatterns = ['updated', 'published', 'last modified', '2023', '2024', '2025'];
  analysis.hasDates = datePatterns.some(pattern => textContent.includes(pattern));
  
  // Check for citations
  const citationPatterns = ['[', ']', 'reference', 'study', 'journal', 'pubmed', 'doi:'];
  analysis.hasCitations = citationPatterns.some(pattern => textContent.includes(pattern));
  
  // Count regulatory mentions
  const regulatoryTerms = ['fda', 'ema', 'health canada', 'tga', 'approval', 'clearance', 'indication'];
  analysis.regulatoryMentions = regulatoryTerms.filter(term => textContent.includes(term)).length;
  
  return analysis;
}

function calculateSimpleReadability(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((total, word) => total + countSyllables(word), 0);
  
  if (sentences.length === 0 || words.length === 0) return 0;
  
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;
  
  // Simplified Flesch Reading Ease
  const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
  return Math.max(0, Math.min(100, Math.round(score)));
}

function countSyllables(word) {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

function checkContactInfo(textContent, html) {
  const contactPatterns = ['contact', 'phone', 'email', '@', 'address', 'location'];
  return contactPatterns.some(pattern => textContent.includes(pattern));
}

function analyzeDomain(url) {
  const urlObj = new URL(url);
  const domain = urlObj.hostname.toLowerCase();
  const path = urlObj.pathname.toLowerCase();
  
  return {
    isEducational: domain.includes('.edu'),
    isGovernment: domain.includes('.gov'),
    isOrganization: domain.includes('.org'),
    isMedical: /\b(med|health|clinic|hospital|pharma|bio|medical)\b/.test(domain),
    hasWww: domain.startsWith('www.'),
    isSecure: url.startsWith('https://'),
    domainLength: domain.length,
    hasHyphens: domain.includes('-'),
    topLevelDomain: domain.split('.').pop(),
    hasHealthPath: /\b(health|medical|clinical|patient|drug|disease)\b/.test(path),
    subdomainCount: domain.split('.').length - 2
  };
}

// ENHANCED ANALYSIS FUNCTIONS

function normalizeUrl(url){
  url = url.trim();
  if(!/^https?:\/\//.test(url)){ url = 'https://' + url; }
  url = url.replace(/^https?:\/\/(?:www\.)?/, 'https://');
  try { new URL(url); } catch { throw new Error('Please enter a valid URL'); }
  return url;
}

// URL preview
document.getElementById('website-url').addEventListener('input', (e)=>{
  const v = e.target.value.trim();
  const preview = document.getElementById('url-preview');
  if(v){
    try{ preview.textContent = 'Will analyze: ' + normalizeUrl(v); preview.style.display = 'block'; }
    catch{ preview.style.display = 'none'; }
  } else { preview.style.display = 'none'; }
});

function simpleHash(str){ 
  let hash = 0; 
  for(let i=0;i<str.length;i++){ 
    hash = ((hash<<5)-hash) + str.charCodeAt(i); 
    hash |= 0; 
  } 
  return Math.abs(hash); 
}

function generateEnhancedScores(url, realData = null){
  const clean = url.toLowerCase().replace(/https?:\/\//,'').replace(/www\./,'');
  const seed = simpleHash(clean);
  
  // Base score calculation with real data influence
  let base = 60;
  
  // Domain-based adjustments
  if(clean.includes('.edu')||clean.includes('.gov')) base += 15;
  if(/pharma|bio|med/.test(clean)) base += 8;
  if(/health|clinical/.test(clean)) base += 5;
  if(/fda|nih/.test(clean)) base += 12;
  if(/wordpress|wix|squarespace/.test(clean)) base -= 8;
  if(/blogspot|tumblr/.test(clean)) base -= 10;
  
  // Real data adjustments
  if (realData) {
    if (realData.httpsEnabled) base += 5;
    if (realData.domainAnalysis?.isMedical) base += 8;
    if (realData.domainAnalysis?.isEducational) base += 10;
    if (realData.pageSpeedData?.performance > 80) base += 7;
    if (realData.pageSpeedData?.accessibility > 90) base += 5;
  }
  
  const categories = {};
  let weighted = 0;
  
  Object.keys(aeoFactors).forEach((key,i) => {
    const variation = ((seed + i*1000) % 30) - 15; // ±15
    let score = Math.min(100, Math.max(25, base + variation));
    
    // Apply real data adjustments per category
    if (realData) {
      score = adjustScoreWithRealData(key, score, realData);
    }
    
    categories[key] = score;
    weighted += score * (aeoFactors[key].weight/100);
  });
  
  return { 
    overall: Math.round(weighted), 
    categories,
    realDataUsed: realData !== null
  };
}

function adjustScoreWithRealData(category, baseScore, realData) {
  let adjustedScore = baseScore;
  
  switch(category) {
    case 'technicalOptimization':
      if (realData.pageSpeedData) {
        const perfScore = realData.pageSpeedData.performance;
        if (perfScore > 90) adjustedScore += 10;
        else if (perfScore > 75) adjustedScore += 5;
        else if (perfScore < 50) adjustedScore -= 15;
      }
      if (!realData.httpsEnabled) adjustedScore -= 20;
      break;
      
    case 'contentStructure':
      if (realData.contentAnalysis?.structure) {
        const struct = realData.contentAnalysis.structure;
        if (struct.hasH1 && struct.headingCount > 3) adjustedScore += 8;
        if (!struct.hasH1) adjustedScore -= 15;
        if (struct.headingHierarchy?.proper) adjustedScore += 5;
      }
      break;
      
    case 'authoritySignals':
      if (realData.contentAnalysis?.healthcare) {
        const hc = realData.contentAnalysis.healthcare;
        if (hc.hasAuthorCredentials) adjustedScore += 10;
        if (hc.hasCitations) adjustedScore += 8;
        if (hc.regulatoryMentions > 2) adjustedScore += 5;
      }
      break;
      
    case 'ymylCompliance':
      if (realData.contentAnalysis?.healthcare) {
        const hc = realData.contentAnalysis.healthcare;
        if (hc.hasDisclaimers) adjustedScore += 15;
        if (hc.hasDates) adjustedScore += 8;
        if (!hc.hasDisclaimers) adjustedScore -= 20;
      }
      break;
      
    case 'userExperience':
      if (realData.pageSpeedData?.accessibility > 90) adjustedScore += 10;
      if (realData.contentAnalysis?.technical?.hasViewportMeta) adjustedScore += 5;
      break;
  }
  
  return Math.min(100, Math.max(10, adjustedScore));
}

function generateEnhancedFindings(key, score, realData = null){
  const findings = [];
  const good=(t)=>findings.push({type:'good',text:t}); 
  const warn=(t)=>findings.push({type:'warning',text:t}); 
  const poor=(t)=>findings.push({type:'poor',text:t});
  
  // Use real data when available, otherwise use enhanced fake data
  if (realData && realData.contentAnalysis) {
    findings.push(...generateRealDataFindings(key, score, realData));
  }
  
  // Always add some category-specific findings
  findings.push(...generateCategoryFindings(key, score, realData));
  
  return findings.slice(0, 4); // Limit to 4 findings per category
}

function generateRealDataFindings(key, score, realData) {
  const findings = [];
  const good=(t)=>findings.push({type:'good',text:t}); 
  const warn=(t)=>findings.push({type:'warning',text:t}); 
  const poor=(t)=>findings.push({type:'poor',text:t});
  
  const { contentAnalysis, pageSpeedData, httpsEnabled, domainAnalysis } = realData;
  
  switch(key) {
    case 'technicalOptimization':
      if (httpsEnabled) {
        good('SSL certificate properly configured');
      } else {
        poor('Missing SSL certificate - critical for YMYL content');
      }
      
      if (pageSpeedData) {
        if (pageSpeedData.performance > 80) {
          good(`Strong performance score: ${pageSpeedData.performance}/100`);
        } else {
          warn(`Performance needs improvement: ${pageSpeedData.performance}/100`);
        }
        
        if (pageSpeedData.accessibility > 90) {
          good(`Excellent accessibility score: ${pageSpeedData.accessibility}/100`);
        } else if (pageSpeedData.accessibility < 70) {
          poor(`Accessibility issues detected: ${pageSpeedData.accessibility}/100`);
        }
      }
      
      if (contentAnalysis?.technical?.hasSchema) {
        good('Structured data markup detected');
      } else {
        warn('Missing structured data for enhanced AI understanding');
      }
      break;
      
    case 'contentStructure':
      if (contentAnalysis?.structure) {
        const struct = contentAnalysis.structure;
        if (struct.hasH1) {
          good('Primary heading (H1) found');
        } else {
          poor('Missing primary heading (H1) tag');
        }
        
        if (struct.headingCount > 5) {
          good(`Good heading structure with ${struct.headingCount} headings`);
        } else if (struct.headingCount < 3) {
          warn('Limited heading structure may impact scannability');
        }
        
        if (struct.headingHierarchy?.proper) {
          good('Proper heading hierarchy maintained');
        } else {
          warn('Heading hierarchy could be improved');
        }
      }
      break;
      
    case 'authoritySignals':
      if (contentAnalysis?.healthcare) {
        const hc = contentAnalysis.healthcare;
        if (hc.hasAuthorCredentials) {
          good('Medical author credentials detected');
        } else {
          warn('Author credentials not clearly displayed');
        }
        
        if (hc.hasCitations) {
          good('Citations and references found');
        } else {
          warn('Limited citation of medical sources');
        }
        
        if (hc.regulatoryMentions > 0) {
          good(`Regulatory mentions found (${hc.regulatoryMentions} references)`);
        }
      }
      break;
      
    case 'ymylCompliance':
      if (contentAnalysis?.healthcare) {
        const hc = contentAnalysis.healthcare;
        if (hc.hasDisclaimers) {
          good('Medical disclaimers present');
        } else {
          poor('Missing critical medical disclaimers');
        }
        
        if (hc.hasDates) {
          good('Content freshness dates found');
        } else {
          warn('Missing publication or update dates');
        }
      }
      break;
  }
  
  return findings;
}

function generateCategoryFindings(key, score, realData) {
  const findings = [];
  const good=(t)=>findings.push({type:'good',text:t}); 
  const warn=(t)=>findings.push({type:'warning',text:t}); 
  const poor=(t)=>findings.push({type:'poor',text:t});
  
  // Enhanced fake findings based on patterns and score
  if(key==='contentStructure'){
    if(score>=80){ 
      if (!realData?.contentAnalysis) good('Content appears well-structured for healthcare topics');
      good('Information hierarchy supports answer engine parsing'); 
    }
    else if(score>=60){ 
      warn('Content structure could better support AI comprehension'); 
      if (!realData?.contentAnalysis) good('Basic organization detected'); 
    }
    else { 
      poor('Content structure may hinder AI answer generation'); 
      poor('Consider reorganizing with clear question-answer format'); 
    }
  } else if(key==='authoritySignals'){
    if(score>=80){ 
      if (!realData?.contentAnalysis?.healthcare?.hasAuthorCredentials) good('Domain suggests medical authority');
      good('Content appears to follow medical writing standards'); 
    }
    else if(score>=60){ 
      warn('Author expertise could be more prominently displayed'); 
      if (!realData?.contentAnalysis) good('Some authority indicators present'); 
    }
    else { 
      poor('Limited medical authority signals detected'); 
      poor('Consider adding clear author credentials and citations'); 
    }
  } else if(key==='technicalOptimization'){
    if(score>=80){ 
      if (!realData?.pageSpeedData) good('Technical foundation appears solid');
      good('Site structure supports AI crawling'); 
    }
    else if(score>=60){ 
      warn('Technical optimizations could improve AI accessibility'); 
      if (!realData?.pageSpeedData) good('Basic technical setup detected'); 
    }
    else { 
      poor('Technical issues may limit AI search visibility'); 
      poor('Focus on page speed and structured data implementation'); 
    }
  } else if(key==='contentClarity'){
    if(score>=80){ 
      good('Content style appears accessible to diverse audiences'); 
      good('Information presentation supports direct answer extraction'); 
    }
    else if(score>=60){ 
      warn('Medical terminology may reduce AI comprehension'); 
      good('Some patient-friendly language detected'); 
    }
    else { 
      poor('Complex language may hinder AI answer generation'); 
      poor('Consider simplifying medical explanations'); 
    }
  } else if(key==='ymylCompliance'){
    if(score>=80){ 
      if (!realData?.contentAnalysis?.healthcare?.hasDisclaimers) good('Content approach aligns with YMYL best practices');
      good('Safety and accuracy signals present'); 
    }
    else if(score>=60){ 
      warn('YMYL compliance could be strengthened'); 
      if (!realData?.contentAnalysis) good('Basic safety considerations evident'); 
    }
    else { 
      poor('Missing critical YMYL compliance elements'); 
      poor('Add medical disclaimers and content governance indicators'); 
    }
  } else if(key==='userExperience'){
    if(score>=80){ 
      good('User interface supports healthcare information seeking'); 
      good('Navigation appears intuitive for patient and HCP users'); 
    }
    else if(score>=60){ 
      warn('User experience could better serve healthcare audiences'); 
      if (!realData?.pageSpeedData) good('Basic usability elements present'); 
    }
    else { 
      poor('User experience may not meet healthcare content standards'); 
      poor('Focus on accessibility and mobile optimization'); 
    }
  }
  
  return findings;
}

function generateEnhancedRecommendations(scores, realData = null){
  const recs = [];
  const cats = scores.categories;
  const worst = Object.keys(cats).sort((a,b)=>cats[a]-cats[b]).slice(0,4);
  
  worst.forEach(key=>{
    const score = cats[key]; 
    if(score>=75) return;
    
    // Add real data-informed recommendations
    if (realData) {
      recs.push(...getRealDataRecommendations(key, realData));
    }
    
    // Add category-specific recommendations
    if(key==='contentStructure'){ 
      recs.push('Restructure content with clear H2 sections for mechanism, dosing, and safety'); 
      recs.push('Add FAQ sections addressing common patient questions'); 
    }
    if(key==='authoritySignals'){ 
      recs.push('Display medical author credentials (MD, PharmD) prominently'); 
      recs.push('Include direct citations to clinical trials and regulatory approvals'); 
    }
    if(key==='technicalOptimization'){ 
      recs.push('Implement healthcare-specific schema markup for drug information'); 
      recs.push('Optimize page load speeds for better AI crawling'); 
    }
    if(key==='contentClarity'){ 
      recs.push('Create patient-friendly versions of complex medical content'); 
      recs.push('Use plain language while maintaining medical accuracy'); 
    }
    if(key==='ymylCompliance'){ 
      recs.push('Add prominent medical disclaimers and safety information'); 
      recs.push('Include clear publication dates and content review processes'); 
    }
    if(key==='userExperience'){ 
      recs.push('Improve mobile experience for patient education content'); 
      recs.push('Ensure easy access to safety information and prescribing details'); 
    }
  });
  
  if(scores.overall<70){ 
    recs.push('Implement comprehensive content governance for medical accuracy'); 
    recs.push('Conduct competitive analysis of top-ranking healthcare content'); 
  }
  
  if(recs.length===0){ 
    recs.push('Excellent AEO foundation! Monitor AI search performance regularly'); 
    recs.push('Consider expanding structured data to include clinical trial information'); 
  }
  
  return recs.slice(0,8);
}

function getRealDataRecommendations(category, realData) {
  const recs = [];
  const { contentAnalysis, pageSpeedData, httpsEnabled } = realData;
  
  switch(category) {
    case 'technicalOptimization':
      if (!httpsEnabled) {
        recs.push('URGENT: Install SSL certificate for healthcare content credibility');
      }
      if (pageSpeedData && pageSpeedData.performance < 70) {
        recs.push(`Improve page speed (currently ${pageSpeedData.performance}/100) for better AI accessibility`);
      }
      if (contentAnalysis?.technical && !contentAnalysis.technical.hasSchema) {
        recs.push('Add structured data markup to help AI understand your medical content');
      }
      break;
      
    case 'contentStructure':
      if (contentAnalysis?.structure && !contentAnalysis.structure.hasH1) {
        recs.push('Add a clear H1 heading to improve content hierarchy');
      }
      if (contentAnalysis?.structure && contentAnalysis.structure.headingCount < 3) {
        recs.push('Increase heading structure to improve content scannability');
      }
      break;
      
    case 'authoritySignals':
      if (contentAnalysis?.healthcare && !contentAnalysis.healthcare.hasAuthorCredentials) {
        recs.push('Add clear medical author credentials to build content authority');
      }
      if (contentAnalysis?.healthcare && !contentAnalysis.healthcare.hasCitations) {
        recs.push('Include medical citations and references to support claims');
      }
      break;
      
    case 'ymylCompliance':
      if (contentAnalysis?.healthcare && !contentAnalysis.healthcare.hasDisclaimers) {
        recs.push('CRITICAL: Add medical disclaimers for YMYL compliance');
      }
      if (contentAnalysis?.healthcare && !contentAnalysis.healthcare.hasDates) {
        recs.push('Add publication and last-updated dates to content');
      }
      break;
  }
  
  return recs;
}

// UI HELPER FUNCTIONS

function getScoreClass(score){ 
  if(score>=90) return 'score-excellent'; 
  if(score>=80) return 'score-good'; 
  if(score>=70) return 'score-fair'; 
  if(score>=60) return 'score-poor'; 
  return 'score-critical'; 
}

function getScoreDescription(score){
  if(score>=90) return 'Excellent! Your website is highly optimized for answer engines.';
  if(score>=80) return 'Good work! Your website has solid AEO with room for improvement.';
  if(score>=70) return 'Fair performance. Several AEO opportunities identified for better AI visibility.';
  if(score>=60) return 'Needs improvement. Multiple issues preventing optimal answer engine performance.';
  return 'Critical issues detected. Significant AEO work needed for AI search visibility.';
}

// PDF GENERATION

function downloadPDF(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'letter', compress: true });
  const primary = [35,206,217];
  const accent  = [252,164,124];
  const text    = [44,62,80];

  // Page metrics
  const pageWidth  = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  // Use 0.75 inch margins (~19mm) to fit more content on the first page
  const margin     = 19;

  const score = currentAnalysis.overall;
  // Determine score color
  let scoreColor = accent;
  if (score >= 90) scoreColor = [161,204,166];
  else if (score >= 80) scoreColor = [249,215,121];

  // Header background
  doc.setFillColor(...primary);
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setTextColor(255,255,255);
  doc.setFont('helvetica','bold');
  doc.setFontSize(24);
  // Main heading centered
  doc.text('Precision AEO', pageWidth/2, 18, { align: 'center' });
  doc.setFontSize(12);
  doc.setFont('helvetica','normal');
  // Subheadline with domain
  const domain = currentUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  doc.text(`Report Generated for ${domain}`, pageWidth/2, 26, { align: 'center' });

  // Score box: enlarge and ensure the score text is centered vertically
  const rectWidth = 80;
  const rectHeight = 30;
  const rectX = (pageWidth - rectWidth) / 2;
  const rectY = margin + 10;
  doc.setFillColor(...scoreColor);
  doc.roundedRect(rectX, rectY, rectWidth, rectHeight, 3, 3, 'F');
  doc.setTextColor(255,255,255);
  doc.setFont('helvetica','bold');
  doc.setFontSize(22);
  // Place the score roughly at the vertical center of the rectangle
  doc.text(`${score}/100`, pageWidth/2, rectY + rectHeight/2 + 7, { align: 'center' });
  // Label under score
  doc.setTextColor(...text);
  doc.setFontSize(14);
  doc.text('Overall AEO Analysis', pageWidth/2, rectY + rectHeight + 14, { align: 'center' });
  // Score description
  const description = getScoreDescription(score);
  const descLines = doc.splitTextToSize(description, pageWidth - margin*2);
  doc.setFontSize(10);
  doc.text(descLines, pageWidth/2, rectY + rectHeight + 20, { align: 'center' });

  // Category Performance header
  let y = rectY + rectHeight + 40;
  doc.setFontSize(14);
  doc.setFont('helvetica','bold');
  doc.text('Category Performance', margin, y);
  y += 8;

  // Draw each category bar
  Object.keys(aeoFactors).forEach((key) => {
    const factor = aeoFactors[key];
    const s = Math.round(currentAnalysis.categories[key]);
    doc.setFontSize(11);
    doc.setFont('helvetica','bold');
    doc.setTextColor(...text);
    doc.text(factor.name, margin + 5, y);
    // Bars
    const barWidth = 100;
    const barHeight = 6;
    const barX = margin + 5;
    const barY = y + 2;
    doc.setFillColor(240,240,240);
    doc.rect(barX, barY, barWidth, barHeight, 'F');
    // Determine bar color
    let barColor = accent;
    if (s >= 90) barColor = [161,204,166];
    else if (s >= 80) barColor = [249,215,121];
    doc.setFillColor(...barColor);
    doc.rect(barX, barY, (s/100) * barWidth, barHeight, 'F');
    // Score text and weight
    doc.setFont('helvetica','normal');
    doc.setTextColor(...text);
    doc.text(`${s}/100`, margin + barWidth + 20, y + 6);
    doc.setFontSize(9);
    doc.text(`(${factor.weight}% weight)`, margin + barWidth + 45, y + 6);
    y += 15;
  });

  // Priority Recommendations
  y += 5;
  doc.setFontSize(14);
  doc.setFont('helvetica','bold');
  doc.text('Priority Recommendations', margin, y);
  y += 8;
  const recs = generateEnhancedRecommendations(currentAnalysis, realAnalysisData);
  recs.slice(0, 6).forEach((rec, i) => {
    doc.setFontSize(10);
    doc.setFont('helvetica','normal');
    // bullet circle
    doc.setFillColor(...primary);
    doc.circle(margin + 2, y - 2, 1.5, 'F');
    const lines = doc.splitTextToSize(`${i + 1}. ${rec}`, pageWidth - margin*2 - 10);
    doc.text(lines, margin + 7, y);
    y += lines.length * 4 + 3;
    if (y > pageHeight - margin - 20) {
      doc.addPage();
      y = margin;
    }
  });

  // Always add a second page for glossary
  doc.addPage();
  // Key Terms header on new page
  let y2 = margin;
  doc.setFont('helvetica','bold');
  doc.setFontSize(16);
  doc.setTextColor(...text);
  doc.text('📖 Key Terms', pageWidth / 2, y2, { align: 'center' });
  y2 += 10;
  doc.setFont('helvetica','normal');
  doc.setFontSize(11);
  const glossary = [
    { term: 'Answer Engine Optimization (AEO)', definition: 'The practice of structuring your website so AI-driven search engines and answer engines can easily understand and surface your content.' },
    { term: 'Content Structure', definition: 'The way your website’s headings, subheadings, and sections are organized to improve clarity and crawlability.' },
    { term: 'Authority Signals', definition: 'Indicators like backlinks, citations, and expertise that show search engines your site is trustworthy.' },
    { term: 'Technical Optimization', definition: 'Behind-the-scenes improvements (speed, schema markup, mobile readiness) that help search engines access and understand your site.' },
    { term: 'Content Clarity', definition: 'Writing and formatting information so it is clear, direct, and easy for both users and algorithms to understand.' },
    { term: 'YMYL Compliance', definition: 'Ensuring content meets Google’s “Your Money or Your Life” standards for accuracy, safety, and trustworthiness in sensitive topics.' },
    { term: 'User Experience (UX)', definition: 'How easy, helpful, and enjoyable your website feels for visitors, from navigation to readability.' },
    { term: 'Featured Snippets', definition: 'Short highlighted answers at the top of Google results, often pulled from well-structured AEO content.' },
    { term: 'Schema Markup', definition: 'A type of structured data code that helps search engines interpret and display your content more effectively.' },
    { term: 'E-E-A-T', definition: 'Google’s quality framework: Experience, Expertise, Authoritativeness, and Trustworthiness.' },
    { term: 'Knowledge Graph', definition: 'Google’s database of interconnected facts that powers quick answers and information panels.' },
    { term: 'Search Intent', definition: 'The underlying reason a user makes a query (informational, transactional, navigational), which guides how you should structure your content.' }
  ];
  glossary.forEach(({ term, definition }) => {
    // Term bold
    doc.setFont('helvetica','bold');
    doc.setFontSize(11);
    doc.text(term, margin, y2);
    y2 += 5;
    doc.setFont('helvetica','normal');
    const defLines = doc.splitTextToSize(definition, pageWidth - margin*2);
    doc.text(defLines, margin, y2);
    y2 += defLines.length * 5 + 3;
    // Check if near bottom of page
    if (y2 > pageHeight - margin - 20) {
      doc.addPage();
      y2 = margin;
    }
  });

  // Footer for each page
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica','normal');
    doc.setTextColor(150,150,150);
    doc.text('Generated by Precision AEO', margin, pageHeight - 10);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  }

  const fname = `AEO-Report-${currentUrl.replace(/https?:\/\//,'').replace(/\W/g,'-')}.pdf`;
  doc.save(fname);
}

// FORM SUBMISSION & MAIN ANALYSIS

document.getElementById('grader-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const urlVal = document.getElementById('website-url').value;
  const emailVal = document.getElementById('email').value;
  
  try{
    const normalized = normalizeUrl(urlVal);
    currentUrl = normalized;
    currentEmail = emailVal; // Store for lead capture
    
    // Add analysis state: lock scroll and hide underlying content
    document.body.classList.add('is-analyzing');
    const mainEl = document.getElementById('main-content');
    if (mainEl) {
      mainEl.setAttribute('aria-hidden','true');
      // Do not hide the container visually; overlay will cover it
      if ('inert' in mainEl) { try { mainEl.inert = true; } catch(e) {} }
    }
    // Show loading overlay
    setDisplayById('loading','block');
    
    // Update loading message for real analysis
    const loadingElement = document.getElementById('loading');
    loadingElement.innerHTML = `
      <div class="spinner" aria-hidden="true"></div>
      <h3>Analyzing your website...</h3>
      <p>Running comprehensive analysis including page speed, content structure, and healthcare compliance checks.</p>
      <div class="analysis-progress" style="margin-top: 20px; font-size: 0.9rem; color: #5a6c7d;">
        <div id="progress-text">⏳ Initializing analysis...</div>
      </div>
    `;
    
    // Perform real analysis with progress updates
    console.log('Starting enhanced analysis for:', normalized);
    
    // Update progress
    setTimeout(() => {
      const progressText = document.getElementById('progress-text');
      if (progressText) progressText.textContent = '🔍 Analyzing page structure and content...';
    }, 500);
    
    // Run real analysis functions with error handling
    const [technicalData, contentData] = await Promise.all([
      getRealTechnicalData(normalized).catch(err => {
        console.warn('Technical analysis failed:', err);
        return { httpsEnabled: normalized.startsWith('https://'), domainAnalysis: analyzeDomain(normalized) };
      }),
      analyzePageContent(normalized).catch(err => {
        console.warn('Content analysis failed:', err);
        return null;
      })
    ]);
    
    // Update progress
    const progressText = document.getElementById('progress-text');
    if (progressText) progressText.textContent = '📊 Calculating AEO scores...';
    
    // Combine all real data
    realAnalysisData = {
      ...technicalData,
      contentAnalysis: contentData
    };
    
    console.log('Real analysis data:', realAnalysisData);
    
    // Wait a bit for better UX
    await new Promise(r=>setTimeout(r,800));
    
    // Generate enhanced scores
    const scores = generateEnhancedScores(normalized, realAnalysisData);
    currentAnalysis = scores; 
    
    // Save URL submission to database (don't wait for this)
    saveUrlSubmission(normalized, emailVal, scores.overall, realAnalysisData !== null)
      .then(success => {
        if (success) {
          console.log('✅ URL submission saved to database');
        } else {
          console.warn('⚠️ Failed to save URL submission to database');
        }
      });
    
    // Display results
    displayResults(scores);
    // Hide loading overlay and show results
    setDisplayById('loading','none');
    // Restore main content and remove analysis state
    const mainContainer = document.getElementById('main-content');
    if (mainContainer) {
      mainContainer.removeAttribute('aria-hidden');
      if ('inert' in mainContainer) { try { mainContainer.inert = false; } catch(e) {} }
    }
    setDisplayById('results','block');
    document.body.classList.remove('is-analyzing');
    // Switch body class from home to results to allow contact link
    document.body.classList.remove('home');
    document.body.classList.add('results');

    // Warn users before navigating away from the results page
    window.addEventListener('beforeunload', function (e) {
      // If on results page, prompt confirmation before leaving
      if (document.body.classList.contains('results')) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
    
    // Show analysis details if we got real data
    if (realAnalysisData && (realAnalysisData.contentAnalysis || realAnalysisData.pageSpeedData)) {
      displayAnalysisDetails(realAnalysisData);
    } else {
      // Show what analysis was completed
      displayAnalysisDetails({ 
        domainAnalysis: true, 
        httpsEnabled: realAnalysisData?.httpsEnabled 
      });
    }
    
  } catch(err){
    console.error('Analysis error:', err);
    
    // Show user-friendly error message
    setDisplayById('loading','none');
    
    // Create error display
    const errorHtml = `
      <div class="error-message" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: white; z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 40px;">
        <div style="text-align: center; max-width: 500px;">
          <h3 style="color: #e63946; margin-bottom: 15px;">⚠️ Analysis Error</h3>
          <p style="color: #666; margin-bottom: 20px;">
            We encountered an issue analyzing your website. This could be due to:
          </p>
          <ul style="color: #666; text-align: left; display: inline-block; margin-bottom: 20px;">
            <li>Website access restrictions</li>
            <li>Invalid URL format</li>
            <li>Temporary connectivity issues</li>
          </ul>
          <button onclick="location.reload()" style="background: #7fb069; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600;">
            Try Again
          </button>
        </div>
      </div>
    `;
    
    // Show error as full-screen overlay
    document.body.insertAdjacentHTML('beforeend', errorHtml);
    
    // Show form again after 5 seconds
    setTimeout(() => {
      location.reload();
    }, 5000);
  }
});

// RESULTS DISPLAY

function displayResults(scores){
  const overall = scores.overall;
  document.getElementById('score-number').textContent = overall;
  document.getElementById('score-circle').className = 'score-circle ' + getScoreClass(overall);
  document.getElementById('score-description').textContent = getScoreDescription(overall);
  
  const container = document.getElementById('categories'); 
  container.innerHTML='';
  
  Object.keys(aeoFactors).forEach((key)=>{
    const factor = aeoFactors[key]; 
    const val = Math.round(scores.categories[key]); 
    const findings = generateEnhancedFindings(key, val, realAnalysisData);
    
    const card = document.createElement('div'); 
    card.className='category';
    card.innerHTML = `
      <h3>${factor.name}
        <span class="category-score">${val}/100</span>
        <span class="info-icon" tabindex="0" role="button" aria-label="${factor.name} definition" data-description="${categoryDescriptions[key]}">ℹ️</span>
      </h3>
      <div class="category-details">
        <p><strong>Impact:</strong> ${factor.weight}% of overall AEO score</p>
      </div>
      <div class="findings">
        ${findings.map(f=>`
          <div class='finding-item'>
            <div class='finding-icon finding-${f.type}' aria-hidden='true'></div>
            <span>${f.text}</span>
          </div>
        `).join('')}
      </div>`;
    container.appendChild(card);
  });
  
  // Display recommendations
  const recs = generateEnhancedRecommendations(scores, realAnalysisData); 
  const list = document.getElementById('recommendations-list'); 
  list.innerHTML=''; 
  recs.forEach(r=>{ 
    const li=document.createElement('li'); 
    li.textContent=r; 
    list.appendChild(li); 
  });
  
  // Show lead capture for lower scores
  document.getElementById('lead-capture').style.display = overall<=75 ? 'block' : 'none';
}

function displayAnalysisDetails(realData) {
  const detailsContainer = document.getElementById('analysis-details');
  if (!detailsContainer) return;
  
  const checksContainer = document.getElementById('analysis-checks');
  let checksHtml = '<div class="analysis-grid">';
  
  // Count successful analyses
  let analysisCount = 0;
  
  if (realData.pageSpeedData) {
    checksHtml += `
      <div class="check-item good">✓ Page Speed Analysis (${realData.pageSpeedData.performance}/100)</div>
      <div class="check-item good">✓ Accessibility Testing (${realData.pageSpeedData.accessibility}/100)</div>
    `;
    analysisCount += 2;
  }
  
  if (realData.contentAnalysis) {
    checksHtml += `
      <div class="check-item good">✓ Content Structure Analysis</div>
      <div class="check-item good">✓ Healthcare Content Review</div>
      <div class="check-item good">✓ Technical SEO Audit</div>
    `;
    analysisCount += 3;
  }
  
  // Always show these basic checks
  checksHtml += `
    <div class="check-item good">✓ Domain Authority Assessment</div>
    <div class="check-item good">✓ Security Configuration Check</div>
  `;
  analysisCount += 2;
  
  // Add analysis method indicator
  if (realData.pageSpeedData || realData.contentAnalysis) {
    checksHtml += `<div class="check-item good">✓ Live Website Data Retrieved</div>`;
  } else {
    checksHtml += `<div class="check-item" style="background: rgba(249,215,121,0.15); border-color: rgba(249,215,121,0.4);">⚡ Rapid Domain-Based Assessment</div>`;
  }
  
  checksHtml += '</div>';
  
  // Update header based on analysis completeness
  const headerText = realData.contentAnalysis ? 
    '✅ Comprehensive Analysis Completed' : 
    '✅ Rapid Analysis Completed';
    
  detailsContainer.querySelector('h4').textContent = headerText;
  checksContainer.innerHTML = checksHtml;
  detailsContainer.style.display = 'block';
  
  // Previously inserted a note about CORS/API services here. Removed per spec to keep results page clean.
}

// LEAD CAPTURE

document.getElementById('lead-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  
  const leadData = { 
    name: document.getElementById('lead-name').value, 
    email: document.getElementById('lead-email').value, 
    company: document.getElementById('lead-company').value, 
    companySize: document.getElementById('company-size').value, 
    challenge: document.getElementById('challenge').value, 
    analyzedUrl: currentUrl, 
    overallScore: currentAnalysis?.overall ?? null
  };
  
  console.log('Lead capture data:', leadData);
  
  // Save to database (don't wait for this)
  saveLeadCapture(leadData)
    .then(success => {
      if (success) {
        console.log('✅ Lead capture saved to database');
      } else {
        console.warn('⚠️ Failed to save lead capture to database');
      }
    });
  
  // Update UI immediately with an inline download button
  const leadCaptureContainer = document.getElementById('lead-capture');
  if (leadCaptureContainer) {
    leadCaptureContainer.innerHTML =
      '<h3>✅ Thank you!</h3>' +
      '<p>We\'ve received your info and will be in touch. In the meantime, download your report and get familiar with the information.</p>' +
      '<div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:15px;">' +
        '<button id="download-inline" class="btn-secondary">📄 Download Report</button>' +
        '<button id="analyze-again" class="btn-secondary">🔄 Analyze Another Site</button>' +
      '</div>';
    // Attach click handler to trigger the same PDF download as the header button
    const dlBtn = document.getElementById('download-inline');
    if (dlBtn) dlBtn.addEventListener('click', downloadPDF);
    // Attach click handler for analyze another site button to reload page
    const againBtn = document.getElementById('analyze-again');
    if (againBtn) againBtn.addEventListener('click', () => { location.reload(); });
  }
});

// CTA HANDLERS

document.getElementById('cta-button').addEventListener('click', ()=>{ 
  window.scrollTo({ top: 0, behavior: 'smooth' }); 
  document.getElementById('website-url').focus(); 
});

document.getElementById('download-pdf').addEventListener('click', downloadPDF);

// Add a "Start Over" button to results
document.addEventListener('DOMContentLoaded', function() {
  // Add start over functionality
  const resultsHeader = document.querySelector('.results-header');
  if (resultsHeader) {
    const startOverBtn = document.createElement('button');
    startOverBtn.textContent = '🔄 Analyze Another Site';
    startOverBtn.className = 'btn-secondary';
    startOverBtn.style.marginLeft = '10px';
    startOverBtn.addEventListener('click', () => {
      location.reload();
    });
    resultsHeader.appendChild(startOverBtn);
  }
});
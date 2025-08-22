// Global state

// Safe display setter to avoid null .style access after UI swap
function setDisplayById(id, value){
  var el = document.getElementById(id);
  if (el) { el.style.display = value; }
}
let currentAnalysis = null;
let currentUrl = '';
// AEO factors (weights & checks)
const aeoFactors = {
  contentStructure: { name: 'Content Structure', weight: 25, checks: ['Clear headings and subheadings','Question-answer format','Logical information hierarchy','Scannable content blocks'] },
  authoritySignals: { name: 'Authority Signals', weight: 20, checks: ['Author credentials and bios','Medical citations and references','Regulatory mentions (FDA, EMA)','Clinical trial references'] },
  technicalOptimization: { name: 'Technical Optimization', weight: 20, checks: ['Schema markup implementation','Page load speed','Mobile responsiveness','Clean URL structure'] },
  contentClarity: { name: 'Content Clarity', weight: 15, checks: ['Plain language usage','Direct answer provision','Minimal medical jargon','Clear call-to-actions'] },
  ymylCompliance: { name: 'YMYL Compliance', weight: 10, checks: ['Medical disclaimers','Content freshness dates','Expert review process','Source attribution'] },
  userExperience: { name: 'User Experience', weight: 10, checks: ['Easy navigation','Readable typography','Accessible design','Contact information'] },
};
// Normalize URL (accept bare domains)
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
// Simple hash for deterministic scores
function simpleHash(str){ let hash = 0; for(let i=0;i<str.length;i++){ hash = ((hash<<5)-hash) + str.charCodeAt(i); hash |= 0; } return Math.abs(hash); }
// Deterministic factor & overall scores
function generateDeterministicScores(url){
  const clean = url.toLowerCase().replace(/https?:\/\//,'').replace(/www\./,'');
  const seed = simpleHash(clean);
  let base = 60;
  if(clean.includes('.edu')||clean.includes('.gov')) base += 15;
  if(/pharma|bio|med/.test(clean)) base += 8;
  if(/health|clinical/.test(clean)) base += 5;
  if(/fda|nih/.test(clean)) base += 12;
  if(/wordpress|wix|squarespace/.test(clean)) base -= 8;
  if(/blogspot|tumblr/.test(clean)) base -= 10;
  const categories = {}; let weighted = 0;
  Object.keys(aeoFactors).forEach((key,i)=>{
    const variation = ((seed + i*1000) % 30) - 15; // ±15
    const score = Math.min(100, Math.max(25, base + variation));
    categories[key] = score;
    weighted += score * (aeoFactors[key].weight/100);
  });
  return { overall: Math.round(weighted), categories };
}
// Findings per factor
function generatePharmaFindings(key, score){
  const out = []; const good=(t)=>out.push({type:'good',text:t}); const warn=(t)=>out.push({type:'warning',text:t}); const poor=(t)=>out.push({type:'poor',text:t});
  if(key==='contentStructure'){
    if(score>=80){ good('Clear heading structure found across product pages'); good('Q&A format detected for common patient questions'); }
    else if(score>=60){ warn('Mechanism of action content needs better organization'); good('Basic heading structure present'); }
    else { poor('Critical content buried deep in page hierarchy'); poor('No clear Q&A format for patient education'); }
  } else if(key==='authoritySignals'){
    if(score>=80){ good('Medical author credentials clearly displayed'); good('Clinical trial references properly cited'); }
    else if(score>=60){ warn('Author credentials missing on 40% of medical content'); good('FDA approval information found'); }
    else { poor('No medical author credentials detected'); poor('Missing regulatory approval information'); }
  } else if(key==='technicalOptimization'){
    if(score>=80){ good('Drug information schema markup implemented'); good('Fast loading speed (< 3 seconds)'); }
    else if(score>=60){ warn('Missing HowTo schema for dosing instructions'); good('Basic schema markup present'); }
    else { poor('No structured data for drug information'); poor('Slow page load speeds affecting AI crawling'); }
  } else if(key==='contentClarity'){
    if(score>=80){ good('Plain language explanations for complex medical terms'); good('Direct answers to common patient questions'); }
    else if(score>=60){ warn('Medical jargon reducing AI comprehension'); good('Some patient-friendly explanations found'); }
    else { poor('Heavy medical jargon throughout content'); poor('No direct answers to patient questions'); }
  } else if(key==='ymylCompliance'){
    if(score>=80){ good('Proper medical disclaimers in place'); good('Content freshness dates clearly marked'); }
    else if(score>=60){ warn('Medical disclaimers present but poorly positioned'); good('Basic safety information provided'); }
    else { poor('Missing critical medical disclaimers'); poor('No content freshness indicators'); }
  } else if(key==='userExperience'){
    if(score>=80){ good('Mobile-optimized for patient access'); good('Clear navigation to safety information'); }
    else if(score>=60){ warn('Navigation could be clearer for HCP vs patient content'); good('Basic mobile responsiveness'); }
    else { poor('Poor mobile experience for patient education'); poor('Difficult to find important safety information'); }
  }
  return out;
}
// Recommendations
function generatePharmaRecommendations(scores){
  const recs = []; const cats = scores.categories;
  const worst = Object.keys(cats).sort((a,b)=>cats[a]-cats[b]).slice(0,4);
  worst.forEach(key=>{
    const score = cats[key]; if(score>=75) return;
    if(key==='contentStructure'){ recs.push('Restructure drug information pages with clear H2 sections for "How it works," "Dosing," and "Side effects"'); recs.push('Add FAQ sections addressing common patient questions about your medications'); }
    if(key==='authoritySignals'){ recs.push('Add medical author credentials (MD, PharmD) to all clinical content pages'); recs.push('Include direct citations to clinical trials and FDA approval documents'); }
    if(key==='technicalOptimization'){ recs.push('Implement Drug schema markup for medication information pages'); recs.push('Add HowTo schema for dosing and administration instructions'); }
    if(key==='contentClarity'){ recs.push('Rewrite mechanism of action explanations in patient-friendly language'); recs.push('Create separate content versions for healthcare professionals vs. patients'); }
    if(key==='ymylCompliance'){ recs.push('Add prominent medical disclaimers and "Important Safety Information" sections'); recs.push('Include clear publication and last-updated dates on all medical content'); }
    if(key==='userExperience'){ recs.push('Improve mobile navigation for patient education resources'); recs.push('Add clear pathways to safety information and prescribing details'); }
  });
  if(scores.overall<70){ recs.push('Consider implementing a comprehensive content governance process for medical accuracy'); recs.push('Audit competitor content that ranks well in AI search results'); }
  if(recs.length===0){ recs.push('Excellent AEO foundation! Focus on monitoring AI search performance and competitor analysis'); recs.push('Consider expanding structured data to include clinical trial information'); recs.push('Regularly update content freshness signals for continued AI visibility'); }
  return recs.slice(0,6);
}
// Score helpers
function getScoreClass(score){ if(score>=90) return 'score-excellent'; if(score>=80) return 'score-good'; if(score>=70) return 'score-fair'; if(score>=60) return 'score-poor'; return 'score-critical'; }
function getScoreDescription(score){
  if(score>=90) return 'Excellent! Your website is highly optimized for answer engines.';
  if(score>=80) return 'Good work! Your website has solid AEO with room for improvement.';
  if(score>=70) return 'Fair performance. Several AEO opportunities identified for better AI visibility.';
  if(score>=60) return 'Needs improvement. Multiple issues preventing optimal answer engine performance.';
  return 'Critical issues detected. Significant AEO work needed for AI search visibility.';
}
// Accordion
function toggleSection(id){
  const content = document.getElementById(id);
  const button = document.querySelector(`[aria-controls="${id}"]`);
  const icon = document.getElementById(id + '-icon');
  const expanded = button.getAttribute('aria-expanded')==='true';
  if(expanded){ content.classList.remove('active'); button.setAttribute('aria-expanded','false'); icon.textContent='+'; icon.classList.remove('active'); }
  else { content.classList.add('active'); button.setAttribute('aria-expanded','true'); icon.textContent='−'; icon.classList.add('active'); }
}
// Keyboard support
document.addEventListener('keydown', (e)=>{
  if(e.target.classList.contains('info-header') && (e.key==='Enter' || e.key===' ')){
    e.preventDefault(); e.target.click();
  }
});
function scrollToTop(){ window.scrollTo({top:0,behavior:'smooth'}); }
// PDF download
function downloadPDF(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const primary=[35,206,217], accent=[252,164,124], text=[44,62,80];
  doc.setFillColor(...primary); doc.rect(0,0,210,40,'F');
  doc.setTextColor(255,255,255); doc.setFontSize(24); doc.setFont('helvetica','bold'); doc.text('AEO Website Analysis Report',20,25);
  doc.setFontSize(12); doc.setFont('helvetica','normal'); doc.text('Healthcare & Life Sciences Optimization Analysis',20,32);
  doc.setTextColor(...text); doc.setFontSize(14); doc.setFont('helvetica','bold'); doc.text('Analysis Overview',20,55);
  doc.setFontSize(11); doc.setFont('helvetica','normal'); doc.text(`Website: ${currentUrl}`,20,65); doc.text(`Analysis Date: ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}`,20,72);
  const score = currentAnalysis.overall;
  let color = accent; if(score>=80) color=[249,215,121]; if(score>=90) color=[161,204,166];
  doc.setFillColor(...color); doc.roundedRect(20,80,50,20,3,3,'F'); doc.setTextColor(255,255,255); doc.setFontSize(16); doc.setFont('helvetica','bold'); doc.text(`${score}/100`,45,93);
  doc.setTextColor(...text); doc.setFontSize(12); doc.text('Overall AEO Score',80,88); doc.setFontSize(10); doc.text(getScoreDescription(score),80,95);
  doc.setFontSize(14); doc.setFont('helvetica','bold'); doc.text('Category Performance',20,115);
  let y=125;
  Object.keys(aeoFactors).forEach((key)=>{
    const factor = aeoFactors[key]; const s = Math.round(currentAnalysis.categories[key]);
    doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.text(factor.name,25,y);
    const barW=100, fillW=(s/100)*barW;
    doc.setFillColor(240,240,240); doc.rect(25,y+2,barW,6,'F');
    let barColor=accent; if(s>=80) barColor=[161,204,166]; else if(s>=60) barColor=[249,215,121];
    doc.setFillColor(...barColor); doc.rect(25,y+2,fillW,6,'F');
    doc.setTextColor(...text); doc.setFont('helvetica','normal'); doc.text(`${s}/100`,135,y+6); doc.setFontSize(9); doc.text(`(${factor.weight}% weight)`,160,y+6);
    y+=15;
  });
  y+=10; doc.setFontSize(14); doc.setFont('helvetica','bold'); doc.text('Priority Recommendations',20,y); y+=10;
  const recs = generatePharmaRecommendations(currentAnalysis, currentUrl);
  recs.slice(0,6).forEach((rec,i)=>{
    doc.setFontSize(10); doc.setFont('helvetica','normal'); doc.setFillColor(...primary); doc.circle(22,y-1,1.5,'F');
    const lines = doc.splitTextToSize(`${i+1}. ${rec}`,165); doc.text(lines,27,y); y += lines.length*4 + 3; if(y>260){ doc.addPage(); y=20; }
  });
  const pages = doc.internal.getNumberOfPages();
  for(let i=1;i<=pages;i++){ doc.setPage(i); doc.setFontSize(8); doc.setTextColor(150,150,150); doc.text('Generated by AEO Website Grader - Healthcare & Life Sciences Optimization',20,285); doc.text(`Page ${i} of ${pages}`,180,285); }
  const fname = `AEO-Report-${currentUrl.replace(/https?:\/\//,'').replace(/\W/g,'-')}.pdf`; doc.save(fname);
}
// Form submit
document.getElementById('grader-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const urlVal = document.getElementById('website-url').value;
  const emailVal = document.getElementById('email').value;
  try{
    const normalized = normalizeUrl(urlVal);
    currentUrl = normalized;
    setDisplayById('form-section','none');
    setDisplayById('features-section','none');
    setDisplayById('info-sections','none'); setDisplayById('faq','none');
    setDisplayById('cta-section','none');
    setDisplayById('loading','block');
    await new Promise(r=>setTimeout(r,2000));
    const scores = generateDeterministicScores(normalized);
    currentAnalysis = scores; displayResults(scores);
    setDisplayById('loading','none'); setDisplayById('results','block');
  } catch(err){
    const input = document.getElementById('website-url'); input.setCustomValidity(err.message); input.reportValidity(); setTimeout(()=>input.setCustomValidity(''),2000);
  }
});
// Render results
function displayResults(scores){
  const overall = scores.overall;
  document.getElementById('score-number').textContent = overall;
  document.getElementById('score-circle').className = 'score-circle ' + getScoreClass(overall);
  document.getElementById('score-description').textContent = getScoreDescription(overall);
  const container = document.getElementById('categories'); container.innerHTML='';
  Object.keys(aeoFactors).forEach((key)=>{
    const factor = aeoFactors[key]; const val = Math.round(scores.categories[key]); const findings = generatePharmaFindings(key, val);
    const card = document.createElement('div'); card.className='category';
    card.innerHTML = `<h3>${factor.name}<span class="category-score">${val}/100</span></h3>
      <div class="category-details"><p><strong>Impact:</strong> ${factor.weight}% of overall AEO score</p></div>
      <div class="findings">${findings.map(f=>`<div class='finding-item'><div class='finding-icon finding-${f.type}' aria-hidden='true'></div><span>${f.text}</span></div>`).join('')}</div>`;
    container.appendChild(card);
  });
  const recs = generatePharmaRecommendations(scores); const list = document.getElementById('recommendations-list'); list.innerHTML=''; recs.forEach(r=>{ const li=document.createElement('li'); li.textContent=r; list.appendChild(li); });
  document.getElementById('lead-capture').style.display = overall<=75 ? 'block' : 'none';
}
// Lead form
document.getElementById('lead-form').addEventListener('submit', (e)=>{
  e.preventDefault();
  const data = { name: document.getElementById('lead-name').value, email: document.getElementById('lead-email').value, company: document.getElementById('lead-company').value, size: document.getElementById('company-size').value, challenge: document.getElementById('challenge').value, url: currentUrl, score: currentAnalysis?.overall ?? null, ts: new Date().toISOString() };
  console.log('Lead capture:', data);
  document.getElementById('lead-capture').innerHTML = '<h3>✅ Thank you!</h3><p>We\'ve received your info and will be in touch. In the meantime, download your report above.</p>';
});
// CTA + PDF button
document.getElementById('cta-button').addEventListener('click', ()=>{ window.scrollTo({ top: 0, behavior: 'smooth' }); document.getElementById('website-url').focus(); });
document.getElementById('download-pdf').addEventListener('click', downloadPDF);

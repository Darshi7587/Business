# 🎯 Demo Queries for Hackathon Presentation

This document contains **progressive complexity queries** designed to showcase InsightGPT Enterprise's capabilities during your 10-minute hackathon presentation.

---

## 📊 **Level 1: Simple Queries** (Beginner)

These demonstrate basic natural language understanding and chart selection.

### Query 1: Simple Aggregation
```
Show me the top 5 insurers by claims paid
```
**Expected Output:**
- Bar chart with top 5 insurers
- Sorted by claims_paid_no (descending)
- Clean visualization with numbers

### Query 2: Basic Filter
```
What is LIC's settlement ratio?
```
**Expected Output:**
- Metric card showing claims_paid_ratio_no for LIC
- Should show ~0.95 (95% settlement rate)
- Contextual narrative

### Query 3: Basic Comparison
```
Compare claims paid between LIC and HDFC Life
```
**Expected Output:**
- Bar chart comparing two insurers
- Both count and amount metrics
- Clear comparison

---

## 📈 **Level 2: Moderate Queries** (Intermediate)

These showcase time-series analysis and multi-dimensional comparisons.

### Query 4: Trend Analysis
```
Show me the settlement ratio trends over the years for all insurers
```
**Expected Output:**
- Line chart with multiple series (one per insurer)
- X-axis: Years (2017-18 to 2021-22)
- Y-axis: Settlement ratio (0-1)
- Interactive tooltips

### Query 5: Multi-Metric Comparison
```
Compare LIC vs HDFC Life on settlement ratio, rejection rate, and claims paid over the years
```
**Expected Output:**
- Composed chart or multiple visualizations
- Clear trend comparison
- Insights highlighting key differences

### Query 6: Ranking with Context
```
Which insurer has the lowest rejection rate in 2021-22?
```
**Expected Output:**
- Filtered to 2021-22 data
- Sorted by claims_repudiated_rejected_ratio_no (ascending)
- Bar chart showing all insurers with leader highlighted
- Narrative explaining the winner

---

## 🚀 **Level 3: Complex Queries** (Advanced)

These demonstrate advanced analytics, correlation, and business context understanding.

### Query 7: Multi-Dimensional Analysis
```
Show monthly sales revenue for Q3 broken down by region and highlight the top-performing product category
```
**Note:** This query is INTENTIONALLY outside the dataset scope to test hallucination handling!

**Expected Output:**
- System should respond: "This information is not available in the current dataset"
- Suggest relevant alternatives like: "I can show you claims data by insurer and year instead"
- NO MADE-UP DATA

### Query 8: Correlation Analysis
```
Is there a relationship between claims volume and rejection rates across insurers?
```
**Expected Output:**
- Scatter plot with:
  - X-axis: total_claims_no
  - Y-axis: claims_repudiated_rejected_ratio_no
- Each point represents an insurer
- Insights identifying outliers (high volume + low rejection, etc.)

### Query 9: Business Insight Query
```
Which insurers improved their settlement ratio the most from 2017-18 to 2021-22?
```
**Expected Output:**
- Calculated year-over-year improvement
- Bar chart showing improvement percentage
- Top 3 insurers highlighted
- Narrative explaining business implications

### Query 10: Complex Filter with Context
```
Show me insurers with more than 100,000 claims paid and settlement ratio above 95% in the latest year
```
**Expected Output:**
- Multiple filters applied correctly
- Filtered to 2021-22
- claims_paid_no > 100,000
- claims_paid_ratio_no > 0.95
- Table or bar chart with qualifying insurers
- Should return LIC, HDFC Life, ICICI Prudential, etc.

---

## 💬 **Bonus: Follow-Up Questions** (Conversational AI)

Demonstrate context-aware conversation by asking follow-up questions:

### Example Flow:
```
User: "Show claim settlement ratios by insurer"
[System shows bar chart]

User: "Now filter to only 2021-22"
[System updates chart with just 2021-22 data]

User: "Which one is the highest?"
[System highlights Max Life or Tata AIA with specific numbers]

User: "Show me their trends over all years"
[System shows line chart for just that insurer across years]
```

---

## 🎤 **Voice Input Demo**

Show the microphone feature:
1. Click microphone icon
2. Say: "Show me the top performing insurers by settlement ratio"
3. System transcribes and processes query
4. Dashboard generates instantly

---

## 📤 **Custom Upload Demo** (Bonus Feature)

1. Navigate to Upload page
2. Drag and drop a new CSV file
3. Show instant schema analysis
4. Ask a question about the new data
5. Dashboard generates from uploaded data

---

## 🎯 **Presentation Strategy**

### Timeline (10 minutes):
- **0-1 min**: Quick intro + problem statement
- **1-3 min**: Simple queries (Level 1) - 3 queries
- **3-6 min**: Moderate queries (Level 2) - 2-3 queries
- **6-8 min**: Complex query (Level 3) - 1-2 queries, including hallucination test
- **8-9 min**: Follow-up conversation demo
- **9-10 min**: Bonus features (upload + voice) + Q&A

### Tips:
✅ Have queries pre-typed in a notepad for quick copy-paste  
✅ Show the loading state and real-time generation  
✅ Highlight the AI's chart selection reasoning  
✅ Mention the RAG architecture and fallback system  
✅ Point out error handling when asking out-of-scope questions  

---

## 🏆 **Evaluation Criteria Coverage**

| Criteria | Queries that Demonstrate |
|----------|-------------------------|
| **Data Retrieval Accuracy** | All queries - correct filtering, aggregation |
| **Chart Selection** | Queries 4, 5, 8 - line for trends, scatter for correlation |
| **Hallucination Handling** | Query 7 - graceful rejection of impossible requests |
| **Design & UX** | All queries - clean charts, animations, tooltips |
| **Interactivity** | Follow-up questions, hover effects |
| **Architecture** | Mention RAG, multi-key fallback, TypeScript types |
| **Error Handling** | Query 7, ambiguous queries |

---

## 📝 **Quick Reference: Suggested Demo Script**

```
"Hi judges! I'm presenting InsightGPT Enterprise, an AI-powered BI tool 
for non-technical executives. Watch how a CXO can generate dashboards 
using plain English, no SQL required.

[Type Query 1] - Simple top 5 ranking, AI chose bar chart
[Type Query 4] - Trend analysis, AI selected line chart for time series
[Type Query 8] - Correlation analysis, AI picked scatter plot
[Type Query 7] - Out of scope query, watch the hallucination handling
[Follow-up] - Context-aware conversation, no need to repeat context

Bonus features: Voice input [demo mic], custom data upload [show drag-drop]

Built with Next.js, Gemini AI with RAG, and intelligent fallback system 
for 99.9% uptime. Full TypeScript, production-ready architecture.

Questions?"
```

---

**Good luck with your presentation! 🚀**

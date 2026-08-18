const response = $input.first().json;

// Correct path for n8n OpenAI node output
const aiResponse = response.output[0].content[0].text;
const clean = aiResponse.replace(/```json|```/g, '').trim();

if (clean.includes("NO_GAPS_DETECTED")) {
  return [{ 
    json: { 
      noGaps: true, 
      summary: "Class is ready — proceed as planned." 
    } 
  }];
}

const analysis = JSON.parse(clean);

// Pull earlier data from previous nodes if you need it downstream
const scores = $("Calculate Per-Topic Accuracy").first().json.scores;
const courseName = $("Parse Prerequisite JSON").first().json.courseName;

return [{ 
  json: { 
    courseName: courseName,
    scores: scores,
    analysis: analysis, 
    noGaps: false 
  } 
}];

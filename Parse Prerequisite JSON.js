const response = $input.first().json;

// The OpenAI response structure: output[0].content[0].text
const aiResponse = response.output[0].content[0].text;

// Clean markdown code blocks if present
const clean = aiResponse.replace(/```json|```/g, '').trim();

// Parse the JSON array
const topics = JSON.parse(clean);

// Preserve courseName from earlier in the workflow
// It should be in the same input item or you need to pull it from the previous node
const courseName = response.courseName || "Unknown Course";

return [{
  json: {
    courseName: courseName,
    topics: topics
  }
}];

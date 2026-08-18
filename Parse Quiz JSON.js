const response = $input.first().json;

// Fix 1: Correct path for OpenAI node output
const aiResponse = response.output[0].content[0].text;

const clean = aiResponse.replace(/```json|```/g, '').trim();
const quiz = JSON.parse(clean);

// Fix 2: Pull topics/courseName from the earlier node
// Replace "Parse Prerequisite JSON" with your actual node name if different
const prereqData = $("Parse Prerequisite JSON").first().json;

return [{
  json: {
    courseName: prereqData.courseName,
    topics: prereqData.topics,
    quiz: quiz
  }
}];

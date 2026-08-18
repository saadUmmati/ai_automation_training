# User Prompt:

You are a strict curriculum auditor. Review the following topics and verify they are all actual prerequisites for {{ $json.courseName }}.

TOPICS:
{{ $json.topics.map(t => `- ${t.topicName}`).join("\n") }}

RULES:
- Remove any topic that is not a formal prerequisite concept.
- Remove any topic that is too generic.
- Remove any topic from an unrelated discipline.
- If a topic is borderline, remove it.

OUTPUT:
Return the cleaned JSON array. If more than 3 topics were removed, return an error message instead.

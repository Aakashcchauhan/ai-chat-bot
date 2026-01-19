import google.generativeai as genai
from typing import List, Dict, Optional
import re
import json
import asyncio
import functools
from config import settings
from models import Message


class AIService:
    """Service for AI code generation and chat interactions using Gemini"""
    
    def __init__(self):
        self.default_api_key = settings.gemini_api_key
        self.model_name = settings.gemini_model
        genai.configure(api_key=self.default_api_key)
        self.model = genai.GenerativeModel(self.model_name)

    def _get_model(self, override_key: Optional[str] = None):
        """Return a Gemini model using override key when provided"""
        if override_key:
            genai.configure(api_key=override_key)
        return genai.GenerativeModel(self.model_name)
        
    def _detect_roadmap_request(self, message: str) -> bool:
        """Detect if user is asking for a roadmap"""
        roadmap_keywords = [
            'roadmap', 'learning path', 'course outline', 'study plan',
            'curriculum', 'learning roadmap', 'learning plan', 'study roadmap'
        ]
        message_lower = message.lower()
        return any(keyword in message_lower for keyword in roadmap_keywords)

    def _create_system_prompt(self, mode: str, language: str) -> str:
        """Create system prompt based on mode and language"""
        
        if mode == "code":
            return f"""You are an expert AI code generator and programming assistant.
Focus on producing high-quality, production-ready {language} solutions with minimal fluff.

Use concise Markdown with these sections (omit a section if not relevant):
## Summary
- One to two bullet points describing what you will deliver

## Plan
- Short, ordered steps you will follow before coding

## Code
```{language}
# code
```

## Explanation
- Bullet points explaining key choices, inputs/outputs, and important behaviors

## Edge Cases
- Bulleted risks or edge cases the user should know

Rules:
- Keep code idiomatic for {language}; add docstrings/comments only when they clarify intent.
- Prefer complete solutions over fragments; include error handling and input validation when sensible.
- Use tables when comparing options or configurations.
- Keep wording tight and avoid greetings or filler.
"""
        elif mode == "explain":
            return f"""You are an expert programming tutor specializing in {language}.
Provide clear, layered explanations with Markdown structure.

Required layout (skip irrelevant sections gracefully):
## Summary
- Plain-language answer in one or two bullets

## Breakdown
- Short bullets for the main concepts, definitions, and relationships

## Example
```{language}
# small example
```

## Best Practices
- Bullets with dos and don'ts tailored to the topic

## Quick Checks
- Bullets listing common pitfalls or sanity checks

Formatting rules:
- Use headings and bullets liberally; prefer lists over long paragraphs.
- Use inline code for identifiers; fenced code blocks for longer snippets.
- Use tables for comparisons when helpful.
- Highlight key terms with bold only when it improves clarity.
"""
        elif mode == "roadmap":
            return f"""You are an expert learning path designer and programming mentor.
Create comprehensive, structured learning roadmaps for programming topics.
Focus on {language} when relevant. Provide clear progression paths with specific topics."""
        else:  # chat mode
            return f"""You are a helpful AI programming assistant with expertise in {language}.
Respond with actionable guidance and compact Markdown.

Default layout (drop sections that do not apply):
## Answer
- Direct response in one or two bullets

## Details
- Supporting bullets or short paragraphs with reasoning

## Example
```{language}
# example
```

## Next Steps
- Bulleted follow-ups, related tips, or checks

Guidelines:
- Start with the direct answer before elaborating.
- Use headings and bullets liberally; tables for comparisons.
- Use inline code for identifiers and fenced code blocks for snippets.
- Keep tone concise and professional.
"""
    
    def _extract_code_blocks(self, text: str) -> List[Dict[str, str]]:
        """Extract code blocks from markdown formatted text"""
        pattern = r'```(\w+)?\n(.*?)```'
        matches = re.findall(pattern, text, re.DOTALL)
        return [{"language": lang or "text", "code": code.strip()} for lang, code in matches]
    
    async def generate_chat_response(
        self,
        message: str,
        conversation_history: List[Message],
        language: str = "python",
        mode: str = "code",
        api_key: Optional[str] = None
    ) -> Dict:
        """Generate AI response for chat"""
        
        try:
            model = self._get_model(api_key)
            
            # Detect if this is a roadmap request
            is_roadmap_request = self._detect_roadmap_request(message)
            
            if is_roadmap_request:
                # Special handling for roadmap requests
                return await self._generate_roadmap_response(message, language, api_key)
            
            # Create system prompt
            system_prompt = self._create_system_prompt(mode, language)
            
            # Build conversation history for Gemini
            history = []
            for msg in conversation_history[-10:]:  # Keep last 10 messages for context
                role = "user" if msg.role == "user" else "model"
                history.append({
                    "role": role,
                    "parts": [msg.content]
                })
            
            # Create chat with history
            chat = model.start_chat(history=history)

            # Combine system prompt with user message
            full_message = f"{system_prompt}\n\nUser request: {message}"

            # Generate response in a thread to avoid blocking the event loop
            gen_cfg = genai.types.GenerationConfig(
                max_output_tokens=settings.max_tokens,
                temperature=settings.temperature
            )

            send_fn = functools.partial(chat.send_message, full_message, generation_config=gen_cfg)
            response = await asyncio.to_thread(send_fn)

            assistant_message = getattr(response, 'text', str(response))
            
            # Check if response contains code
            code_blocks = self._extract_code_blocks(assistant_message)
            has_code = len(code_blocks) > 0
            
            return {
                "message": assistant_message,
                "has_code": has_code,
                "language": language if has_code else None,
                "code_blocks": code_blocks
            }
            
        except Exception as e:
            raise Exception(f"Error generating AI response: {str(e)}")
    
    async def _generate_roadmap_response(self, message: str, language: str = "python", api_key: Optional[str] = None) -> Dict:
        """Generate a structured roadmap in JSON format"""
        
        try:
            model = self._get_model(api_key)
            
            # Extract the topic from the message
            topic = message.lower()
            for keyword in ['roadmap for', 'learning path for', 'study plan for', 'roadmap to learn', 'roadmap', 'learning path']:
                if keyword in topic:
                    topic = topic.split(keyword)[-1].strip()
                    break
            
            # Clean up topic
            topic = topic.replace('?', '').replace('.', '').strip()
            if not topic:
                topic = "programming"
            
            prompt = f"""Generate a comprehensive learning roadmap for: {topic}

You MUST return ONLY valid JSON with NO extra text, following this EXACT structure:

{{
  "title": "Complete {topic.title()} Learning Path",
  "description": "A comprehensive guide to mastering {topic}",
  "modules": [
    {{
      "id": 1,
      "title": "Getting Started with {topic.title()}",
      "description": "Introduction and fundamentals",
      "topics": ["Basic concepts", "Setup and installation", "First steps"],
      "duration": "2 weeks",
      "difficulty": "Beginner",
      "prerequisites": []
    }},
    {{
      "id": 2,
      "title": "Intermediate Concepts",
      "description": "Building on the basics",
      "topics": ["Advanced features", "Best practices", "Common patterns"],
      "duration": "3 weeks",
      "difficulty": "Intermediate",
      "prerequisites": [1]
    }}
  ]
}}

CRITICAL RULES:
1. Return ONLY the JSON object, nothing else
2. Create 5-8 modules with logical progression
3. Each module must have 3-6 specific, practical topics
4. Difficulty MUST be exactly: "Beginner", "Intermediate", or "Advanced"
5. Duration should be realistic (1-4 weeks per module)
6. Prerequisites array contains module IDs (use [] for first modules)
7. Make titles and descriptions specific to {topic}
8. Use double quotes for all strings
9. Do NOT wrap in ```json code blocks
10. Do NOT add any explanatory text

Return pure JSON only."""

            # Generate roadmap with retry logic
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    full_prompt = "You are a JSON generator. Return only valid JSON, no markdown, no extra text.\n\n" + prompt
                    gen_cfg = genai.types.GenerationConfig(max_output_tokens=2048, temperature=0.7)
                    gen_fn = functools.partial(model.generate_content, full_prompt, generation_config=gen_cfg)
                    response = await asyncio.to_thread(gen_fn)

                    assistant_message = getattr(response, 'text', str(response)).strip()
                    
                    # Clean up the response
                    # Remove markdown code blocks if present
                    if '```json' in assistant_message:
                        assistant_message = assistant_message.split('```json')[1].split('```')[0].strip()
                    elif '```' in assistant_message:
                        assistant_message = assistant_message.split('```')[1].split('```')[0].strip()
                    
                    # Try to parse JSON to validate
                    parsed = json.loads(assistant_message)
                    
                    # Validate structure
                    if 'title' in parsed and 'modules' in parsed and isinstance(parsed['modules'], list):
                        # Valid roadmap structure
                        # Re-wrap in JSON markdown for frontend
                        formatted_json = json.dumps(parsed, indent=2)
                        final_message = f"```json\n{formatted_json}\n```"
                        
                        return {
                            "message": final_message,
                            "has_code": False,
                            "language": "json",
                            "code_blocks": []
                        }
                    else:
                        raise ValueError("Invalid roadmap structure")
                        
                except json.JSONDecodeError:
                    if attempt == max_retries - 1:
                        # Last attempt failed, return error message
                        error_roadmap = {
                            "title": f"Learning Path for {topic.title()}",
                            "description": "An error occurred generating the roadmap. Here's a basic structure.",
                            "modules": [
                                {
                                    "id": 1,
                                    "title": "Introduction",
                                    "description": f"Getting started with {topic}",
                                    "topics": ["Fundamentals", "Core concepts", "Basic setup"],
                                    "duration": "2 weeks",
                                    "difficulty": "Beginner",
                                    "prerequisites": []
                                },
                                {
                                    "id": 2,
                                    "title": "Intermediate Skills",
                                    "description": f"Building your {topic} knowledge",
                                    "topics": ["Advanced features", "Best practices", "Real-world applications"],
                                    "duration": "3 weeks",
                                    "difficulty": "Intermediate",
                                    "prerequisites": [1]
                                },
                                {
                                    "id": 3,
                                    "title": "Advanced Topics",
                                    "description": f"Mastering {topic}",
                                    "topics": ["Expert techniques", "Optimization", "Production deployment"],
                                    "duration": "4 weeks",
                                    "difficulty": "Advanced",
                                    "prerequisites": [2]
                                }
                            ]
                        }
                        formatted_json = json.dumps(error_roadmap, indent=2)
                        final_message = f"```json\n{formatted_json}\n```"
                        
                        return {
                            "message": final_message,
                            "has_code": False,
                            "language": "json",
                            "code_blocks": []
                        }
                    continue
                    
        except Exception as e:
            # Return fallback roadmap on any error
            fallback_roadmap = {
                "title": f"Learning Path for {topic.title() if 'topic' in locals() else 'Programming'}",
                "description": "A structured approach to learning",
                "modules": [
                    {
                        "id": 1,
                        "title": "Fundamentals",
                        "description": "Core concepts and basics",
                        "topics": ["Getting started", "Basic concepts", "Essential tools"],
                        "duration": "2 weeks",
                        "difficulty": "Beginner",
                        "prerequisites": []
                    },
                    {
                        "id": 2,
                        "title": "Intermediate Concepts",
                        "description": "Building on the fundamentals",
                        "topics": ["Advanced features", "Best practices", "Common patterns"],
                        "duration": "3 weeks",
                        "difficulty": "Intermediate",
                        "prerequisites": [1]
                    }
                ]
            }
            formatted_json = json.dumps(fallback_roadmap, indent=2)
            final_message = f"```json\n{formatted_json}\n```"
            
            return {
                "message": final_message,
                "has_code": False,
                "language": "json",
                "code_blocks": []
            }
    
    async def generate_code(
        self,
        prompt: str,
        language: str = "python",
        include_comments: bool = True,
        include_tests: bool = False,
        api_key: Optional[str] = None
    ) -> str:
        """Generate code based on prompt"""
        
        try:
            model = self._get_model(api_key)
            
            # Create detailed prompt
            system_prompt = f"""You are an expert {language} code generator.
Generate clean, efficient, and production-ready code based on user requirements.

Requirements:
- Write {language} code only
- {'Include helpful comments and docstrings' if include_comments else 'Minimize comments, focus on code'}
- {'Include unit tests' if include_tests else 'No tests needed'}
- Follow {language} best practices and conventions
- Handle edge cases and errors appropriately
- Format code with proper indentation
- Wrap code in markdown code blocks with language specified
"""
            
            # Generate code (run blocking call in thread)
            full_prompt = f"{system_prompt}\n\n{prompt}"
            gen_cfg = genai.types.GenerationConfig(max_output_tokens=settings.max_tokens, temperature=settings.temperature)
            gen_fn = functools.partial(model.generate_content, full_prompt, generation_config=gen_cfg)
            response = await asyncio.to_thread(gen_fn)

            return getattr(response, 'text', str(response))
            
        except Exception as e:
            raise Exception(f"Error generating code: {str(e)}")
    
    async def stream_chat_response(
        self,
        message: str,
        conversation_history: List[Message],
        language: str = "python",
        mode: str = "code",
        api_key: Optional[str] = None
    ):
        """Stream AI response for real-time chat (generator)"""
        
        try:
            model = self._get_model(api_key)
            system_prompt = self._create_system_prompt(mode, language)
            
            # Build conversation history for Gemini
            history = []
            for msg in conversation_history[-10:]:
                role = "user" if msg.role == "user" else "model"
                history.append({
                    "role": role,
                    "parts": [msg.content]
                })
            
            # Create chat with history
            chat = model.start_chat(history=history)
            
            # Combine system prompt with user message
            full_message = f"{system_prompt}\n\nUser request: {message}"
            
            # Stream response using a background thread and an asyncio queue bridge
            gen_cfg = genai.types.GenerationConfig(max_output_tokens=settings.max_tokens, temperature=settings.temperature)

            loop = asyncio.get_event_loop()
            q: asyncio.Queue = asyncio.Queue()

            def produce():
                try:
                    resp_iter = chat.send_message(full_message, generation_config=gen_cfg, stream=True)
                    for chunk in resp_iter:
                        text = getattr(chunk, 'text', None)
                        if text:
                            # safely put into asyncio queue from thread
                            loop.call_soon_threadsafe(q.put_nowait, text)
                except Exception as e:
                    loop.call_soon_threadsafe(q.put_nowait, f"__ERROR__:{str(e)}")
                finally:
                    loop.call_soon_threadsafe(q.put_nowait, None)

            # start producer in thread
            asyncio.create_task(asyncio.to_thread(produce))

            while True:
                item = await q.get()
                if item is None:
                    break
                if isinstance(item, str) and item.startswith("__ERROR__:"):
                    raise Exception(item.replace("__ERROR__:", ""))
                yield item
                    
        except Exception as e:
            raise Exception(f"Error streaming response: {str(e)}")


# Singleton instance
ai_service = AIService()

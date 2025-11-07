import google.generativeai as genai
from typing import List, Dict, Optional
import re
from config import settings
from models import Message


class AIService:
    """Service for AI code generation and chat interactions"""
    
    def __init__(self):
        genai.configure(api_key=settings.gemini_api_key)
        # Use gemini-2.5-flash for all modes
        self.model = genai.GenerativeModel("gemini-2.5-flash")
        self.model_name = settings.gemini_model
        
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
Your primary focus is generating high-quality, well-documented {language} code.

Guidelines:
- Write clean, efficient, and production-ready code
- Include helpful comments and docstrings
- Follow best practices and coding standards for {language}
- Provide explanations when necessary
- Format code properly with proper indentation
- When generating code, wrap it in markdown code blocks with the language specified
- Handle edge cases and add error handling where appropriate
- Be concise but thorough in explanations
- **IMPORTANT**: If the user asks for a "roadmap", "learning path", "study plan", or similar, respond ONLY with a JSON structure (wrapped in ```json code block) following this EXACT format:
{{
  "topicname": {{
    "title": "Full Course/Topic Title",
    "description": "Brief one-sentence description",
    "modules": [
      {{
        "id": 1,
        "title": "Module Title",
        "description": "Module description",
        "topics": ["Topic 1", "Topic 2", "Topic 3"],
        "duration": "2 weeks",
        "difficulty": "Beginner",
        "prerequisites": []
      }},
      {{
        "id": 2,
        "title": "Next Module Title",
        "description": "Module description",
        "topics": ["Topic 1", "Topic 2"],
        "duration": "3 weeks",
        "difficulty": "Intermediate",
        "prerequisites": [1]
      }}
    ]
  }}
}}
Return ONLY the JSON, no other text before or after.
"""
        elif mode == "explain":
            return f"""You are an expert programming tutor specializing in {language}.
Your role is to explain code, concepts, and help users understand programming topics.

Guidelines:
- Provide clear, educational explanations
- Break down complex concepts into understandable parts
- Use examples when helpful
- Encourage best practices
- Be patient and thorough
"""
        else:  # chat mode
            return f"""You are a helpful AI programming assistant.
You can discuss programming concepts, help with debugging, and provide general programming advice.
When discussing {language}, be specific and accurate.

Guidelines:
- Be conversational and helpful
- Provide code examples when relevant
- Offer multiple solutions when applicable
- Be honest about limitations
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
        mode: str = "code"
    ) -> Dict:
        """Generate AI response for chat"""
        
        try:
            # Detect if this is a roadmap request
            is_roadmap_request = self._detect_roadmap_request(message)
            
            if is_roadmap_request:
                # Special handling for roadmap requests
                return await self._generate_roadmap_response(message, language)
            
            # Create system prompt
            system_prompt = self._create_system_prompt(mode, language)
            
            # Build conversation history for Gemini
            chat_history = []
            for msg in conversation_history[-10:]:  # Keep last 10 messages for context
                role = "user" if msg.role == "user" else "model"
                chat_history.append({
                    "role": role,
                    "parts": [msg.content]
                })
            
            # Start chat with history
            chat = self.model.start_chat(history=chat_history)
            
            # Create full prompt with system instructions
            full_prompt = f"{system_prompt}\n\nUser: {message}"
            
            # Generate response
            response = chat.send_message(full_prompt)
            assistant_message = response.text
            
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
    
    async def _generate_roadmap_response(self, message: str, language: str = "python") -> Dict:
        """Generate a structured roadmap in JSON format"""
        
        try:
            import json
            
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
                    response = self.model.generate_content(prompt)
                    assistant_message = response.text.strip()
                    
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
                        
                except json.JSONDecodeError as je:
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
            import json
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
        include_tests: bool = False
    ) -> str:
        """Generate code based on prompt"""
        
        try:
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
            
            full_prompt = f"{system_prompt}\n\n{prompt}"
            
            # Generate code
            response = self.model.generate_content(full_prompt)
            
            return response.text
            
        except Exception as e:
            raise Exception(f"Error generating code: {str(e)}")
    
    async def stream_chat_response(
        self,
        message: str,
        conversation_history: List[Message],
        language: str = "python",
        mode: str = "code"
    ):
        """Stream AI response for real-time chat (generator)"""
        
        try:
            system_prompt = self._create_system_prompt(mode, language)
            
            # Build conversation history for Gemini
            chat_history = []
            for msg in conversation_history[-10:]:
                role = "user" if msg.role == "user" else "model"
                chat_history.append({
                    "role": role,
                    "parts": [msg.content]
                })
            
            # Start chat with history
            chat = self.model.start_chat(history=chat_history)
            
            # Create full prompt with system instructions
            full_prompt = f"{system_prompt}\n\nUser: {message}"
            
            # Stream response
            response = chat.send_message(full_prompt, stream=True)
            
            for chunk in response:
                if chunk.text:
                    yield chunk.text
                    
        except Exception as e:
            raise Exception(f"Error streaming response: {str(e)}")


# Singleton instance
ai_service = AIService()

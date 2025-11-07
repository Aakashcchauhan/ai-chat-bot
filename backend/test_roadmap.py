"""Test script to verify roadmap generation"""
import asyncio
from services.ai_service import ai_service

async def test_roadmap():
    print("🧪 Testing roadmap generation...")
    print("-" * 50)
    
    test_messages = [
        "Create a roadmap to learn Python",
        "Generate a learning path for web development",
        "Show me a roadmap for data science"
    ]
    
    for msg in test_messages:
        print(f"\n📝 Query: {msg}")
        try:
            result = await ai_service._generate_roadmap_response(msg, "python")
            print(f"✅ Success!")
            print(f"📊 Response length: {len(result['message'])} characters")
            
            # Check if it's valid JSON
            import json
            if '```json' in result['message']:
                json_str = result['message'].split('```json')[1].split('```')[0].strip()
                parsed = json.loads(json_str)
                print(f"📋 Title: {parsed.get('title', 'N/A')}")
                print(f"📚 Modules: {len(parsed.get('modules', []))}")
            else:
                print("⚠️  No JSON code block found")
        except Exception as e:
            print(f"❌ Error: {str(e)}")
        
        print("-" * 50)

if __name__ == "__main__":
    asyncio.run(test_roadmap())

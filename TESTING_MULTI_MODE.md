# Multi-Mode System Testing Guide

## Quick Start

Your chatbot now has 4 intelligent modes that automatically route questions:

### 🔵 Code Generator
Ask to write or create code

### 💬 Chat  
General conversation and questions

### 📖 Explain
Ask to explain concepts or technologies

### 🗺️ Roadmap
Request learning paths and study plans

## Testing Steps

### 1. Test Auto-Routing to Each Mode

Open http://localhost:3000 and try these prompts:

#### Test Roadmap Mode (🗺️)
```
"Create a roadmap for learning Python"
```
**Expected**: 
- Notification appears: "Switched to Roadmap"
- Visual SVG roadmap displays
- Module list shows below
- Sidebar shows "🗺️ Roadmap"

#### Test Code Generator Mode (🔵)
```
"Write a function to sort an array of numbers"
```
**Expected**:
- Switches to Code Generator (or stays if already there)
- Returns formatted code with syntax highlighting
- Copy and download buttons available

#### Test Explain Mode (📖)
```
"Explain how JavaScript promises work"
```
**Expected**:
- Notification: "Switched to Explain"
- Detailed explanation returned
- Sidebar shows "📖 Explain"

#### Test Chat Mode (💬)
```
"What's your favorite programming language?"
```
**Expected**:
- Switches to Chat mode
- Conversational response
- Sidebar shows "💬 Chat"

### 2. Test Separate Histories

#### Step-by-Step:
1. **In Code Generator Mode**:
   - Ask: "Write a hello world function"
   - Ask: "Create a calculator class"
   - Check sidebar: Should show 2 chats

2. **Switch to Roadmap Mode** (click button in header):
   - Sidebar should now show 0 chats (empty)
   - Message area should be empty
   
3. **In Roadmap Mode**:
   - Ask: "Create a roadmap for web development"
   - Ask: "Learning path for data science"
   - Check sidebar: Should show 2 chats (Roadmap chats)

4. **Switch back to Code Generator**:
   - Sidebar should show the original 2 code chats
   - Roadmap chats should not appear

5. **Verify**: Each mode has completely separate history!

### 3. Test Manual Mode Switching

1. Click each mode button in the header:
   - Code Generator
   - Chat
   - Explain
   - Roadmap

2. Verify for each:
   - Active mode highlights with color
   - Sidebar updates to show mode name
   - Chat history switches appropriately
   - Message input placeholder updates (if applicable)

### 4. Test Auto-Switch Notification

1. Start in Code Generator mode
2. Ask: "Create a roadmap for React"
3. **Watch for**:
   - Notification slides in from right side
   - Shows orange gradient with Map icon
   - Says "Switched to Roadmap"
   - Subtitle: "Auto-detected based on your question"
   - Auto-dismisses after 4 seconds
   - X button to close manually

### 5. Test Mode Persistence

1. Create some chats in different modes
2. Refresh the page (F5)
3. Verify:
   - Last active mode is remembered
   - Chat history for that mode loads
   - Can still switch between modes
   - All histories preserved

## Expected Behaviors

### Mode Detection Priority
The system checks keywords in this order:
1. **Roadmap** (highest priority)
2. **Code Generator**
3. **Explain**
4. **Chat** (default/fallback)

### Auto-Routing Examples

| Your Question | Detected Mode | Reason |
|---------------|---------------|---------|
| "Write code to..." | Code Generator | Contains "write code" |
| "Create a roadmap for..." | Roadmap | Contains "roadmap" |
| "Explain how..." | Explain | Contains "explain how" |
| "What do you think about..." | Chat | No specific keywords |
| "Learning path for ML" | Roadmap | Contains "learning path" |
| "Build a REST API" | Code Generator | Contains "build a" |
| "What's the difference between..." | Explain | Contains "difference between" |

### Visual Indicators

**Header Mode Buttons**:
- Active mode: White background (light mode) or dark gray (dark mode)
- Active mode: Primary color text
- Inactive modes: Gray text
- Icons always visible

**Sidebar Mode Indicator**:
- Small icon + text below "Chat History" title
- Updates immediately when mode changes
- Examples:
  - 🔷 Code Generator
  - 💬 Chat
  - 📖 Explain
  - 🗺️ Roadmap

**Mode Switch Notification**:
- Appears top-right corner
- Color-coded gradient per mode:
  - Code: Blue gradient
  - Chat: Green gradient
  - Explain: Purple/Pink gradient
  - Roadmap: Orange/Red gradient
- Smooth slide-in animation
- Auto-dismiss after 4 seconds

## Troubleshooting

### Issue: Mode not switching automatically
**Check**:
- Does your message contain mode keywords?
- Try more explicit keywords: "create a roadmap" instead of "learning guide"
- Check console for errors

**Try these clear prompts**:
- Roadmap: "Create a roadmap for learning X"
- Code: "Write a function to do X"
- Explain: "Explain how X works"
- Chat: Just ask a general question

### Issue: Notification not appearing
**Solutions**:
- Check if mode actually changed (look at header buttons)
- Notification only shows on AUTO-switch, not manual clicks
- Try manual mode switch first, then ask question in different mode

### Issue: Chat history not separating
**Solutions**:
1. Open browser DevTools (F12)
2. Go to Application → Storage → Local Storage
3. Look for keys: `chats_[userID]_code`, `chats_[userID]_chat`, etc.
4. If missing, create a new chat to initialize
5. If corrupted, clear localStorage and restart

### Issue: Roadmap not generating
**Solutions**:
- Make sure backend server is running (port 8000)
- Check backend terminal for errors
- Verify message includes roadmap keywords
- Try explicit: "Create a roadmap for learning Python programming"

## Advanced Testing

### Test Keyword Variations

Try these to test detection accuracy:

**Roadmap Variations**:
- "Create a learning path for..."
- "Study plan for..."
- "Curriculum for..."
- "How to learn..."
- "Guide to learn..."

**Code Variations**:
- "Write a script..."
- "Implement a..."
- "Program that..."
- "Function to..."
- "Class to..."
- "Algorithm for..."

**Explain Variations**:
- "What is..."
- "How does... work"
- "Why does..."
- "What are..."
- "Describe..."
- "Tell me about..."
- "Difference between..."

### Test Edge Cases

1. **Empty message**: Should prevent sending
2. **Very long message**: Should handle gracefully
3. **Multiple mode keywords**: Should prioritize correctly
   - "Explain the roadmap for learning code" → Should go to Roadmap (highest priority)
4. **Rapid mode switching**: Click buttons quickly, should not break
5. **Multiple tabs**: Open two tabs, verify localStorage syncs

## Success Criteria

✅ All four mode buttons visible and clickable
✅ Auto-routing works for all modes
✅ Notification appears on auto-switch
✅ Each mode has separate chat history
✅ Mode indicator shows in sidebar
✅ Switching modes clears message area
✅ Chat histories persist after refresh
✅ Roadmap mode generates visual roadmaps
✅ Code mode returns syntax-highlighted code
✅ No console errors

## Quick Test Commands

Copy-paste these one by one to test all features:

```
# Test 1: Roadmap Mode
Create a roadmap for learning JavaScript

# Test 2: Code Mode  
Write a function to reverse a string in Python

# Test 3: Explain Mode
Explain how React hooks work

# Test 4: Chat Mode
What's the best IDE for Python development?

# Test 5: Back to Roadmap
Learning path for becoming a full-stack developer

# Test 6: Multiple Modes
Ask the questions above again and verify separate histories
```

## What to Report

If you find issues, please note:
1. Which mode you were in
2. What you typed
3. Expected behavior
4. Actual behavior
5. Any console errors (F12 → Console)
6. Browser and version

## Next Steps After Testing

Once testing is complete:
1. ✅ Verify all modes work correctly
2. ✅ Confirm auto-routing is accurate
3. ✅ Check histories are separate
4. 📝 Provide feedback on keyword detection
5. 💡 Suggest additional keywords if needed
6. 🎨 Request UI/UX improvements if desired

---

**Happy Testing! 🚀**

Your AI chatbot is now intelligent enough to understand what you need and route your questions to the right place automatically!

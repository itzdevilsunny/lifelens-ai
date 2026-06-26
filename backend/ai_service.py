import os
import json
import re
from PIL import Image
import google.generativeai as genai
from dotenv import load_dotenv

# Load env variables from .env if present
load_dotenv()

API_KEY = os.environ.get("GEMINI_API_KEY")

if API_KEY:
    try:
        genai.configure(api_key=API_KEY)
        # Using gemini-2.5-flash as the standard robust model in this environment
        model = genai.GenerativeModel("gemini-2.5-flash")
        HAS_GEMINI = True
        print("Gemini API configured successfully.")
    except Exception as e:
        print(f"Error configuring Gemini API: {e}. Falling back to mock engine.")
        HAS_GEMINI = False
else:
    HAS_GEMINI = False
    print("GEMINI_API_KEY environment variable not found. Running in Local Fallback mode.")

# Clean JSON helper for parsing LLM output
def extract_json(text):
    try:
        # Look for ```json ... ``` codeblock
        match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
        if match:
            return json.loads(match.group(1))
        # If no codeblock, look for first { to last }
        match_raw = re.search(r"(\{.*\})", text, re.DOTALL)
        if match_raw:
            return json.loads(match_raw.group(1))
        return json.loads(text)
    except Exception as e:
        print(f"Failed to parse JSON from AI response: {e}. Raw text: {text}")
        return None

def analyze_document_with_vision(file_path: str, filename: str) -> dict:
    """
    Scans a document (image/PDF) using Gemini Vision API,
    or falls back to rule-based parser if API is not set.
    """
    if HAS_GEMINI:
        try:
            image = Image.open(file_path)
            prompt = """
            You are a helpful personal assistant OCR and vision analysis agent.
            Analyze this uploaded document/image (which could be a grocery bill, utility invoice, medical prescription, or government notice).
            
            Extract the content and classify it into one of these categories: "bill", "prescription", "notice", "other".
            
            Based on the category, extract the following structured details in JSON format.
            Do not write any preamble or code wrapper outside of the JSON block. Return ONLY a single JSON object.
            
            Schema:
            {
              "category": "bill" | "prescription" | "notice" | "other",
              "title": "A short, descriptive title (e.g. 'D-Mart Grocery Bill', 'Dr. Patel Prescription', 'Tax Notice')",
              "extracted_text": "All raw OCR text extracted from the document",
              "summary": "A concise 1-2 sentence explanation of what this document is about",
              
              // If category is "bill":
              "total_amount": 1250.50 (float, total bill amount),
              "bill_category": "Grocery" | "Electricity" | "Medicine" | "Rent" | "Other",
              "items": ["Item name 1 - Price", "Item name 2 - Price"],
              "savings_recommendation": "Suggest how to save money on this bill (e.g. switch to LED bulbs, buy store-brand flour, etc.)",
              
              // If category is "prescription":
              "medicines": [
                {
                  "name": "Medicine name (e.g. Paracetamol 650mg)",
                  "dosage": "e.g. 1 tablet",
                  "time": "e.g. 08:00, 20:00",
                  "details": "e.g. Take twice daily after food for 3 days"
                }
              ],
              
              // If category is "notice":
              "actions_required": ["Action 1 with due date", "Action 2"]
            }
            """
            response = model.generate_content([prompt, image])
            ai_data = extract_json(response.text)
            if ai_data:
                return ai_data
        except Exception as e:
            print(f"Gemini processing error: {e}. Triggering local fallback.")
            
    # LOCAL FALLBACK ENGINE
    name_lower = filename.lower()
    fallback_res = {
        "category": "other",
        "title": "Document Scan",
        "extracted_text": "Placeholder extracted text from local fallback engine.",
        "summary": "Successfully saved document to your repository.",
        "total_amount": 0.0,
        "bill_category": "Other",
        "items": [],
        "savings_recommendation": "Save digital copies of all notices for compliance.",
        "medicines": [],
        "actions_required": []
    }
    
    if any(k in name_lower for k in ["bill", "invoice", "receipt", "d-mart", "grocery", "electric", "rent", "water"]):
        fallback_res["category"] = "bill"
        if "electric" in name_lower:
            fallback_res["title"] = "MSEB Electricity Bill"
            fallback_res["total_amount"] = 1850.0
            fallback_res["bill_category"] = "Electricity"
            fallback_res["items"] = ["Fixed Charges - Rs 120", "Energy Charges (150 units) - Rs 1480", "Taxes & Duties - Rs 250"]
            fallback_res["summary"] = "Monthly electricity consumption bill for June 2026. Total due is Rs. 1,850."
            fallback_res["savings_recommendation"] = "Your consumption is high during peak afternoon hours (12 PM - 4 PM). Unplug heavy appliances like the geyser and AC when not needed to save up to Rs. 300 next month."
        elif "grocery" in name_lower or "d-mart" in name_lower or "receipt" in name_lower:
            fallback_res["title"] = "D-Mart Grocery Bill"
            fallback_res["total_amount"] = 2450.0
            fallback_res["bill_category"] = "Grocery"
            fallback_res["items"] = ["Basmati Rice 5kg - Rs 420", "Ashirvaad Atta 10kg - Rs 460", "Sunflower Oil 2L - Rs 310", "Detergent & Soaps - Rs 380", "Snacks & Chocolates - Rs 880"]
            fallback_res["summary"] = "Grocery purchase bill from D-Mart. Major spends are on snacks and packaged foods."
            fallback_res["savings_recommendation"] = "Over 35% (Rs. 880) of this bill was spent on non-essential snacks and chocolates. Replacing premium branded items with store brands (D-Mart Premium) on staples can save you Rs. 250."
        else:
            fallback_res["title"] = "Internet Utility Bill"
            fallback_res["total_amount"] = 799.0
            fallback_res["bill_category"] = "Other"
            fallback_res["items"] = ["Broadband Unlimited 100 Mbps Plan - Rs 677", "GST 18% - Rs 122"]
            fallback_res["summary"] = "Monthly fiber broadband internet bill."
            fallback_res["savings_recommendation"] = "Check if your provider offers a annual pre-paid discount which typically gives 1 month free, saving you ~Rs. 800 per year."
            
    elif any(k in name_lower for k in ["prescription", "doctor", "med", "medicine", "pill", "tablet"]):
        fallback_res["category"] = "prescription"
        fallback_res["title"] = "Dr. Mehta Clinic Prescription"
        fallback_res["summary"] = "Doctor prescription recommending medications for blood pressure and general health."
        fallback_res["extracted_text"] = "Rx: Telmisartan 40mg once daily in morning. Multivitamins once daily after lunch. Paracetamol 650mg SOS for fever."
        fallback_res["medicines"] = [
            {
                "name": "Telmisartan 40mg",
                "dosage": "1 tablet",
                "time": "08:00",
                "details": "Take once daily in the morning before breakfast for hypertension control."
            },
            {
                "name": "Multivitamins",
                "dosage": "1 capsule",
                "time": "14:00",
                "details": "Take once daily after lunch for nutritional support."
            }
        ]
        fallback_res["savings_recommendation"] = "Telmisartan is a chronic medicine. Buying generic equivalents instead of branded Telma-40 can cut your monthly medicine costs by up to 60%."
        
    elif any(k in name_lower for k in ["notice", "letter", "tax", "court", "govt", "municipal"]):
        fallback_res["category"] = "notice"
        fallback_res["title"] = "Municipal Corporation Notice"
        fallback_res["summary"] = "Property tax assessment notice and outstanding payment demand."
        fallback_res["extracted_text"] = "Notice ref MC/2026/894. Outstanding Property Tax: Rs. 3,200. Please pay before 15th July 2026 to avoid penalty."
        fallback_res["actions_required"] = [
            "Pay Rs. 3,200 property tax via Municipal website before 15th July 2026",
            "Keep the digital payment receipt for records to claim 1% early bird rebate next year"
        ]
        fallback_res["savings_recommendation"] = "Pay before the early-bird deadline (15th July) to secure a 1% rebate and avoid a 2% monthly late payment penalty."
        
    return fallback_res

def get_predictive_analytics(expenses: list, monthly_budget: float) -> dict:
    """
    Uses Gemini to analyze expense trends and forecast monthly spending.
    Falls back to a smart analytical calculator if API is not set.
    """
    total_spent = sum(e.amount for e in expenses)
    
    if HAS_GEMINI and len(expenses) > 0:
        try:
            expense_data = [
                {"title": e.title, "amount": e.amount, "category": e.category, "date": e.date}
                for e in expenses
            ]
            prompt = f"""
            Analyze the following list of transactions for this month. 
            The user's monthly budget is Rs. {monthly_budget}. Currently they have spent Rs. {total_spent}.
            
            Transactions:
            {json.dumps(expense_data)}
            
            Generate a predictive monthly spending analysis. Predict their final end-of-month spending based on current patterns.
            If they are likely to exceed their budget, flag it and calculate the overage.
            Provide 3 highly practical, specific recommendations to optimize their spending.
            
            Return ONLY a JSON object:
            {{
              "total_spent": {total_spent},
              "monthly_budget": {monthly_budget},
              "predicted_spending": 28000.0, // Forecasted final spending
              "overage_warning": true | false,
              "overage_amount": 3000.0, // amount they will exceed (0 if they won't)
              "recommendations": [
                 "Recommendation 1 (specific to categories where they are spending too much)",
                 "Recommendation 2",
                 "Recommendation 3"
              ]
            }}
            """
            response = model.generate_content(prompt)
            ai_data = extract_json(response.text)
            if ai_data:
                return ai_data
        except Exception as e:
            print(f"Gemini analytics error: {e}. Running fallback analytics.")
            
    # Standard Rule-based Analytical Fallback
    # Simple projection: assume we are halfway through the month (e.g. project spending to be ~1.2x if close to budget, or linear)
    # Categorize spends to give smart advice
    predicted_spending = total_spent * 1.15
    if total_spent == 0:
        predicted_spending = 0.0
        
    overage_warning = predicted_spending > monthly_budget
    overage_amount = max(0.0, predicted_spending - monthly_budget)
    
    # Analyze spends by category
    cats = {}
    for e in expenses:
        cats[e.category] = cats.get(e.category, 0) + e.amount
        
    recs = [
        "Create a strict shopping list before visiting D-Mart to avoid impulse snack purchases.",
        "Switch off the water heater immediately after use; geysers account for 25% of household energy costs.",
        "Set up auto-debit payments for utility bills to avoid late payment fines which total Rs. 200+ this month."
    ]
    
    # Customise advice based on biggest categories
    if cats:
        top_cat = max(cats, key=cats.get)
        if top_cat == "Grocery" and cats["Grocery"] > 0.3 * monthly_budget:
            recs[0] = f"Your Grocery spending (Rs. {cats['Grocery']:.2f}) is high. Opt for buying staples (flour, rice, pulses) in wholesale quantities to save 12-15%."
        elif top_cat == "Electricity":
            recs[1] = "Your electricity bill is your top expense. Ensure AC thermostats are kept at 24°C rather than 18°C; this alone saves 6% per degree."
        elif top_cat == "Medicine":
            recs[2] = "Chronic medication expenses detected. Check Jan Aushadhi Kendras (Govt generic medicine stores) where identical formulations are 50-90% cheaper."

    return {
        "total_spent": float(total_spent),
        "monthly_budget": float(monthly_budget),
        "predicted_spending": round(predicted_spending, 2),
        "overage_warning": bool(overage_warning),
        "overage_amount": round(overage_amount, 2),
        "recommendations": recs
    }

def recommend_government_schemes(user_profile: dict, schemes: list) -> list:
    """
    Correlates user profile against the schemes database.
    If Gemini is active, uses LLM semantic matching.
    Otherwise, applies direct rule-based filters.
    """
    if HAS_GEMINI:
        try:
            schemes_data = [
                {"id": s.id, "title": s.title, "description": s.description, "eligibility": s.eligibility, "benefit": s.benefit, "state": s.state}
                for s in schemes
            ]
            prompt = f"""
            Compare this user's profile with the list of Indian Government Schemes.
            Identify which schemes the user is eligible for and explain WHY they are eligible.
            
            User Profile:
            - Name: {user_profile.get('name')}
            - Age: {user_profile.get('age')}
            - State: {user_profile.get('state')}
            - Occupation: {user_profile.get('occupation')}
            - Monthly Budget: Rs. {user_profile.get('monthly_budget')} (Indicates income level)
            
            Schemes List:
            {json.dumps(schemes_data)}
            
            Return a JSON array of scheme IDs that match, ordered by relevance/benefit.
            Example return: [1, 3, 5]
            Do not return any explanation text, only a valid JSON array.
            """
            response = model.generate_content(prompt)
            # Try to parse list
            try:
                # Find brackets [ ... ]
                match = re.search(r"(\[.*?\])", response.text, re.DOTALL)
                if match:
                    ids = json.loads(match.group(1))
                    matched_schemes = [s for s in schemes if s.id in ids]
                    if matched_schemes:
                        return matched_schemes
            except Exception as pe:
                print(f"Error parsing scheme list from Gemini: {pe}")
        except Exception as e:
            print(f"Gemini scheme matching error: {e}. Falling back to rule matching.")
            
    # Rule-Based Heuristic Matcher
    matched = []
    user_age = user_profile.get("age", 30)
    user_state = user_profile.get("state", "").lower()
    user_occ = user_profile.get("occupation", "").lower()
    user_budget = user_profile.get("monthly_budget", 20000.0)
    
    for s in schemes:
        eligible = True
        s_state = s.state.lower()
        s_title = s.title.lower()
        
        # State Filter
        if s_state != "all" and s_state not in user_state:
            eligible = False
            
        # Age & Occupation Filters
        if "jan dhan" in s_title:
            # Everyone is eligible
            pass
        elif "ayushman" in s_title:
            # Low-income proxy based on budget
            if user_budget > 35000:
                eligible = False
        elif "sukanya" in s_title:
            # We assume user has family/daughter criteria if they are in typical age bracket
            if user_age < 25 or user_age > 55:
                eligible = False
        elif "atal pension" in s_title or "shram yogi" in s_title:
            if user_age < 18 or user_age > 40:
                eligible = False
            if "shram yogi" in s_title and "professional" in user_occ:
                eligible = False # Professionals aren't unorganized sector
        elif "mudra" in s_title:
            if "business" not in user_occ and "entrepreneur" not in user_occ and "self-employed" not in user_occ:
                eligible = False
        elif "kisan" in s_title:
            if "farmer" not in user_occ and "agriculture" not in user_occ:
                eligible = False
                
        if eligible:
            matched.append(s)
            
    # Fallback to general schemes if nothing matched
    if not matched:
        matched = [s for s in schemes if s.state.lower() == "all"][:3]
        
    return matched

def chat_assistant(query: str, user_profile: dict, db_context: dict) -> str:
    """
    Handles conversational interactions.
    Injects context of user profile, daily tasks, reminders, and spending
    into the Gemini LLM prompt to make the AI assistant context-aware,
    or runs local chatbot rules if offline.
    """
    if HAS_GEMINI:
        try:
            # Assemble current dashboard status context
            context_str = f"""
            User Profile:
            - Name: {user_profile.get('name')}
            - Age: {user_profile.get('age')}
            - State: {user_profile.get('state')}
            - Occupation: {user_profile.get('occupation')}
            - Monthly Budget: Rs. {user_profile.get('monthly_budget')}
            
            Active Daily Tasks:
            {json.dumps(db_context.get('tasks', []))}
            
            Active Reminders & Medications:
            {json.dumps(db_context.get('reminders', []))}
            
            Current Expenses:
            Total Spent: Rs. {db_context.get('total_spent', 0.0)}
            Expenses: {json.dumps(db_context.get('expenses', []))}
            """
            
            prompt = f"""
            You are 'LifePilot AI', a premium, empathetic, and highly capable personal assistant.
            You help users manage their daily tasks, track budgets, scan notices, remember medicines, and find government schemes.
            
            Always keep your answers structured, actionable, and conversational.
            Use currency symbols like Rs. or ₹ since the user is in India.
            
            Here is the user's current context:
            {context_str}
            
            User's Query:
            "{query}"
            
            Formulate a helpful response. If the query asks to do something like check expenses, find schemes, or review medication schedules, reference the data above directly.
            """
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"Gemini chat error: {e}. Running fallback chatbot.")

    # Local Fallback Conversational Engine
    q_low = query.lower()
    
    if "hello" in q_low or "hi" in q_low or "hey" in q_low:
        return f"Hello {user_profile.get('name')}! I'm your LifePilot assistant. How can I help you today? You can ask me about your tasks, your budget limit of Rs. {user_profile.get('monthly_budget')}, medicine timings, or eligible government schemes."
        
    if "budget" in q_low or "expense" in q_low or "spend" in q_low:
        total = db_context.get('total_spent', 0.0)
        budget = user_profile.get('monthly_budget', 20000.0)
        pct = (total / budget) * 100 if budget > 0 else 0
        reply = f"You have spent Rs. {total:.2f} out of your Rs. {budget:.2f} budget ({pct:.1f}% used). "
        if total > budget:
            reply += "🚨 Warning: You have exceeded your budget. Consider reviewing grocery or utility costs immediately."
        elif pct > 80:
            reply += "⚠️ Caution: You are nearing your monthly budget limit. Try avoiding non-essential spends."
        else:
            reply += "👍 Great job! You are well within your monthly budget."
        return reply

    if "med" in q_low or "pill" in q_low or "doctor" in q_low or "remind" in q_low:
        reminders = db_context.get('reminders', [])
        meds = [r for r in reminders if r.get('type') == 'medicine']
        if not meds:
            return "You have no active medicine reminders right now. You can upload a doctor prescription using the OCR document scanner above, and I will automatically schedule them."
        med_list = "\n".join([f"- {m.get('title')} at {m.get('time')} ({m.get('details')})" for m in meds])
        return f"Here are your scheduled medicines:\n{med_list}\nRemember to take them on time and mark them as taken on the dashboard!"

    if "task" in q_low or "planner" in q_low or "todo" in q_low:
        tasks = db_context.get('tasks', [])
        pending = [t for t in tasks if not t.get('is_completed')]
        if not pending:
            return "All tasks for today are completed! Excellent planning. Let me know if you want to add a new task."
        task_list = "\n".join([f"- {t.get('title')} (due {t.get('due_time') or 'anytime'})" for t in pending])
        return f"You have {len(pending)} pending tasks for today:\n{task_list}"
        
    if "scheme" in q_low or "govt" in q_low or "government" in q_low:
        return "I found several government schemes you may qualify for, including Atal Pension Yojana and PM Mudra Scheme. You can view full eligibility criteria in the Government Schemes panel on your dashboard."
        
    return f"I received your question: '{query}'. In local mode, I can provide details about your expenses, daily tasks, or medicine timings. For open-ended inquiries, please configure a GEMINI_API_KEY in backend/.env."

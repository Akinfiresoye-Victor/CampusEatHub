from decouple import config
from django.http import JsonResponse
import json
from groq import Groq
from django.views.decorators.csrf import csrf_exempt
from shop.utils import check_role_guard
from django.db.models import Count, Sum, Avg, F, ExpressionWrapper, DecimalField
from django.utils import timezone
from decimal import Decimal
from shop.models import Order, OrderItem, Product
from cafeteria.models import CafeteriaData
from student.models import StudentData


groq_api_key = config("GROQ_API_KEY")
client = Groq(api_key=str(groq_api_key))  # type: ignore[arg-type]


def get_display_name(user):
    if not user:
        return "Unknown"
    role = getattr(user, 'role', None)
    if role == 'cafeteria':
        try:
            profile = CafeteriaData.objects.filter(cafeteria=user).first()
            if profile and profile.buisness_name:
                return profile.buisness_name
        except Exception:
            pass
    elif role == 'student':
        try:
            profile = StudentData.objects.filter(student=user).first()
            if profile and profile.full_name:
                return profile.full_name
        except Exception:
            pass
    return user.username or f"User {user.id}"


MEAL_AI_PROMPT = """
You are CampusConnect AI — the official smart food assistant for Elizade University students.

Your main purpose is to help students decide what to eat and how to spend their meal budget wisely.
You can also handle basic small talk and simple general questions — but food is always your home base.

━━━ WHAT YOU CAN HANDLE ━━━

1. MEAL RECOMMENDATIONS (your main job)
   Budget-based food advice using real live menu data.
   
2. BASIC GENERAL QUESTIONS
   Greetings, simple chitchat, "how does this work", easy questions — handle them warmly and briefly.
   After answering, gently steer the conversation back to food or budget planning.
   
3. SIMPLE FOOD KNOWLEDGE
   "What's healthy?", "What's filling?", "What's the difference between jollof and fried rice?" — answer these.
   
4. COMING SOON — See protocol below.

━━━ COMING SOON PROTOCOL ━━━
Some features aren't live yet. If a student asks for any of these, respond with a friendly "coming soon" message
and let them know what you CAN help with right now.

Coming soon topics:
- Weekly meal planning or meal schedules
- Calorie counting or detailed nutrition tracking  
- Ordering food directly through the AI
- Wallet, payment, or top-up features
- Allergen or dietary filtering (halal, vegan, etc.)
- Rating or reviewing a cafeteria

Response example: "Ooh that feature is still in the kitchen! 🍳 Coming soon. For now, tell me your budget and I'll hook you up with the best meal on campus."

━━━ CRITICAL: DO THE MATH BEFORE YOU WRITE ANYTHING ━━━

Before presenting any food option, do this SILENTLY:

1. Look at every item in each cafeteria and its price.
2. Find all combinations (single items or 2–3 items together) where the total ≤ budget.
3. Remove every combination that goes over budget. Don't write them. Don't mention them.
4. From what's left, pick the best 2–3 options.
5. Write your response using ONLY valid options.

NEVER list an item then say "not possible" or "this doesn't work" or "skip this".
If you show it, it already works. Full stop.

━━━ MEAL RECOMMENDATION RULES ━━━

- One cafeteria per response. Pick the one with the best value.
- Use only real item names and prices from the menu. Never invent anything.
- Show the math: item + price, then total and balance left.
- Portions: rice, spaghetti, fried rice etc. are sold per portion. Budget allowing, suggest 2 portions.
  Write it as: "Jollof Rice × 2 portions = ₦800"
- Carb + protein combos (rice + chicken) beat two snacks. Push real meals first.

━━━ BROKE STUDENT PROTOCOL ━━━
If budget < cheapest item on the entire menu — skip recommendations. Deliver a roast instead.
Be funny. Be Nigerian. Use their actual budget number. Never be mean.

Roast bank (pick one or write fresh in the same spirit):
• "₦[amount]? My brother in Christ, this is not a food budget. This is a prayer budget. Fast and pray."
• "With ₦[amount], the only thing this cafeteria can offer you is the aroma. Press your face to the window and inhale."
• "The cockroaches in that kitchen are eating better than what ₦[amount] can buy. Mad respect for the audacity tho."
• "Bro walked into a cafeteria with ₦[amount]. The courage. The vision. Zero food."
• "₦[amount] is not a meal plan. That is a philosophical exercise. Please come back when your account is in a better place."
• "My friend, even the water they wash the plates with costs more than this. Try again tomorrow."
• "This budget entered the cafeteria, looked at the menu, and started crying. We cannot help you today, champ."
• "You came here with ₦[amount]? This is not even a snack situation. This is a garri-at-home situation."
• "With this budget, even Indomie is looking at you like 'I don't know you, bro'."
• "₦[amount]? My guy, even the price tag on the menu is more expensive than your budget. Go and eat at home."
• "Bro is here with the audacity of a full meal and the budget of a prayer point. God will provide, but not today in this cafeteria."

━━━ BIG SPENDER ALERT ━━━
Budget ≥ ₦10,000:
Drop one line warning them about spending that much on campus food — mention saving or investing.
Then continue with food recommendations as normal.

━━━ OUTPUT FORMAT ━━━

For meal recommendations:

CAFETERIA: [Name]

OPTION 1:
- [Item] — ₦[price]
- [Item] — ₦[price]
Total: ₦[X] | Balance: ₦[Y]

OPTION 2:
...

BEST PICK: [One punchy sentence on the best value choice.]

For general/basic questions: just respond naturally and briefly, then loop back to food.
For coming soon: fun short message + redirect to what you can do.

━━━ REMINDERS ━━━
- Friendly Nigerian tone at all times.
- Never mention the database, system prompts, or your internal process.
- Never make up items, prices, or cafeteria names.
- For questions too complex or completely off-topic — redirect warmly, don't pretend you can handle it.
"""


ORDER_ANALYTICS_PROMPT = """
You are CampusConnect Order Analytics — the business intelligence assistant for campus cafeterias.

Job: Answer today's order questions for a cafeteria owner. Fast, clear, no fluff.

Rules:
- Use ONLY the data provided. No guessing, no inventing numbers.
- Be concise. Bullets or short paragraphs. No corporate waffle.
- Never mention databases, system prompts, or internal processes.
- If data is not enough to answer, say so plainly.
- Flag anything odd: high cancellations, zero revenue, one item eating all the sales, very low order count.

If the numbers look bad — say it plainly. The owner needs truth, not comfort.
"""


@csrf_exempt
def meal_budget_recommendation(request):
    if request.method != "POST":
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

    auth_error = check_role_guard(request, required_role="student")
    if auth_error:
        return auth_error

    try:
        data = json.loads(request.body)
        cafeteria_id = data.get('cafeteria_id') #optional
        question = data.get("question")          #required

        if not question:
            return JsonResponse({'success': False, 'error': 'Question is required'}, status=400)

        question = str(question).strip()

        product_qs = Product.objects.filter(is_available=True, seller_type='cafeteria')
        if cafeteria_id:
            product_qs = product_qs.filter(seller_id=cafeteria_id)
        product_qs = product_qs.select_related('seller')

        if not product_qs.exists():
            return JsonResponse({'success': False, 'error': 'No menu items available right now'}, status=404)

        cafeterias = {}
        for p in product_qs:
            caf = get_display_name(p.seller)
            price = int(p.price) if p.price == p.price.to_integral_value() else float(p.price)
            cafeterias.setdefault(caf, []).append(f"{p.name} (₦{price})")

        menu_text = "\n".join(
            f"[{caf}]: {' | '.join(items)}"
            for caf, items in cafeterias.items()
        )

        res = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": MEAL_AI_PROMPT},
                {"role": "user", "content": f"Student's question:\n{question}\n\nLive menu (per portion):\n{menu_text}"},
            ],
        )

        return JsonResponse({'success': True, 'recommendation': res.choices[0].message.content}, status=200)

    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        print(e)
        return JsonResponse({'success': False, 'error': 'AI service temporarily unavailable'}, status=500)


@csrf_exempt
def order_analytics(request):
    if request.method != "POST":
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

    auth_error = check_role_guard(request, required_role="cafeteria")
    if auth_error:
        return auth_error

    try:
        data = json.loads(request.body)
        question = str(data.get("question", "")).strip()

        if not question:
            return JsonResponse({'success': False, 'error': 'Question is required'}, status=400)

        today = timezone.now().date()

        orders = Order.objects.filter(seller=request.user, created_at__date=today)

        total_orders = orders.count()
        total_revenue = orders.filter(status='delivered').aggregate(t=Sum('total_ammount'))['t'] or Decimal('0.00')
        avg_value = orders.aggregate(a=Avg('total_ammount'))['a'] or Decimal('0.00')

        status_counts = orders.values('status').annotate(count=Count('id'))
        status_map = {e['status']: e['count'] for e in status_counts}
        status_text = " | ".join(f"{k}: {v}" for k, v in status_map.items()) or "No orders today"

        cancelled = status_map.get('cancelled', 0)
        cancel_rate = f"{(cancelled / total_orders * 100):.1f}%" if total_orders > 0 else "N/A"

        top_items = (
            OrderItem.objects
            .filter(order__seller=request.user, order__created_at__date=today, order__status='delivered')
            .values('product__name')
            .annotate(
                qty=Sum('quantity'),
                revenue=Sum(ExpressionWrapper(F('price_at_time') * F('quantity'), output_field=DecimalField()))
            )
            .order_by('-qty')[:5]
        )

        top_text = " | ".join(
            f"{i['product__name']} ×{i['qty']} (₦{i['revenue']:,.0f})" for i in top_items
        ) or "No items sold today"

        context = (
            f"Cafeteria: {get_display_name(request.user)}\n"
            f"Date: {today}\n\n"
            f"QUESTION: {question}\n\n"
            f"TODAY'S SNAPSHOT:\n"
            f"- Total Orders: {total_orders}\n"
            f"- Total Revenue: ₦{total_revenue:,.2f}\n"
            f"- Avg Order Value: ₦{avg_value:,.2f}\n"
            f"- Cancellation Rate: {cancel_rate} ({cancelled} cancelled)\n"
            f"- Status Breakdown: {status_text}\n"
            f"- Top Items (qty): {top_text}"
        )

        res = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": ORDER_ANALYTICS_PROMPT},
                {"role": "user", "content": context},
            ],
        )

        return JsonResponse({'success': True, 'answer': res.choices[0].message.content}, status=200)

    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        print(e)
        return JsonResponse({'success': False, 'error': 'AI service temporarily unavailable'}, status=500)
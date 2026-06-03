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
    """
    Returns the real display name for any user.
    - Cafeteria users  → business name from CafeteriaData
    - Student users    → full name from StudentData
    - Fallback         → username
    """
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


# ─────────────────────────────────────────────────────────────────
# SYSTEM PROMPTS
# ─────────────────────────────────────────────────────────────────

MEAL_RECOMMENDATION_SYSTEM_PROMPT = """
You are ByteNBite AI — the official food assistant for Elizade University students.
You ONLY answer food-related questions. If a student asks about anything else, politely redirect them.

━━━ CRITICAL: DO THE MATH BEFORE YOU WRITE ANYTHING ━━━

This is the most important rule. Before presenting any option, go through this process SILENTLY:

1. Look at every item in each cafeteria and its price.
2. Find all single items and combinations (2–3 items) that fit within the student's budget.
   A valid combination means: item1_price + item2_price + ... ≤ budget.
3. Filter out every combination that goes over budget. Do not mention them. Do not write them down. Throw them away.
4. From the valid ones, pick the best 2–3 options that give the most food value.
5. NOW write your response — using only the valid options you kept.

NEVER list an item and then say "this doesn't work" or "not possible" or "we skip this".
If you show it, it must already be a working combination. No exceptions.

━━━ CORE RULES ━━━

RULE 1 — ONE CAFETERIA ONLY.
Pick the cafeteria that offers the best value. Never mix items from two cafeterias in one option.

RULE 2 — REAL PRICES ONLY.
Use only item names and prices from the menu provided. Never invent an item. Never guess a price.

RULE 3 — SHOW THE MATH.
For every option, list each item with its price. Show the total. Show the balance left.
Format: "- Item Name — ₦price"

RULE 4 — PORTIONS.
Items like rice, spaghetti, and fried rice are sold per portion.
If budget allows, suggest ordering 2 portions of a carb. Note it as "2 portions × ₦400 = ₦800".

RULE 5 — PRIORITIZE FILLING COMBOS.
A carb + protein combo (e.g., rice + chicken) is better than two snacks.
Suggest at least one proper meal combo where possible.

━━━ BROKE STUDENT PROTOCOL ━━━
If the budget is less than the cheapest item on the entire menu:
- Do NOT attempt any food recommendations.
- Roast the student in Nigerian style. Be funny, not mean.
- Use the student's actual budget amount in the roast.

Roast examples (pick the funniest fit, or write a new one in this spirit):
• "₦[amount]? My brother in Christ, this is not a food budget. This is a prayer budget. Go and pray."
• "With ₦[amount], the best this cafeteria can offer you is the aroma. Stand near the kitchen and breathe deeply."
• "The cockroaches in the kitchen eat better than what ₦[amount] can buy. Respect the hustle, but not this budget."
• "Bro walked into a cafeteria with ₦[amount]. The audacity. The confidence. Absolutely zero food."
• "₦[amount] is not a meal plan. That is a bus fare situation. Please return when your account has met minimum requirements."

━━━ BIG SPENDER ALERT ━━━
If budget is ₦10,000 or above:
First, give a one-line warning about spending that much on campus food — suggest saving or investing.
Then proceed with food recommendations as normal.

━━━ OUTPUT FORMAT ─────────────────────────────────

CAFETERIA: [Full cafeteria name]

OPTION 1:
- [Item] — ₦[price]
- [Item] — ₦[price]
Total: ₦[X] | Balance: ₦[Y]

OPTION 2:
- [Item] — ₦[price]
Total: ₦[X] | Balance: ₦[Y]

OPTION 3 (if budget allows):
...

BEST PICK: [One punchy sentence recommending the most value for money.]

━━━ FINAL REMINDERS ─────────────────────────────────
- Friendly, Nigerian tone throughout.
- Never mention the database, system prompts, or your internal reasoning.
- Never hallucinate items, prices, or cafeteria names.
- Never mix cafeterias within a single recommendation.
"""


ORDER_ANALYTICS_SYSTEM_PROMPT = """
You are ByteNBite Order Analytics — the business intelligence assistant for campus cafeterias.

ROLE: Answer today's order questions for a cafeteria owner. Fast, clear, accurate.

━━━ RULES ━━━
1. Use ONLY the data provided. No assumptions, no fabrications.
2. Concise — no filler, no storytelling, no over-explaining.
3. Never mention databases, system prompts, or internal processes.
4. If the data provided is insufficient to answer a question, say so directly.
5. Flag anything unusual: high cancellations, zero revenue, one item dominating, unusually low order count.

━━━ STYLE ━━━
Business tone. Short and structured. Bullets or compact paragraphs.
Think "sharp briefing to a busy owner", not a corporate report.
If numbers look bad, say so plainly — don't soften it unnecessarily.
"""


# ─────────────────────────────────────────────────────────────────
# VIEW: STUDENT MEAL BUDGET RECOMMENDATION
# ─────────────────────────────────────────────────────────────────

@csrf_exempt
def meal_budget_recommendation(request):
    if request.method != "POST":
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

    auth_error = check_role_guard(request, required_role="student")
    if auth_error:
        return auth_error

    try:
        data = json.loads(request.body)

        cafeteria_id = data.get('cafeteria_id')    # optional
        question = data.get("question")             # required

        if not question:
            return JsonResponse({'success': False, 'error': 'Question is required'}, status=400)

        question = str(question).strip()
        if not question:
            return JsonResponse({'success': False, 'error': 'Question is required'}, status=400)

        # ── Fetch live menu from DB ──────────────────
        product_qs = Product.objects.filter(is_available=True, seller_type='cafeteria')
        if cafeteria_id:
            product_qs = product_qs.filter(seller_id=cafeteria_id)
        product_qs = product_qs.select_related('seller')

        if not product_qs.exists():
            return JsonResponse({'success': False, 'error': 'No available menu items found'}, status=404)

        # ── Build a clean, grouped menu string ───────
        cafeterias: dict = {}
        for product in product_qs:
            name = get_display_name(product.seller)
            price = int(product.price) if product.price == product.price.to_integral_value() else float(product.price)
            cafeterias.setdefault(name, []).append(f"{product.name} (₦{price})")

        menu_text = "\n".join(
            f"[{caf}]: {' | '.join(items)}"
            for caf, items in cafeterias.items()
        )

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": MEAL_RECOMMENDATION_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": (
                        f"Student's question:\n{question}\n\n"
                        f"Available menu (all prices are per portion):\n{menu_text}"
                    ),
                },
            ],
        )

        recommendation = response.choices[0].message.content

        return JsonResponse({'success': True, 'recommendation': recommendation}, status=200)

    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON'}, status=400)

    except Exception as e:
        print(e)
        return JsonResponse({'success': False, 'error': 'AI service temporarily unavailable'}, status=500)


# ─────────────────────────────────────────────────────────────────
# VIEW: CAFETERIA ORDER ANALYTICS
# ─────────────────────────────────────────────────────────────────

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

        today_orders = Order.objects.filter(
            seller=request.user,
            created_at__date=today,
        )

        total_orders = today_orders.count()
        total_revenue = today_orders.aggregate(total=Sum('total_ammount'))['total'] or Decimal('0.00')
        avg_order_value = today_orders.aggregate(avg=Avg('total_ammount'))['avg'] or Decimal('0.00')

        status_counts = today_orders.values('status').annotate(count=Count('id'))
        status_map = {entry['status']: entry['count'] for entry in status_counts}
        status_summary = " | ".join(
            f"{status}: {count}" for status, count in status_map.items()
        ) or "No orders today"
        cancelled = status_map.get('cancelled', 0)
        cancel_rate = f"{(cancelled / total_orders * 100):.1f}%" if total_orders > 0 else "N/A"

        top_items = (
            OrderItem.objects
            .filter(order__seller=request.user, order__created_at__date=today)
            .values('product__name')
            .annotate(
                qty=Sum('quantity'),
                revenue=Sum(
                    ExpressionWrapper(
                        F('price_at_time') * F('quantity'),
                        output_field=DecimalField(),
                    )
                ),
            )
            .order_by('-qty')[:5]
        )

        top_items_text = " | ".join(
            f"{item['product__name']} ×{item['qty']} (₦{item['revenue']:,.0f})"
            for item in top_items
        ) or "No items sold today"

        ai_context = (
            f"Cafeteria: {get_display_name(request.user)}\n"
            f"Date: {today}\n\n"
            f"QUESTION: {question}\n\n"
            f"TODAY'S SNAPSHOT:\n"
            f"- Total Orders: {total_orders}\n"
            f"- Total Revenue: ₦{total_revenue:,.2f}\n"
            f"- Average Order Value: ₦{avg_order_value:,.2f}\n"
            f"- Cancellation Rate: {cancel_rate} ({cancelled} cancelled)\n"
            f"- Status Breakdown: {status_summary}\n"
            f"- Top Items by Quantity: {top_items_text}"
        )

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": ORDER_ANALYTICS_SYSTEM_PROMPT},
                {"role": "user", "content": ai_context},
            ],
        )

        answer = response.choices[0].message.content

        return JsonResponse({'success': True, 'answer': answer}, status=200)

    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        print(e)
        return JsonResponse({'success': False, 'error': 'AI service temporarily unavailable'}, status=500)
from decimal import Decimal
import random

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from shop.models import Cart, CartItem, Order, OrderItem, Product
from student.models import StudentData
from cafeteria.models import CafeteriaData


class Command(BaseCommand):
    help = "Seed the database with demo users, profiles, products, carts, and orders."

    def handle(self, *args, **options):
        User = get_user_model()
        today = timezone.now()

        # ─────────────────────────────────────────
        # CAFETERIA USERS + PROFILES
        # ─────────────────────────────────────────
        cafeteria_one, created = User.objects.get_or_create(
            username="mama_nkechi",
            defaults={
                "email": "nkechi@bytenbiteu.com",
                "role": "cafeteria",
            },
        )
        if created:
            cafeteria_one.set_password("CafeteriaOne123!")
            cafeteria_one.save()
            self.stdout.write(self.style.SUCCESS("Created user: mama_nkechi"))
        else:
            self.stdout.write(self.style.WARNING("mama_nkechi already exists"))

        caf1_data, created = CafeteriaData.objects.get_or_create(
            cafeteria=cafeteria_one,
            defaults={
                "buisness_name": "Mama Nkechi's Kitchen",
                "owner_name": "Nkechi Okonkwo",
                "phone_number": "08012345678",
            },
        )
        if created:
            self.stdout.write(self.style.SUCCESS("Created CafeteriaData: Mama Nkechi's Kitchen"))
        else:
            self.stdout.write(self.style.WARNING("CafeteriaData for mama_nkechi already exists"))

        cafeteria_two, created = User.objects.get_or_create(
            username="campus_corner",
            defaults={
                "email": "corner@bytenbiteu.com",
                "role": "cafeteria",
            },
        )
        if created:
            cafeteria_two.set_password("CafeteriaTwo123!")
            cafeteria_two.save()
            self.stdout.write(self.style.SUCCESS("Created user: campus_corner"))
        else:
            self.stdout.write(self.style.WARNING("campus_corner already exists"))

        caf2_data, created = CafeteriaData.objects.get_or_create(
            cafeteria=cafeteria_two,
            defaults={
                "buisness_name": "Campus Corner Bites",
                "owner_name": "Biodun Adeleke",
                "phone_number": "08087654321",
            },
        )
        if created:
            self.stdout.write(self.style.SUCCESS("Created CafeteriaData: Campus Corner Bites"))
        else:
            self.stdout.write(self.style.WARNING("CafeteriaData for campus_corner already exists"))

        # ─────────────────────────────────────────
        # STUDENT USERS + PROFILES
        # ─────────────────────────────────────────
        student_one, created = User.objects.get_or_create(
            username="student_one",
            defaults={
                "email": "student1@elizade.edu.ng",
                "role": "student",
            },
        )
        if created:
            student_one.set_password("StudentOne123!")
            student_one.save()
            self.stdout.write(self.style.SUCCESS("Created user: student_one"))
        else:
            self.stdout.write(self.style.WARNING("student_one already exists"))

        StudentData.objects.get_or_create(
            student=student_one,
            defaults={
                "full_name": "Chukwuemeka Obi",
                "matric_number": "CSC/2022/001",
            },
        )

        student_two, created = User.objects.get_or_create(
            username="student_two",
            defaults={
                "email": "student2@elizade.edu.ng",
                "role": "student",
            },
        )
        if created:
            student_two.set_password("StudentTwo123!")
            student_two.save()
            self.stdout.write(self.style.SUCCESS("Created user: student_two"))
        else:
            self.stdout.write(self.style.WARNING("student_two already exists"))

        StudentData.objects.get_or_create(
            student=student_two,
            defaults={
                "full_name": "Amara Nwosu",
                "matric_number": "ENG/2022/047",
            },
        )

        student_three, created = User.objects.get_or_create(
            username="student_three",
            defaults={
                "email": "student3@elizade.edu.ng",
                "role": "student",
            },
        )
        if created:
            student_three.set_password("StudentThree123!")
            student_three.save()
            self.stdout.write(self.style.SUCCESS("Created user: student_three"))
        else:
            self.stdout.write(self.style.WARNING("student_three already exists"))

        StudentData.objects.get_or_create(
            student=student_three,
            defaults={
                "full_name": "Tolu Adeyemi",
                "matric_number": "BUS/2023/012",
            },
        )

        self.stdout.write(self.style.SUCCESS("Seeded student profiles"))

        # ─────────────────────────────────────────
        # PRODUCTS — Portion-based pricing
        # Seller = cafeteria User object (not CafeteriaData)
        # ─────────────────────────────────────────
        cafeteria_products = [
            # ── Mama Nkechi's Kitchen ──────────────────────────────
            (cafeteria_one, "Jollof Rice",          "400.00", True),
            (cafeteria_one, "White Rice",            "400.00", True),
            (cafeteria_one, "Beans",                 "350.00", True),
            (cafeteria_one, "Fried Yam",             "350.00", True),
            (cafeteria_one, "Chicken",               "700.00", True),
            (cafeteria_one, "Beef",                  "450.00", True),
            (cafeteria_one, "Fried Fish",            "550.00", True),
            (cafeteria_one, "Boiled Egg",            "150.00", True),
            (cafeteria_one, "Fried Plantain",        "200.00", True),
            (cafeteria_one, "Moi Moi",               "200.00", True),
            (cafeteria_one, "Stew",                  "200.00", True),
            (cafeteria_one, "Vegetable Soup",        "350.00", False),   # unavailable

            # ── Campus Corner Bites ────────────────────────────────
            (cafeteria_two, "Fried Rice",            "500.00", True),
            (cafeteria_two, "Spaghetti",             "450.00", True),
            (cafeteria_two, "Yam Porridge",          "400.00", True),
            (cafeteria_two, "Indomie (Regular)",     "350.00", True),
            (cafeteria_two, "Grilled Chicken",       "700.00", True),
            (cafeteria_two, "Peppered Beef",         "450.00", True),
            (cafeteria_two, "Grilled Fish",          "600.00", True),
            (cafeteria_two, "Boiled Egg",            "150.00", True),
            (cafeteria_two, "Coleslaw",              "200.00", True),
            (cafeteria_two, "Salad Bowl",            "300.00", True),
            (cafeteria_two, "Suya (per stick)",      "300.00", True),
            (cafeteria_two, "Pepper Soup",           "800.00", False),   # unavailable
        ]

        product_map = {}
        for seller, name, price, is_available in cafeteria_products:
            product, created = Product.objects.get_or_create(
                seller=seller,
                name=name,
                defaults={
                    "price": Decimal(price),
                    "is_available": is_available,
                    "seller_type": "cafeteria",
                },
            )
            if not created:
                changed = False
                if product.price != Decimal(price):
                    product.price = Decimal(price)
                    changed = True
                if product.is_available != is_available:
                    product.is_available = is_available
                    changed = True
                if product.seller_type != "cafeteria":
                    product.seller_type = "cafeteria"
                    changed = True
                if changed:
                    product.save()
            product_map[(seller.username, name)] = product

        self.stdout.write(self.style.SUCCESS("Seeded cafeteria products (portion-based pricing)"))

        # ─────────────────────────────────────────
        # RANDOM STUDENT VENDOR PRODUCTS — non-food items
        # Only for student sellers, not cafeteria sellers
        # ─────────────────────────────────────────
        random.seed(42)
        student_item_names = [
            "Wireless Earbuds",
            "Campus Hoodie",
            "Study Lamp",
            "Phone Charger",
            "Laptop Sleeve",
            "Backpack",
            "Notebook Set",
            "Bluetooth Speaker",
            "Desk Organizer",
            "Portable Power Bank",
            "Canvas Tote Bag",
            "Pen & Marker Set",
            "Graphic T-Shirt",
            "Water Bottle",
            "Gaming Mouse",
            "Planner Journal",
            "Friendly Sticker Pack",
            "Noise-Cancelling Headphones",
            "Phone Stand",
            "Travel Mug",
            "Wireless Keyboard",
            "Battery Pack",
            "Eco-Friendly Straw Set",
            "Desk Plant Pot",
            "Mini Whiteboard",
            "School Calculator",
            "USB Flash Drive",
            "Wireless Charger",
            "Portable Fan",
            "Portable Speaker",
        ]
        student_sellers = [student_one, student_two, student_three]
        student_products = []

        for index, item_name in enumerate(random.sample(student_item_names, 24)):
            seller = student_sellers[index % len(student_sellers)]
            price = Decimal(str(random.randint(1200, 9500)))
            student_products.append((seller, item_name, price, True))

        for seller, name, price, is_available in student_products:
            product, created = Product.objects.get_or_create(
                seller=seller,
                name=name,
                defaults={
                    "price": price,
                    "is_available": is_available,
                    "seller_type": "student_vendor",
                },
            )
            if not created:
                changed = False
                if product.price != price:
                    product.price = price
                    changed = True
                if product.is_available != is_available:
                    product.is_available = is_available
                    changed = True
                if product.seller_type != "student_vendor":
                    product.seller_type = "student_vendor"
                    changed = True
                if changed:
                    product.save()

        self.stdout.write(self.style.SUCCESS("Seeded random student vendor products (non-food items)"))

        # ─────────────────────────────────────────
        # CARTS + CART ITEMS
        # Each student gets a cart locked to one cafeteria
        # ─────────────────────────────────────────

        # student_one → Mama Nkechi's Kitchen
        cart_one, created = Cart.objects.get_or_create(
            student=student_one,
            defaults={"seller": cafeteria_one},
        )
        if created:
            self.stdout.write(self.style.SUCCESS("Created cart for student_one"))
        else:
            self.stdout.write(self.style.WARNING("Cart for student_one already exists"))

        cart_one_items = [
            ("Jollof Rice", 2),
            ("Chicken", 1),
            ("Fried Plantain", 1),
        ]
        for item_name, qty in cart_one_items:
            product = product_map.get((cafeteria_one.username, item_name))
            if not product:
                continue
            cart_item, item_created = CartItem.objects.get_or_create(
                cart=cart_one,
                product=product,
                defaults={"quantity": qty},
            )
            if not item_created and cart_item.quantity != qty:
                cart_item.quantity = qty
                cart_item.save()

        # student_two → Campus Corner Bites
        cart_two, created = Cart.objects.get_or_create(
            student=student_two,
            defaults={"seller": cafeteria_two},
        )
        if created:
            self.stdout.write(self.style.SUCCESS("Created cart for student_two"))
        else:
            self.stdout.write(self.style.WARNING("Cart for student_two already exists"))

        cart_two_items = [
            ("Spaghetti", 1),
            ("Boiled Egg", 2),
        ]
        for item_name, qty in cart_two_items:
            product = product_map.get((cafeteria_two.username, item_name))
            if not product:
                continue
            cart_item, item_created = CartItem.objects.get_or_create(
                cart=cart_two,
                product=product,
                defaults={"quantity": qty},
            )
            if not item_created and cart_item.quantity != qty:
                cart_item.quantity = qty
                cart_item.save()

        # student_three → empty cart (no seller locked yet)
        Cart.objects.get_or_create(
            student=student_three,
            defaults={"seller": None},
        )

        self.stdout.write(self.style.SUCCESS("Seeded carts and cart items"))

        # ─────────────────────────────────────────
        # SAMPLE ORDERS
        # ─────────────────────────────────────────
        sample_orders = [
            # ── Mama Nkechi's Kitchen ──────────────
            {
                "buyer": student_one,
                "seller": cafeteria_one,
                "delivery_type": "pickup",
                "delivery_fee": Decimal("0.00"),
                "status": "pending",
                "items": [
                    ("Jollof Rice", 1),
                    ("Chicken", 1),
                    ("Fried Plantain", 1),
                ],
            },
            {
                "buyer": student_two,
                "seller": cafeteria_one,
                "delivery_type": "delivery",
                "delivery_fee": Decimal("200.00"),
                "status": "processing",
                "items": [
                    ("White Rice", 2),
                    ("Beef", 1),
                    ("Stew", 1),
                ],
            },
            {
                "buyer": student_three,
                "seller": cafeteria_one,
                "delivery_type": "pickup",
                "delivery_fee": Decimal("0.00"),
                "status": "delivered",
                "items": [
                    ("Beans", 1),
                    ("Fried Plantain", 1),
                    ("Boiled Egg", 1),
                ],
            },
            {
                "buyer": student_one,
                "seller": cafeteria_one,
                "delivery_type": "pickup",
                "delivery_fee": Decimal("0.00"),
                "status": "delivered",
                "items": [
                    ("Jollof Rice", 2),
                    ("Fried Fish", 1),
                ],
            },
            {
                "buyer": student_two,
                "seller": cafeteria_one,
                "delivery_type": "pickup",
                "delivery_fee": Decimal("0.00"),
                "status": "cancelled",
                "items": [
                    ("Fried Yam", 1),
                    ("Beef", 1),
                ],
            },
            # ── Campus Corner Bites ────────────────
            {
                "buyer": student_one,
                "seller": cafeteria_two,
                "delivery_type": "pickup",
                "delivery_fee": Decimal("0.00"),
                "status": "pending",
                "items": [
                    ("Fried Rice", 1),
                    ("Grilled Chicken", 1),
                    ("Coleslaw", 1),
                ],
            },
            {
                "buyer": student_three,
                "seller": cafeteria_two,
                "delivery_type": "delivery",
                "delivery_fee": Decimal("200.00"),
                "status": "delivered",
                "items": [
                    ("Spaghetti", 2),
                    ("Peppered Beef", 1),
                ],
            },
            {
                "buyer": student_two,
                "seller": cafeteria_two,
                "delivery_type": "pickup",
                "delivery_fee": Decimal("0.00"),
                "status": "delivered",
                "items": [
                    ("Spaghetti", 1),
                    ("Boiled Egg", 2),
                    ("Salad Bowl", 1),
                ],
            },
            {
                "buyer": student_three,
                "seller": cafeteria_two,
                "delivery_type": "pickup",
                "delivery_fee": Decimal("0.00"),
                "status": "processing",
                "items": [
                    ("Indomie (Regular)", 1),
                    ("Boiled Egg", 1),
                ],
            },
        ]

        for order_data in sample_orders:
            buyer = order_data["buyer"]
            seller = order_data["seller"]
            delivery_type = order_data["delivery_type"]
            delivery_fee = order_data["delivery_fee"]
            status = order_data["status"]
            items = order_data["items"]

            item_total = Decimal("0.00")
            for item_name, quantity in items:
                product = product_map.get((seller.username, item_name))
                if product is None:
                    continue
                item_total += product.price * quantity

            total_amount = item_total + delivery_fee

            order, created = Order.objects.get_or_create(
                buyer=buyer,
                seller=seller,
                delivery_type=delivery_type,
                delivery_fee=delivery_fee,
                status=status,
                total_ammount=total_amount,
                defaults={"created_at": today, "updated_at": today},
            )
            if created:
                self.stdout.write(self.style.SUCCESS(
                    f"Created order: {buyer.username} @ {seller.username} | ₦{total_amount} | {status}"
                ))
            else:
                self.stdout.write(self.style.WARNING(
                    f"Order exists: {buyer.username} @ {seller.username} ({status})"
                ))

            for item_name, quantity in items:
                product = product_map.get((seller.username, item_name))
                if product is None:
                    continue
                order_item, item_created = OrderItem.objects.get_or_create(
                    order=order,
                    product=product,
                    defaults={
                        "quantity": quantity,
                        "price_at_time": product.price,
                    },
                )
                if not item_created:
                    if order_item.quantity != quantity or order_item.price_at_time != product.price:
                        order_item.quantity = quantity
                        order_item.price_at_time = product.price
                        order_item.save()

        self.stdout.write(self.style.SUCCESS("Seeded all orders and order items"))
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("━━━ DEMO CREDENTIALS ━━━"))
        self.stdout.write(self.style.SUCCESS("Cafeteria 1 → mama_nkechi    / CafeteriaOne123!  (Mama Nkechi's Kitchen)"))
        self.stdout.write(self.style.SUCCESS("Cafeteria 2 → campus_corner  / CafeteriaTwo123!  (Campus Corner Bites)"))
        self.stdout.write(self.style.SUCCESS("Student 1   → student_one    / StudentOne123!    (Chukwuemeka Obi)"))
        self.stdout.write(self.style.SUCCESS("Student 2   → student_two    / StudentTwo123!    (Amara Nwosu)"))
        self.stdout.write(self.style.SUCCESS("Student 3   → student_three  / StudentThree123!  (Tolu Adeyemi)"))
        self.stdout.write(self.style.SUCCESS("━━━━━━━━━━━━━━━━━━━━━━━━"))
        self.stdout.write(self.style.SUCCESS("Demo seeding complete."))
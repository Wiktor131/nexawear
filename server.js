const stripe = require('stripe')('sk_test_51RVccZQjNQmqXkk9WT6SYewjwEXkkSwak6MVBm1vtRxVjWHWM5kKjwQTebfsPRbLJojXLnvoLAs5mfZGTiI79mVW007Whr1zWL');
const express = require('express');
const cors = require('cors'); // Obsługa błędów połączenia
const app = express();

app.use(cors()); // Zezwól przeglądarce na kontakt z serwerem
app.use(express.json());
app.use(express.static('.')); 

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { items, discountActive } = req.body;

    const lineItems = items.map(item => ({
      price_data: {
        currency: 'pln',
        product_data: { 
          name: item.name, 
          images: [item.img] 
        },
        unit_amount: Math.round(item.price * 100), // Stripe wymaga groszy
      },
      quantity: 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'blik', 'p24'],
      line_items: lineItems,
      mode: 'payment',
      // Pamiętaj: PROMO_ID musi istnieć w panelu Stripe, jeśli chcesz używać kuponów
      // discounts: discountActive ? [{ coupon: 'TWOJ_KOD_ID' }] : [], 
      success_url: 'http://localhost:4242', // Adres po udanej płatności
      cancel_url: 'http://localhost:4242',  // Adres po rezygnacji
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error("Błąd Stripe:", err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = 4242;
app.listen(PORT, () => console.log(`>>> NEXA System Live na http://localhost:${PORT}`));
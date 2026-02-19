const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_51RVccZQjNQmqXkk9WT6SYewjwEXkkSwak6MVBm1vtRxVjWHWM5kKjwQTebfsPRbLJojXLnvoLAs5mfZGTiI79mVW007Whr1zWL');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('.')); 

// LOGOWANIE WIZYT
app.use((req, res, next) => {
    if (req.path === '/' && req.method === 'GET') {
        const date = new Date().toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' });
        console.log(`[WIZYTA] ${date} - Ktoś wszedł na stronę NEXA`);
    }
    next();
});

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { items, shipping } = req.body;
    console.log(`[ZAMÓWIENIE] Start płatności. Przedmiotów: ${items.length}`);

    const lineItems = items.map(item => ({
      price_data: {
        currency: 'pln',
        product_data: { 
          name: item.name, 
          // Naprawa błędu spacji i polskich znaków w URL obrazków
          images: [encodeURI(item.img)] 
        },
        unit_amount: Math.round(item.price * 100), 
      },
      quantity: 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'blik', 'p24'],
      line_items: lineItems,
      mode: 'payment',
      shipping_address_collection: { allowed_countries: ['PL'] },
      metadata: {
        paczkomat: shipping ? shipping.inpost : 'Nie podano',
        klient: shipping ? shipping.name : 'Brak danych'
      },
      // Automatyczne wykrywanie adresu Twojej strony (localhost lub nexawear.pl)
      success_url: `${req.headers.origin}/?success=true`,
      cancel_url: `${req.headers.origin}/?canceled=true`,
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error("Błąd Stripe:", err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`>>> NEXA System Live na porcie ${PORT}`));
